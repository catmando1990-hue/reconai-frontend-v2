import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/cfo/overview
 *
 * CFO Overview Metrics
 * - Total Revenue (inflows)
 * - Total Expenses (outflows)
 * - Net Position
 * - Period context
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          cfo_version: "1",
          lifecycle: "failed",
          reason_code: "not_authenticated",
          reason_message: "Authentication required",
          generated_at: new Date().toISOString(),
          metrics: null,
          request_id: requestId,
        },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Get all non-pending transactions
    const { data: transactions, error } = await supabase
      .from("plaid_transactions")
      .select("amount, date, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false);

    if (error) {
      console.error("[CFO Overview] Supabase error:", error);
      return NextResponse.json(
        {
          cfo_version: "1",
          lifecycle: "failed",
          reason_code: "database_error",
          reason_message: "Failed to fetch transaction data",
          generated_at: new Date().toISOString(),
          metrics: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        {
          cfo_version: "1",
          lifecycle: "pending",
          reason_code: "insufficient_data",
          reason_message: "No transaction data available",
          generated_at: new Date().toISOString(),
          metrics: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Calculate metrics
    // Plaid: negative amount = credit/inflow (revenue)
    // Plaid: positive amount = debit/outflow (expense)
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.amount < 0) {
        totalRevenue += Math.abs(tx.amount);
      } else {
        totalExpenses += tx.amount;
      }
    }

    const netPosition = totalRevenue - totalExpenses;

    // Determine period
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const period = `${minDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} – ${maxDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    return NextResponse.json(
      {
        cfo_version: "1",
        lifecycle: "success",
        reason_code: null,
        reason_message: null,
        generated_at: new Date().toISOString(),
        metrics: {
          total_revenue: Math.round(totalRevenue * 100) / 100,
          total_expenses: Math.round(totalExpenses * 100) / 100,
          net_position: Math.round(netPosition * 100) / 100,
          transaction_count: transactions.length,
          period,
        },
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[CFO Overview] Error:", err);
    return NextResponse.json(
      {
        cfo_version: "1",
        lifecycle: "failed",
        reason_code: "computation_error",
        reason_message: err instanceof Error ? err.message : "Unknown error",
        generated_at: new Date().toISOString(),
        metrics: null,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
