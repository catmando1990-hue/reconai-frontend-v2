import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/cash-flow
 *
 * Cash Flow Statement (Direct Method)
 * - Operating, Investing, Financing sections
 * - Daily trend data for charts
 * - Based only on cleared (non-pending) transactions
 */

// Category mappings for cash flow classification
const INVESTING_CATEGORIES = ["Investment", "Securities", "Brokerage"];

const FINANCING_CATEGORIES = ["Loan", "Credit", "Mortgage", "Debt"];

function classifyTransaction(
  category: string[] | null,
): "operating" | "investing" | "financing" {
  const cats = (category || []).map((c) => c.toLowerCase());

  if (
    cats.some((c) =>
      INVESTING_CATEGORIES.some((inv) => c.includes(inv.toLowerCase())),
    )
  ) {
    return "investing";
  }
  if (
    cats.some((c) =>
      FINANCING_CATEGORIES.some((fin) => c.includes(fin.toLowerCase())),
    )
  ) {
    return "financing";
  }
  return "operating";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    // Parse period from query params (default 30 days)
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("period") || "30", 10);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodDays);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const supabase = supabaseAdmin();

    // Get all non-pending transactions with category data
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, pending, date, category, name, merchant_name")
      .eq("user_id", userId)
      .eq("pending", false)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true });

    if (error) {
      console.error("[CashFlow] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Initialize sections
    const sections = {
      operating: { inflows: 0, outflows: 0, items: new Map<string, number>() },
      investing: { inflows: 0, outflows: 0, items: new Map<string, number>() },
      financing: { inflows: 0, outflows: 0, items: new Map<string, number>() },
    };

    // Daily trend tracking
    const dailyMap = new Map<string, { inflows: number; outflows: number }>();

    // Process transactions
    for (const tx of transactions || []) {
      const classification = classifyTransaction(tx.category);
      const section = sections[classification];
      const itemName =
        tx.merchant_name || tx.name || tx.category?.[0] || "Other";

      // Plaid: negative = credit/inflow, positive = debit/outflow
      if (tx.amount < 0) {
        section.inflows += Math.abs(tx.amount);
        section.items.set(
          itemName,
          (section.items.get(itemName) || 0) + Math.abs(tx.amount),
        );
      } else {
        section.outflows += tx.amount;
        section.items.set(
          itemName,
          (section.items.get(itemName) || 0) - tx.amount,
        );
      }

      // Track daily totals
      const dateKey = tx.date;
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { inflows: 0, outflows: 0 });
      }
      const daily = dailyMap.get(dateKey)!;
      if (tx.amount < 0) {
        daily.inflows += Math.abs(tx.amount);
      } else {
        daily.outflows += tx.amount;
      }
    }

    // Build section responses
    const buildSection = (section: typeof sections.operating) => {
      const net = section.inflows - section.outflows;
      // Convert items map to array, sorted by absolute value
      const items = Array.from(section.items.entries())
        .map(([category, amount]) => ({ category, amount: round2(amount) }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10); // Top 10 items

      return {
        inflows: round2(section.inflows),
        outflows: round2(section.outflows),
        net: round2(net),
        items,
      };
    };

    // Build daily trend array
    const daily_trend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        inflows: round2(values.inflows),
        outflows: round2(values.outflows),
        net: round2(values.inflows - values.outflows),
      }));

    // Calculate totals
    const totalInflows =
      sections.operating.inflows +
      sections.investing.inflows +
      sections.financing.inflows;
    const totalOutflows =
      sections.operating.outflows +
      sections.investing.outflows +
      sections.financing.outflows;
    const netChange = totalInflows - totalOutflows;

    // Format period string
    const periodStr = `${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} – ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    return NextResponse.json(
      {
        period: periodStr,
        start_date: startDateStr,
        end_date: endDateStr,
        operating: buildSection(sections.operating),
        investing: buildSection(sections.investing),
        financing: buildSection(sections.financing),
        net_change: round2(netChange),
        opening_balance: 0, // Would need account balance history for this
        closing_balance: round2(netChange), // Simplified - just net change
        daily_trend,
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
