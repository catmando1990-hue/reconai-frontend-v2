import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/category-spend
 *
 * Category Spend Report - Aggregated spending by category
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = supabaseAdmin();

    // Get all transactions for aggregation
    let query = supabase
      .from("transactions")
      .select("amount, category, personal_finance_category, date, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("pending", false); // Only posted transactions

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("[Category spend report] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "QUERY_ERROR", message: error.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Aggregate by category
    const categoryMap = new Map<
      string,
      { total: number; count: number; transactions: number[] }
    >();
    let totalSpend = 0;

    for (const tx of transactions || []) {
      // Only count outflows (positive amounts in Plaid = money out)
      if (tx.amount <= 0) continue;

      const category =
        tx.category?.[0] ||
        tx.personal_finance_category?.primary ||
        "Uncategorized";
      const existing = categoryMap.get(category) || {
        total: 0,
        count: 0,
        transactions: [],
      };
      existing.total += tx.amount;
      existing.count += 1;
      categoryMap.set(category, existing);
      totalSpend += tx.amount;
    }

    // Convert to sorted array
    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        category: name,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percent_of_total:
          totalSpend > 0
            ? Math.round((data.total / totalSpend) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(
      {
        ok: true,
        report: "category_spend",
        data: categories,
        summary: {
          total_spend: Math.round(totalSpend * 100) / 100,
          category_count: categories.length,
          transaction_count:
            transactions?.filter((t) => t.amount > 0).length || 0,
        },
        filters: {
          start_date: startDate,
          end_date: endDate,
        },
        generated_at: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Category spend report] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to generate report" },
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
