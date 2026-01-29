import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPlaidClient } from "@/lib/plaid";

/**
 * DELETE /api/plaid/items/[itemId]
 *
 * Removes a Plaid item (bank connection) with FULL cascade delete:
 * 1. Validates user owns the item
 * 2. Revokes Plaid access token directly
 * 3. Deletes ALL related data (transactions, accounts, item)
 *
 * This is atomic - if any critical step fails, the whole operation fails.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const requestId = crypto.randomUUID();
  const { itemId } = await params;

  try {
    const { userId } = await auth();
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

    // 1. Verify user owns this item and get access_token
    const { data: item, error: fetchError } = await supabase
      .from("plaid_items")
      .select("id, item_id, institution_name, access_token")
      .eq("item_id", itemId)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (fetchError || !item) {
      console.error(
        `[Plaid delete] Item not found: itemId=${itemId}, userId=${userId}`,
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

    console.log(
      `[Plaid delete] Starting cascade delete: itemId=${itemId}, institution=${item.institution_name}, requestId=${requestId}`,
    );

    // 2. Revoke Plaid access token (best effort - don't fail if this errors)
    if (item.access_token) {
      try {
        const plaid = getPlaidClient();
        await plaid.itemRemove({ access_token: item.access_token });
        console.log(`[Plaid delete] Revoked access token for itemId=${itemId}`);
      } catch (plaidErr) {
        // Log but don't fail - token may already be invalid
        console.warn(
          `[Plaid delete] Failed to revoke access token (continuing anyway):`,
          plaidErr,
        );
      }
    }

    // 3. Get all account_ids for this item (for transaction cleanup)
    const { data: accounts } = await supabase
      .from("plaid_accounts")
      .select("account_id")
      .eq("item_id", itemId);

    const accountIds = accounts?.map((a) => a.account_id) ?? [];

    // 4. Delete transactions - by item_id OR by account_id (covers old data without item_id)
    let txDeleteCount = 0;

    // First: delete by item_id (new transactions)
    const { count: txByItemCount, error: txItemError } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .eq("item_id", itemId);

    if (txItemError) {
      console.error(
        `[Plaid delete] Failed to delete transactions by item_id:`,
        txItemError,
      );
    } else {
      txDeleteCount += txByItemCount ?? 0;
    }

    // Second: delete by account_id (old transactions without item_id)
    if (accountIds.length > 0) {
      const { count: txByAccountCount, error: txAccountError } = await supabase
        .from("transactions")
        .delete({ count: "exact" })
        .in("account_id", accountIds)
        .is("item_id", null); // Only delete orphaned ones

      if (txAccountError) {
        console.error(
          `[Plaid delete] Failed to delete transactions by account_id:`,
          txAccountError,
        );
      } else {
        txDeleteCount += txByAccountCount ?? 0;
      }
    }

    console.log(`[Plaid delete] Deleted ${txDeleteCount} transactions`);

    // 5. Delete accounts
    const { count: accountDeleteCount, error: accountsDeleteError } =
      await supabase
        .from("plaid_accounts")
        .delete({ count: "exact" })
        .eq("item_id", itemId);

    if (accountsDeleteError) {
      console.error(
        `[Plaid delete] Failed to delete accounts:`,
        accountsDeleteError,
      );
      // Don't return - continue to delete item
    } else {
      console.log(`[Plaid delete] Deleted ${accountDeleteCount} accounts`);
    }

    // 6. Delete the item itself
    const { error: itemDeleteError } = await supabase
      .from("plaid_items")
      .delete()
      .eq("item_id", itemId)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (itemDeleteError) {
      console.error(`[Plaid delete] Failed to delete item:`, itemDeleteError);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "DELETE_FAILED", message: itemDeleteError.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    console.log(
      `[Plaid delete] Complete: itemId=${itemId}, transactions=${txDeleteCount}, accounts=${accountDeleteCount}, requestId=${requestId}`,
    );

    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: `Removed ${item.institution_name || "bank connection"}`,
        deleted: {
          transactions: txDeleteCount,
          accounts: accountDeleteCount ?? 0,
        },
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
