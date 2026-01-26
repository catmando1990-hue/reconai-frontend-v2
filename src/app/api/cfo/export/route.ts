import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/cfo/export
 *
 * Export CFO Overview Report as CSV
 * - Includes all key metrics
 * - Transaction summary data
 * - Period context
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

    // Get all non-pending transactions
    const { data: transactions, error } = await supabase
      .from("plaid_transactions")
      .select("amount, date, merchant_name, name, category, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false)
      .order("date", { ascending: false });

    if (error) {
      console.error("[CFO Export] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No data to export", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Calculate summary metrics
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

    // Build CSV content
    const lines: string[] = [];

    // Header section
    lines.push("CFO Overview Report");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(
      `Period: ${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`,
    );
    lines.push("");

    // Summary section
    lines.push("SUMMARY");
    lines.push(`Total Revenue,$${totalRevenue.toFixed(2)}`);
    lines.push(`Total Expenses,$${totalExpenses.toFixed(2)}`);
    lines.push(`Net Position,$${netPosition.toFixed(2)}`);
    lines.push(`Transaction Count,${transactions.length}`);
    lines.push("");

    // Transactions section
    lines.push("TRANSACTIONS");
    lines.push("Date,Description,Category,Amount,Type");

    for (const tx of transactions) {
      const desc = (tx.merchant_name || tx.name || "Unknown").replace(
        /,/g,
        ";",
      );
      const category = (tx.category || "Uncategorized").replace(/,/g, ";");
      const type = tx.amount < 0 ? "Revenue" : "Expense";
      const amount = Math.abs(tx.amount).toFixed(2);
      lines.push(`${tx.date},"${desc}","${category}",$${amount},${type}`);
    }

    const csv = lines.join("\n");
    const filename = `cfo-overview-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "x-request-id": requestId,
      },
    });
  } catch (err) {
    console.error("[CFO Export] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Export failed",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
