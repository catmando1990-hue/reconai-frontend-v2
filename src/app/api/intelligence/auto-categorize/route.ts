import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const CONFIDENCE_THRESHOLD = 0.80;

/**
 * POST /api/intelligence/auto-categorize
 *
 * Uses Claude AI to analyze uncategorized transactions and automatically
 * applies category suggestions with high confidence.
 *
 * Returns count of transactions categorized.
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured", request_id: requestId },
        { status: 503, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Fetch uncategorized transactions (no category or generic Plaid categories)
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("transaction_id, name, merchant_name, amount, date, category")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (txError) {
      console.error("[Auto-categorize] Fetch error:", txError);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Filter to uncategorized only
    const uncategorized = (transactions || []).filter((tx) => {
      const cat = Array.isArray(tx.category) ? tx.category[0] : tx.category;
      return !cat || cat === "Uncategorized" || cat === "Other";
    });

    if (uncategorized.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          categorized: 0,
          message: "All transactions are already categorized",
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Fetch user's existing category rules for context
    const { data: rules } = await supabase
      .from("category_rules")
      .select("merchant_pattern, category")
      .eq("user_id", userId);

    // Prepare data for Claude
    const txData = uncategorized.map((tx, i) => ({
      index: i,
      merchant: tx.merchant_name || tx.name || "Unknown",
      amount: tx.amount,
      date: tx.date,
    }));

    const rulesContext =
      rules && rules.length > 0
        ? `\n\nUser's existing categorization rules (use these as guidance):\n${rules.map((r) => `- "${r.merchant_pattern}" → ${r.category}`).join("\n")}`
        : "";

    const prompt = `Analyze these transactions and categorize each one. Return ONLY valid JSON.

Transactions to categorize:
${JSON.stringify(txData, null, 2)}
${rulesContext}

Categories to use (pick the BEST match):
- Software & SaaS
- Transportation
- Groceries
- Dining & Restaurants
- Utilities
- Office Supplies
- Professional Services
- Insurance
- Rent & Lease
- Travel
- Entertainment
- Marketing & Advertising
- Payroll
- Equipment
- Healthcare
- Education & Training
- Bank Fees
- Taxes
- Other

Return JSON array with this exact format:
[
  {"index": 0, "category": "CategoryName", "confidence": 0.95},
  {"index": 1, "category": "CategoryName", "confidence": 0.85}
]

Rules:
- confidence should be 0.0 to 1.0 based on how certain you are
- Use merchant name as primary signal
- If unsure, use "Other" with low confidence
- Return ONLY the JSON array, no markdown or explanation`;

    // Call Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Auto-categorize] Claude API error:", errText);
      return NextResponse.json(
        { error: "AI analysis failed", request_id: requestId },
        { status: 502, headers: { "x-request-id": requestId } },
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text || "";

    // Parse AI response
    let suggestions: Array<{
      index: number;
      category: string;
      confidence: number;
    }>;
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      suggestions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[Auto-categorize] Parse error:", parseErr, content);
      return NextResponse.json(
        { error: "Failed to parse AI response", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Apply high-confidence suggestions
    let categorizedCount = 0;
    const applied: Array<{ merchant: string; category: string }> = [];

    for (const suggestion of suggestions) {
      if (suggestion.confidence < CONFIDENCE_THRESHOLD) continue;

      const tx = uncategorized[suggestion.index];
      if (!tx) continue;

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          category: [suggestion.category],
          category_source: "ai",
          updated_at: new Date().toISOString(),
        })
        .eq("transaction_id", tx.transaction_id);

      if (!updateError) {
        categorizedCount++;
        applied.push({
          merchant: tx.merchant_name || tx.name || "Unknown",
          category: suggestion.category,
        });
      }
    }

    console.log(
      `[Auto-categorize] Complete: ${categorizedCount}/${uncategorized.length} categorized`,
    );

    return NextResponse.json(
      {
        ok: true,
        categorized: categorizedCount,
        total_analyzed: uncategorized.length,
        applied,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Auto-categorize] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
