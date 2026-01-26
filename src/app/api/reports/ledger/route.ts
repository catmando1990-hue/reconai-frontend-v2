import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/ledger
 *
 * Transaction Ledger Report - Complete list of all transactions
 * Paginated, sorted by date descending
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("page_size") || "50", 10)),
    );
    const offset = (page - 1) * pageSize;

    const supabase = supabaseAdmin();

    // Get total count
    const { count, error: countError } = await supabase
      .from("plaid_transactions")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (countError) {
      console.error("[Ledger] Count error:", countError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to count transactions",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Fetch transactions with account info
    const { data: transactions, error: txError } = await supabase
      .from("plaid_transactions")
      .select(
        `
        id,
        transaction_id,
        date,
        name,
        merchant_name,
        amount,
        iso_currency_code,
        category,
        pending,
        account_id,
        created_at
      `,
      )
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("date", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (txError) {
      console.error("[Ledger] Transaction fetch error:", txError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch transactions",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Get account details for the transactions
    const accountIds = [
      ...new Set((transactions || []).map((t) => t.account_id).filter(Boolean)),
    ];

    let accountMap: Record<string, { name: string; mask: string | null }> = {};

    if (accountIds.length > 0) {
      const { data: accounts } = await supabase
        .from("plaid_accounts")
        .select("account_id, name, mask")
        .in("account_id", accountIds);

      if (accounts) {
        accountMap = Object.fromEntries(
          accounts.map((a) => [a.account_id, { name: a.name, mask: a.mask }]),
        );
      }
    }

    // Map to response format
    const mappedTransactions = (transactions || []).map((tx) => {
      const account = accountMap[tx.account_id] || null;
      return {
        id: tx.id || tx.transaction_id,
        date: tx.date,
        name: tx.name || "",
        merchant_name: tx.merchant_name,
        amount: tx.amount,
        iso_currency_code: tx.iso_currency_code || "USD",
        category: Array.isArray(tx.category) ? tx.category[0] : tx.category,
        account_name: account?.name || null,
        account_mask: account?.mask || null,
        source: "plaid" as const,
        status: tx.pending ? ("pending" as const) : ("posted" as const),
      };
    });

    return NextResponse.json(
      {
        ok: true,
        transactions: mappedTransactions,
        total: count || 0,
        page,
        page_size: pageSize,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    console.error("[Ledger] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
