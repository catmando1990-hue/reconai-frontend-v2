import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/cash-flow
 *
 * Cash Flow Statement (Direct Method)
 * - Actual money in vs money out
 * - Based only on cleared (non-pending) transactions
 * - No projections
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

    // Get all non-pending transactions
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, pending, date")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false);

    if (error) {
      console.error("[CashFlow] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Calculate inflows (negative amounts in Plaid = money coming in)
    // and outflows (positive amounts = money going out)
    // Note: Plaid uses negative for credits, positive for debits
    let inflows = 0;
    let outflows = 0;
    let inflowCount = 0;
    let outflowCount = 0;

    for (const tx of transactions || []) {
      if (tx.amount < 0) {
        // Negative = credit/inflow
        inflows += Math.abs(tx.amount);
        inflowCount++;
      } else {
        // Positive = debit/outflow
        outflows += tx.amount;
        outflowCount++;
      }
    }

    const net = inflows - outflows;

    // Determine period from transaction dates
    let period = "All time";
    if (transactions && transactions.length > 0) {
      const dates = transactions.map((t) => new Date(t.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      period = `${minDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })} – ${maxDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    return NextResponse.json(
      {
        cashflow: {
          period,
          inflows: Math.round(inflows * 100) / 100,
          outflows: Math.round(outflows * 100) / 100,
          net: Math.round(net * 100) / 100,
          inflow_transactions: inflowCount,
          outflow_transactions: outflowCount,
        },
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[CashFlow] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
