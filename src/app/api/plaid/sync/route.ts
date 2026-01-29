import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/plaid/sync
 *
 * Syncs transactions with:
 * - Cursor persistence for incremental sync
 * - Account type classification
 * - Normalized amounts (accounting convention)
 * - item_id tagging for proper cleanup
 */

const LIABILITY_TYPES = ["credit", "loan"];
const LIABILITY_SUBTYPES = [
  "credit card",
  "paypal",
  "auto",
  "business",
  "commercial",
  "construction",
  "consumer",
  "home equity",
  "loan",
  "mortgage",
  "line of credit",
  "overdraft",
  "student",
];

function isLiabilityAccount(type: string, subtype: string | null): boolean {
  if (LIABILITY_TYPES.includes(type?.toLowerCase())) return true;
  if (subtype && LIABILITY_SUBTYPES.includes(subtype?.toLowerCase()))
    return true;
  return false;
}

function normalizeAmount(plaidAmount: number): number {
  // Plaid: positive = money out, negative = money in
  // Accounting: positive = money in, negative = money out
  return -plaidAmount;
}

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

    // Get the item with cursor
    const { data: item, error: itemError } = await supabase
      .from("plaid_items")
      .select("id, item_id, access_token, user_id, clerk_user_id, sync_cursor")
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

    if (item.user_id !== userId && item.clerk_user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN", request_id: requestId },
        { status: 403, headers: { "x-request-id": requestId } },
      );
    }

    if (!item.access_token) {
      return NextResponse.json(
        {
          error: "No access token",
          code: "NO_ACCESS_TOKEN",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Get accounts for this item to look up types
    const { data: accounts } = await supabase
      .from("plaid_accounts")
      .select("account_id, type, subtype, is_liability")
      .eq("item_id", item_id);

    const accountsMap = new Map(accounts?.map((a) => [a.account_id, a]) || []);

    console.log(
      `[Plaid sync] Starting: itemId=${item_id}, accounts=${accountsMap.size}, hasCursor=${!!item.sync_cursor}`,
    );

    const plaid = getPlaidClient();
    let cursor: string | undefined = item.sync_cursor || undefined;
    let hasMore = true;
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    while (hasMore) {
      const syncResponse = await plaid.transactionsSync({
        access_token: item.access_token,
        cursor: cursor,
        count: 100,
      });

      const { added, modified, removed, next_cursor, has_more } =
        syncResponse.data;

      // Process added
      if (added.length > 0) {
        const rows = added.map((tx) => {
          const account = accountsMap.get(tx.account_id);
          const accountType = account?.type || "depository";
          const accountSubtype = account?.subtype || null;
          const isLiability =
            account?.is_liability ??
            isLiabilityAccount(accountType, accountSubtype);

          return {
            transaction_id: tx.transaction_id,
            user_id: userId,
            item_id: item_id,
            account_id: tx.account_id,
            account_type: accountType,
            account_subtype: accountSubtype,
            is_liability: isLiability,
            amount: tx.amount,
            amount_normalized: normalizeAmount(tx.amount),
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            category_id: tx.category_id,
            pending: tx.pending,
            payment_channel: tx.payment_channel,
            transaction_type: tx.transaction_type,
            iso_currency_code: tx.iso_currency_code || "USD",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        const { error } = await supabase
          .from("transactions")
          .upsert(rows, { onConflict: "transaction_id" });

        if (!error) addedCount += rows.length;
      }

      // Process modified
      if (modified.length > 0) {
        for (const tx of modified) {
          const account = accountsMap.get(tx.account_id);
          const accountType = account?.type || "depository";
          const accountSubtype = account?.subtype || null;
          const isLiability =
            account?.is_liability ??
            isLiabilityAccount(accountType, accountSubtype);

          const { error } = await supabase
            .from("transactions")
            .update({
              account_type: accountType,
              account_subtype: accountSubtype,
              is_liability: isLiability,
              amount: tx.amount,
              amount_normalized: normalizeAmount(tx.amount),
              date: tx.date,
              name: tx.name,
              merchant_name: tx.merchant_name,
              category: tx.category,
              pending: tx.pending,
              updated_at: new Date().toISOString(),
            })
            .eq("transaction_id", tx.transaction_id);

          if (!error) modifiedCount++;
        }
      }

      // Process removed
      if (removed.length > 0) {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .in(
            "transaction_id",
            removed.map((r) => r.transaction_id),
          );

        if (!error) removedCount += removed.length;
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Save cursor
    await supabase
      .from("plaid_items")
      .update({ sync_cursor: cursor, updated_at: new Date().toISOString() })
      .eq("item_id", item_id);

    console.log(
      `[Plaid sync] Complete: added=${addedCount}, modified=${modifiedCount}, removed=${removedCount}`,
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
      response?: { data?: { error_code?: string; error_message?: string } };
    };

    return NextResponse.json(
      {
        error: plaidError.response?.data?.error_message || "Sync failed",
        code: plaidError.response?.data?.error_code || "SYNC_ERROR",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
