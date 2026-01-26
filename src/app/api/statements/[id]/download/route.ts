import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/statements/[id]/download
 *
 * Download a bank statement file.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  try {
    // Lazy initialization - safe during build
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Storage service not configured", request_id: requestId },
        { status: 503, headers: { "x-request-id": requestId } },
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing statement ID", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Fetch statement to verify ownership and get storage path
    const { data: statement, error: fetchError } = await supabase
      .from("bank_statements")
      .select("id, user_id, storage_path, file_name, file_type")
      .eq("id", id)
      .single();

    if (fetchError || !statement) {
      return NextResponse.json(
        { error: "Statement not found", request_id: requestId },
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    // Verify ownership
    if (statement.user_id !== userId) {
      return NextResponse.json(
        { error: "Access denied", request_id: requestId },
        { status: 403, headers: { "x-request-id": requestId } },
      );
    }

    if (!statement.storage_path) {
      return NextResponse.json(
        { error: "File not found", request_id: requestId },
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    // Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("bank-statements")
      .download(statement.storage_path);

    if (downloadError || !fileData) {
      console.error("[Statement download] Storage error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Determine content type
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      csv: "text/csv",
      ofx: "application/x-ofx",
      qfx: "application/x-qfx",
    };
    const contentType =
      contentTypes[statement.file_type] || "application/octet-stream";

    // Return file as response
    const arrayBuffer = await fileData.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${statement.file_name}"`,
        "x-request-id": requestId,
      },
    });
  } catch (error) {
    console.error("[Statement download] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
