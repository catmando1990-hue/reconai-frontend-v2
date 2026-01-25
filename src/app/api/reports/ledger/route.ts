import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/ledger
 *
 * Transaction Ledger Report - Complete list of all transactions
 * Supports pagination and date filtering
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const accountId = searchParams.get("account_id");

    const supabase = supabaseAdmin();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("plaid_transactions")
      .select("*", { count: "exact" })
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }
    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("[Ledger report] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: { code: "QUERY_ERROR", message: error.message }, request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Map to report format
    const rows = (transactions || []).map((tx) => ({
      id: tx.id,
      transaction_id: tx.transaction_id,
      date: tx.date,
      merchant: tx.merchant_name || tx.name,
      description: tx.name,
      amount: tx.amount,
      account_id: tx.account_id,
      account_name: tx.account_name,
      category: tx.category?.[0] || tx.personal_finance_category?.primary || "Uncategorized",
      subcategory: tx.category?.[1] || tx.personal_finance_category?.detailed || null,
      source: tx.source || "plaid",
      status: tx.pending ? "pending" : "posted",
      iso_currency_code: tx.iso_currency_code || "USD",
      created_at: tx.created_at,
    }));

    const totalPages = count ? Math.ceil(count / limit) : 1;

    return NextResponse.json(
      {
        ok: true,
        report: "transaction_ledger",
        data: rows,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        filters: {
          start_date: startDate,
          end_date: endDate,
          account_id: accountId,
        },
        generated_at: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } }
    );
  } catch (err) {
    console.error("[Ledger report] Error:", err);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate report" }, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
