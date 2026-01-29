import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/plaid/sync
 *
 * Syncs transactions for a specific Plaid item.
 * Uses Plaid's /transactions/sync endpoint (cursor-based).
 * Writes transactions to Supabase.
 *
 * Request body: { item_id: string }
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { item_id } = body as { item_id?: string };

    if (!item_id) {
      return NextResponse.json(
        {
          error: "Missing item_id",
          code: "MISSING_ITEM_ID",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Get the item and verify ownership
    const { data: item, error: itemError } = await supabase
      .from("plaid_items")
      .select("id, item_id, access_token, user_id, clerk_user_id")
      .eq("item_id", item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        {
          error: "Item not found",
          code: "ITEM_NOT_FOUND",
          request_id: requestId,
        },
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    // Verify ownership
    if (item.user_id !== userId && item.clerk_user_id !== userId) {
      return NextResponse.json(
        {
          error: "Not authorized to sync this item",
          code: "FORBIDDEN",
          request_id: requestId,
        },
        { status: 403, headers: { "x-request-id": requestId } },
      );
    }

    const accessToken = item.access_token;
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Item has no access token",
          code: "NO_ACCESS_TOKEN",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    console.log(
      `[Plaid sync] Starting sync for item=${item_id}, user=${userId}, requestId=${requestId}`,
    );

    const plaid = getPlaidClient();

    // Use transactions/sync for cursor-based sync
    let cursor: string | undefined = undefined;
    let hasMore = true;
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    while (hasMore) {
      const syncResponse = await plaid.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
        count: 100,
      });

      const { added, modified, removed, next_cursor, has_more } =
        syncResponse.data;

      // Process added transactions
      if (added.length > 0) {
        const addedRows = added.map((tx) => ({
          transaction_id: tx.transaction_id,
          user_id: userId,
          item_id: item_id,
          account_id: tx.account_id,
          amount: tx.amount,
          date: tx.date,
          name: tx.name,
          merchant_name: tx.merchant_name,
          category: tx.category,
          pending: tx.pending,
          payment_channel: tx.payment_channel,
          transaction_type: tx.transaction_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: addError } = await supabase
          .from("transactions")
          .upsert(addedRows, { onConflict: "transaction_id" });

        if (addError) {
          console.error("[Plaid sync] Error inserting transactions:", addError);
        } else {
          addedCount += added.length;
        }
      }

      // Process modified transactions
      if (modified.length > 0) {
        for (const tx of modified) {
          const { error: modError } = await supabase
            .from("transactions")
            .update({
              amount: tx.amount,
              date: tx.date,
              name: tx.name,
              merchant_name: tx.merchant_name,
              category: tx.category,
              pending: tx.pending,
              payment_channel: tx.payment_channel,
              transaction_type: tx.transaction_type,
              updated_at: new Date().toISOString(),
            })
            .eq("transaction_id", tx.transaction_id);

          if (!modError) {
            modifiedCount++;
          }
        }
      }

      // Process removed transactions
      if (removed.length > 0) {
        const removedIds = removed.map((r) => r.transaction_id);
        const { error: removeError } = await supabase
          .from("transactions")
          .delete()
          .in("transaction_id", removedIds);

        if (!removeError) {
          removedCount += removed.length;
        }
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update item's last synced timestamp
    await supabase
      .from("plaid_items")
      .update({ updated_at: new Date().toISOString() })
      .eq("item_id", item_id);

    console.log(
      `[Plaid sync] Complete: added=${addedCount}, modified=${modifiedCount}, removed=${removedCount}, requestId=${requestId}`,
    );

    return NextResponse.json(
      {
        ok: true,
        added: addedCount,
        modified: modifiedCount,
        removed: removedCount,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid sync] Error:", err);

    const plaidError = err as {
      response?: {
        data?: {
          error_code?: string;
          error_message?: string;
        };
      };
    };
    const errorCode = plaidError.response?.data?.error_code || "SYNC_ERROR";
    const errorMessage =
      plaidError.response?.data?.error_message ||
      (err instanceof Error ? err.message : "Sync failed");

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
