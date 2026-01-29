import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/balance-history
 *
 * Balance History Report
 * - Historical balance changes over time
 * - Computed from transaction data
 * - Per-account and aggregate views
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Get all accounts for this user
    const { data: accounts, error: accountsError } = await supabase
      .from("plaid_accounts")
      .select("id, name, current_balance, account_id")
      .eq("user_id", userId);

    if (accountsError) {
      console.error("[BalanceHistory] Accounts error:", accountsError);
      return NextResponse.json(
        { error: "Failed to fetch accounts", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Get all transactions to compute balance history
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, date, account_id, pending")
      .eq("user_id", userId)
      .eq("pending", false)
      .order("date", { ascending: true });

    if (txError) {
      console.error("[BalanceHistory] Transactions error:", txError);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Build account lookup
    const accountLookup = new Map(
      (accounts || []).map((a) => [
        a.account_id,
        { id: a.id, name: a.name, current_balance: a.current_balance || 0 },
      ]),
    );

    // Group transactions by date and account, working backwards from current balance
    const balancesByDateAccount = new Map<string, Map<string, number>>();

    // Get unique dates
    const uniqueDates = [
      ...new Set((transactions || []).map((t) => t.date)),
    ].sort();

    // For each account, work backwards from current balance
    for (const [accountId, account] of accountLookup) {
      let runningBalance = account.current_balance;

      // Process dates in reverse order (most recent first)
      const reverseDates = [...uniqueDates].reverse();

      for (const date of reverseDates) {
        // Get transactions for this account and date
        const dayTxs = (transactions || []).filter(
          (t) => t.account_id === accountId && t.date === date,
        );

        // Record balance at end of this day
        if (!balancesByDateAccount.has(date)) {
          balancesByDateAccount.set(date, new Map());
        }
        balancesByDateAccount.get(date)!.set(accountId, runningBalance);

        // Subtract day's transactions to get previous balance
        // (In Plaid, positive = debit/outflow, negative = credit/inflow)
        for (const tx of dayTxs) {
          runningBalance += tx.amount; // Reverse the transaction
        }
      }
    }

    // Build history array
    const history: Array<{
      date: string;
      balance: number;
      account_id: string;
      account_name: string;
    }> = [];

    for (const [date, accountBalances] of balancesByDateAccount) {
      for (const [accountId, balance] of accountBalances) {
        const account = accountLookup.get(accountId);
        if (account) {
          history.push({
            date,
            balance: Math.round(balance * 100) / 100,
            account_id: accountId,
            account_name: account.name,
          });
        }
      }
    }

    // Sort history by date descending
    history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Build accounts summary
    const accountsSummary = Array.from(accountLookup.entries()).map(
      ([id, acc]) => ({
        id,
        name: acc.name,
        current_balance: acc.current_balance,
      }),
    );

    return NextResponse.json(
      {
        history: history.slice(0, 365), // Limit to ~1 year of daily data
        accounts: accountsSummary,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[BalanceHistory] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
