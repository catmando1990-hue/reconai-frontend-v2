import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/transactions
 *
 * Returns transactions from Supabase for the authenticated user.
 * Source of truth: Supabase `transactions` table.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const supabase = supabaseAdmin();

    // Query transactions table
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        transaction_id,
        account_id,
        amount,
        date,
        name,
        merchant_name,
        category,
        category_source,
        pending,
        payment_channel,
        transaction_type,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Transactions] Supabase error:", error);
      // Return empty array on error — graceful degradation
      return NextResponse.json(
        { items: [], count: 0, request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Get account names for all unique account_ids
    const accountIds = [
      ...new Set((transactions || []).map((t) => t.account_id).filter(Boolean)),
    ];

    let accountMap: Record<string, { name: string; subtype: string | null }> =
      {};

    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from("plaid_accounts")
        .select("account_id, name, subtype")
        .in("account_id", accountIds);

      if (accounts) {
        accountMap = Object.fromEntries(
          accounts.map((a) => [
            a.account_id,
            { name: a.name, subtype: a.subtype },
          ]),
        );
      }
    }

    // Map to frontend expected format
    const mapped = (transactions || []).map((tx) => {
      const account = accountMap[tx.account_id];
      // Use subtype (checking, savings) or name as display
      const accountName = account?.subtype
        ? account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1)
        : account?.name || null;

      return {
        id: tx.id || tx.transaction_id,
        date: tx.date,
        merchant: tx.merchant_name || tx.name,
        description: tx.name,
        amount: tx.amount,
        account: tx.account_id,
        account_name: accountName,
        category: Array.isArray(tx.category) ? tx.category[0] : tx.category,
        category_source: tx.category_source || "plaid",
        pending: tx.pending,
        duplicate: false,
      };
    });

    return NextResponse.json(
      { items: mapped, count: mapped.length, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Transactions] Unhandled error:", err);
    // Return empty array on error
    return NextResponse.json(
      { items: [], count: 0, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
