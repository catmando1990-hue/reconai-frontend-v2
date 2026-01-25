import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/account-activity
 *
 * Account Activity Report - Per-account transaction summaries
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
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = supabaseAdmin();

    // Get accounts with current balances
    const { data: accounts, error: accountsError } = await supabase
      .from("plaid_accounts")
      .select("account_id, name, official_name, type, subtype, mask, institution_name, balance_current, balance_available")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (accountsError) {
      console.error("[Account activity] Accounts error:", accountsError);
      return NextResponse.json(
        { ok: false, error: { code: "QUERY_ERROR", message: accountsError.message }, request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Get transactions for activity calculation
    let txQuery = supabase
      .from("plaid_transactions")
      .select("account_id, amount, date, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false);

    if (startDate) {
      txQuery = txQuery.gte("date", startDate);
    }
    if (endDate) {
      txQuery = txQuery.lte("date", endDate);
    }

    const { data: transactions, error: txError } = await txQuery;

    if (txError) {
      console.error("[Account activity] Transactions error:", txError);
      return NextResponse.json(
        { ok: false, error: { code: "QUERY_ERROR", message: txError.message }, request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Aggregate by account
    const activityMap = new Map<string, { inflows: number; outflows: number; count: number }>();

    for (const tx of transactions || []) {
      const existing = activityMap.get(tx.account_id) || { inflows: 0, outflows: 0, count: 0 };
      if (tx.amount < 0) {
        existing.inflows += Math.abs(tx.amount);
      } else {
        existing.outflows += tx.amount;
      }
      existing.count += 1;
      activityMap.set(tx.account_id, existing);
    }

    // Combine accounts with activity
    const accountActivity = (accounts || []).map((acct) => {
      const activity = activityMap.get(acct.account_id) || { inflows: 0, outflows: 0, count: 0 };
      return {
        account_id: acct.account_id,
        name: acct.name || acct.official_name || "Account",
        type: acct.type,
        subtype: acct.subtype,
        mask: acct.mask,
        institution_name: acct.institution_name,
        current_balance: acct.balance_current,
        available_balance: acct.balance_available,
        inflows: Math.round(activity.inflows * 100) / 100,
        outflows: Math.round(activity.outflows * 100) / 100,
        net_change: Math.round((activity.inflows - activity.outflows) * 100) / 100,
        transaction_count: activity.count,
      };
    });

    // Summary
    const totalInflows = accountActivity.reduce((sum, a) => sum + a.inflows, 0);
    const totalOutflows = accountActivity.reduce((sum, a) => sum + a.outflows, 0);
    const totalBalance = accountActivity.reduce((sum, a) => sum + (a.current_balance || 0), 0);

    return NextResponse.json(
      {
        ok: true,
        report: "account_activity",
        data: accountActivity,
        summary: {
          total_accounts: accountActivity.length,
          total_current_balance: Math.round(totalBalance * 100) / 100,
          total_inflows: Math.round(totalInflows * 100) / 100,
          total_outflows: Math.round(totalOutflows * 100) / 100,
          net_change: Math.round((totalInflows - totalOutflows) * 100) / 100,
        },
        filters: {
          start_date: startDate,
          end_date: endDate,
        },
        generated_at: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } }
    );
  } catch (err) {
    console.error("[Account activity] Error:", err);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate report" }, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
