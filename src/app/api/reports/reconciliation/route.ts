import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/reports/reconciliation
 *
 * Statement Reconciliation Report
 * - Compares uploaded bank statements vs ingested transaction data
 * - Identifies matched, unmatched, and partial matches
 * - Calculates total differences
 */
export async function POST() {
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

    // Get uploaded statements
    const { data: statements, error: stmtError } = await supabase
      .from("statements")
      .select("id, statement_date, file_name, account_id")
      .eq("user_id", userId)
      .order("statement_date", { ascending: false });

    if (stmtError) {
      console.error("[Reconciliation] Statements error:", stmtError);
      // Return empty if table doesn't exist or no statements
      return NextResponse.json(
        {
          items: [],
          summary: {
            total_statement_items: 0,
            matched_count: 0,
            unmatched_count: 0,
            partial_count: 0,
            total_difference: 0,
            statement_period_start: null,
            statement_period_end: null,
          },
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    if (!statements || statements.length === 0) {
      return NextResponse.json(
        {
          items: [],
          summary: {
            total_statement_items: 0,
            matched_count: 0,
            unmatched_count: 0,
            partial_count: 0,
            total_difference: 0,
            statement_period_start: null,
            statement_period_end: null,
          },
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Get statement line items (if they exist)
    const { data: lineItems, error: lineError } = await supabase
      .from("statement_line_items")
      .select("*")
      .in(
        "statement_id",
        statements.map((s) => s.id),
      );

    if (lineError) {
      console.error("[Reconciliation] Line items error:", lineError);
      // Table might not exist, return empty
      return NextResponse.json(
        {
          items: [],
          summary: {
            total_statement_items: 0,
            matched_count: 0,
            unmatched_count: 0,
            partial_count: 0,
            total_difference: 0,
            statement_period_start: null,
            statement_period_end: null,
          },
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Get all transactions for matching
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("id, amount, date, merchant_name, name, account_id")
      .eq("user_id", userId);

    if (txError) {
      console.error("[Reconciliation] Transactions error:", txError);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Get account names
    const { data: accounts } = await supabase
      .from("plaid_accounts")
      .select("account_id, name")
      .eq("user_id", userId);

    const accountLookup = new Map(
      (accounts || []).map((a) => [a.account_id, a.name]),
    );

    // Build reconciliation items
    const items: Array<{
      id: string;
      statement_date: string;
      statement_amount: number;
      ingested_amount: number | null;
      difference: number | null;
      status: "matched" | "unmatched" | "partial";
      description: string;
      account_name: string;
    }> = [];

    let matchedCount = 0;
    let unmatchedCount = 0;
    let partialCount = 0;
    let totalDifference = 0;

    for (const line of lineItems || []) {
      // Try to find matching transaction by date and amount
      const matchingTx = (transactions || []).find(
        (tx) =>
          tx.date === line.date &&
          Math.abs(Math.abs(tx.amount) - Math.abs(line.amount)) < 0.01,
      );

      // Try partial match by date only
      const partialMatch =
        !matchingTx && (transactions || []).find((tx) => tx.date === line.date);

      let status: "matched" | "unmatched" | "partial";
      let ingestedAmount: number | null = null;
      let difference: number | null = null;

      if (matchingTx) {
        status = "matched";
        ingestedAmount = matchingTx.amount;
        difference = 0;
        matchedCount++;
      } else if (partialMatch) {
        status = "partial";
        ingestedAmount = partialMatch.amount;
        difference = Math.abs(line.amount) - Math.abs(partialMatch.amount);
        totalDifference += Math.abs(difference);
        partialCount++;
      } else {
        status = "unmatched";
        totalDifference += Math.abs(line.amount);
        unmatchedCount++;
      }

      items.push({
        id: line.id,
        statement_date: line.date,
        statement_amount: line.amount,
        ingested_amount: ingestedAmount,
        difference,
        status,
        description: line.description || "Unknown",
        account_name: accountLookup.get(line.account_id) || "Unknown Account",
      });
    }

    // Get period from statements
    const dates = statements.map((s) => s.statement_date).filter(Boolean);
    const sortedDates = dates.sort();

    return NextResponse.json(
      {
        items,
        summary: {
          total_statement_items: items.length,
          matched_count: matchedCount,
          unmatched_count: unmatchedCount,
          partial_count: partialCount,
          total_difference: Math.round(totalDifference * 100) / 100,
          statement_period_start: sortedDates[0] || null,
          statement_period_end: sortedDates[sortedDates.length - 1] || null,
        },
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Reconciliation] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
