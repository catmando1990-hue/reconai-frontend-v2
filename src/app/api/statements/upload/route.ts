import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/statements/upload
 * 
 * Upload a bank statement file linked to a specific account.
 * - Validates file type and size
 * - Requires account_id
 * - Uploads to Supabase Storage
 * - Creates metadata record in bank_statements table
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_EXTENSIONS = ["pdf", "csv", "ofx", "qfx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  csv: "text/csv",
  ofx: "application/x-ofx",
  qfx: "application/x-qfx",
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const accountId = formData.get("account_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Generate unique storage path: user_id/account_id/timestamp_filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${accountId}/${timestamp}_${safeName}`;

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("bank-statements")
      .upload(storagePath, buffer, {
        contentType: MIME_TYPES[ext] || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload] Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Create metadata record
    const { data, error: dbError } = await supabase
      .from("bank_statements")
      .insert({
        user_id: userId,
        account_id: accountId,
        file_name: file.name,
        file_type: ext,
        file_size: file.size,
        storage_path: storagePath,
        status: "uploaded",
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Upload] Database error:", dbError);
      // Attempt to clean up uploaded file
      await supabase.storage.from("bank-statements").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to save statement record", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        statement: data,
        request_id: requestId,
      },
      { status: 201, headers: { "x-request-id": requestId } }
    );
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
