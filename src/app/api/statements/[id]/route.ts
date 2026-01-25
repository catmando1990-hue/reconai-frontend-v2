import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE /api/statements/[id]
 *
 * Delete a bank statement and its file from storage.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing statement ID", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Fetch statement to verify ownership and get storage path
    const { data: statement, error: fetchError } = await supabase
      .from("bank_statements")
      .select("id, user_id, storage_path")
      .eq("id", id)
      .single();

    if (fetchError || !statement) {
      return NextResponse.json(
        { error: "Statement not found", request_id: requestId },
        { status: 404, headers: { "x-request-id": requestId } }
      );
    }

    // Verify ownership
    if (statement.user_id !== userId) {
      return NextResponse.json(
        { error: "Access denied", request_id: requestId },
        { status: 403, headers: { "x-request-id": requestId } }
      );
    }

    // Delete from storage
    if (statement.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("bank-statements")
        .remove([statement.storage_path]);

      if (storageError) {
        console.error("[Statement delete] Storage error:", storageError);
        // Continue with DB delete even if storage fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("bank_statements")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("[Statement delete] Database error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete statement", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    return NextResponse.json(
      { success: true, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } }
    );
  } catch (error) {
    console.error("[Statement delete] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
