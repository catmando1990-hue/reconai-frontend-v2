import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

/**
 * DELETE /api/plaid/items/[itemId]
 *
 * Removes a Plaid item (bank connection):
 * 1. Validates user owns the item
 * 2. Calls backend to revoke Plaid access token
 * 3. Deletes item and accounts from Supabase
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { itemId } = await params;

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "Missing item_id", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // 1. Verify user owns this item
    const { data: item, error: fetchError } = await supabase
      .from("plaid_items")
      .select("id, item_id, institution_name")
      .eq("item_id", itemId)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (fetchError || !item) {
      console.error(
        "[Plaid delete] Item not found or access denied:",
        fetchError,
      );
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "ITEM_NOT_FOUND",
            message: "Item not found or access denied",
          },
          request_id: requestId,
        },
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    // 2. Call backend to revoke Plaid access token (if backend is configured)
    if (BACKEND_URL) {
      try {
        const token = await getToken();
        const backendResponse = await fetch(
          `${BACKEND_URL}/api/plaid/items/${itemId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-Request-ID": requestId,
            },
          },
        );

        if (!backendResponse.ok) {
          const errorBody = await backendResponse.text();
          console.warn(
            `[Plaid delete] Backend revoke failed (${backendResponse.status}): ${errorBody}`,
          );
        }
      } catch (backendErr) {
        console.warn("[Plaid delete] Backend call failed:", backendErr);
      }
    }

    // 3. Delete accounts for this item
    const { error: accountsDeleteError } = await supabase
      .from("plaid_accounts")
      .delete()
      .eq("item_id", itemId);

    if (accountsDeleteError) {
      console.error(
        "[Plaid delete] Failed to delete accounts:",
        accountsDeleteError,
      );
    }

    // 4. Delete the item itself
    const { error: itemDeleteError } = await supabase
      .from("plaid_items")
      .delete()
      .eq("item_id", itemId)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (itemDeleteError) {
      console.error("[Plaid delete] Failed to delete item:", itemDeleteError);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "DELETE_FAILED", message: itemDeleteError.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // 5. Also delete any transactions for this item
    const { error: txDeleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("item_id", itemId);

    if (txDeleteError) {
      console.warn(
        "[Plaid delete] Failed to delete transactions:",
        txDeleteError,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: `Removed ${item.institution_name || "bank connection"}`,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Plaid delete] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message },
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
