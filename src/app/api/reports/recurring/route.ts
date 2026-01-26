import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/recurring
 *
 * Recurring Activity Report
 * - Detects repeating inflows and outflows
 * - Pattern analysis based on merchant/amount matching
 * - Confidence scoring for detection certainty
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

    // Get all transactions for analysis
    const { data: transactions, error } = await supabase
      .from("plaid_transactions")
      .select("id, amount, merchant_name, name, date, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false)
      .order("date", { ascending: false });

    if (error) {
      console.error("[Recurring] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Group transactions by merchant/name and amount (rounded to nearest dollar)
    const groups = new Map<
      string,
      Array<{ date: string; amount: number; name: string }>
    >();

    for (const tx of transactions || []) {
      const name = tx.merchant_name || tx.name || "Unknown";
      const roundedAmount = Math.round(Math.abs(tx.amount));
      const key = `${name.toLowerCase()}|${roundedAmount}`;

      const group = groups.get(key) || [];
      group.push({
        date: tx.date,
        amount: tx.amount,
        name,
      });
      groups.set(key, group);
    }

    // Analyze each group for recurring patterns
    const recurring: Array<{
      id: string;
      name: string;
      merchant_name: string | null;
      category: string | null;
      amount: number;
      frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";
      next_expected_date: string | null;
      last_occurrence: string;
      occurrence_count: number;
      confidence: number;
      type: "inflow" | "outflow";
    }> = [];

    for (const [key, txs] of groups.entries()) {
      // Need at least 3 occurrences to detect pattern
      if (txs.length < 3) continue;

      // Sort by date
      txs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculate average interval in days
      const intervals: number[] = [];
      for (let i = 1; i < txs.length; i++) {
        const diff =
          (new Date(txs[i].date).getTime() -
            new Date(txs[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24);
        intervals.push(diff);
      }

      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Determine frequency based on average interval
      let frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";
      let expectedDays: number;

      if (avgInterval <= 9) {
        frequency = "weekly";
        expectedDays = 7;
      } else if (avgInterval <= 18) {
        frequency = "biweekly";
        expectedDays = 14;
      } else if (avgInterval <= 45) {
        frequency = "monthly";
        expectedDays = 30;
      } else if (avgInterval <= 120) {
        frequency = "quarterly";
        expectedDays = 90;
      } else {
        frequency = "annual";
        expectedDays = 365;
      }

      // Calculate confidence based on how consistent the intervals are
      const variance =
        intervals.reduce(
          (sum, int) => sum + Math.pow(int - avgInterval, 2),
          0,
        ) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - stdDev / expectedDays);
      const confidence = Math.min(
        0.99,
        consistency * 0.7 + 0.3 * (txs.length / 12),
      );

      // Only include if confidence is above threshold
      if (confidence < 0.5) continue;

      const lastTx = txs[txs.length - 1];
      const avgAmount =
        txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;

      // Estimate next occurrence
      const lastDate = new Date(lastTx.date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + expectedDays);

      recurring.push({
        id: `rec_${key.replace(/[^a-z0-9]/gi, "_")}`,
        name: lastTx.name,
        merchant_name: lastTx.name,
        category: null, // Would require category mapping
        amount: Math.round(avgAmount * 100) / 100,
        frequency,
        next_expected_date:
          nextDate > new Date() ? nextDate.toISOString().split("T")[0] : null,
        last_occurrence: lastTx.date,
        occurrence_count: txs.length,
        confidence: Math.round(confidence * 100) / 100,
        type: lastTx.amount < 0 ? "inflow" : "outflow",
      });
    }

    // Sort by occurrence count descending
    recurring.sort((a, b) => b.occurrence_count - a.occurrence_count);

    return NextResponse.json(
      {
        recurring: recurring.slice(0, 50), // Limit to top 50
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Recurring] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
