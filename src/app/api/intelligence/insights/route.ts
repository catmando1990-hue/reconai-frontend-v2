import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/intelligence/insights
 *
 * Returns Claude-powered insights from transaction analysis.
 * Queries Supabase for user transactions, sends to Claude for analysis.
 *
 * SECURITY:
 * - User-scoped queries only
 * - No sensitive data in Claude request
 * - Fail-closed on any error
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface Transaction {
  id: string;
  transaction_id: string;
  date: string;
  amount: number;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  pending: boolean;
}

interface SanitizedTransaction {
  index: number;
  date: string;
  amount: number;
  description: string;
  merchant: string | null;
  category: string | null;
}

interface InsightItem {
  id: string;
  type: "categorization" | "duplicate" | "anomaly" | "trend";
  title: string;
  summary: string;
  confidence: number;
  source: "llm" | "rules" | "ml" | "hybrid";
  transaction_ids: string[];
  suggested_category?: string;
  created_at: string;
}

interface ClaudeInsightsResponse {
  insights: Array<{
    type: string;
    title: string;
    summary: string;
    confidence: number;
    transaction_indices: number[];
    suggested_category?: string;
  }>;
}

function sanitizeTransactions(
  transactions: Transaction[],
): SanitizedTransaction[] {
  return transactions.map((tx, index) => ({
    index,
    date: tx.date,
    amount: tx.amount,
    description: tx.name,
    merchant: tx.merchant_name,
    category: tx.category?.[0] || null,
  }));
}

function buildPrompt(transactions: SanitizedTransaction[]): string {
  const txList = transactions
    .map(
      (tx) =>
        `[${tx.index}] ${tx.date} | $${tx.amount.toFixed(2)} | ${tx.merchant || tx.description} | Category: ${tx.category || "Uncategorized"}`,
    )
    .join("\n");

  return `You are a financial analyst. Analyze these transactions and identify actionable insights.

TRANSACTIONS:
${txList}

Generate insights for:
1. MISCATEGORIZED transactions - wrong or missing category
2. POTENTIAL DUPLICATES - same amount/merchant within short time
3. UNUSUAL SPENDING - anomalies vs typical patterns
4. SPENDING TRENDS - notable patterns

Respond ONLY with valid JSON:
{
  "insights": [
    {
      "type": "categorization",
      "title": "Miscategorized software expense",
      "summary": "Transaction appears to be SaaS subscription but categorized as 'Other'",
      "confidence": 0.91,
      "transaction_indices": [5],
      "suggested_category": "Software & SaaS"
    },
    {
      "type": "duplicate",
      "title": "Potential duplicate charge",
      "summary": "Two identical charges from same merchant within 24 hours",
      "confidence": 0.88,
      "transaction_indices": [12, 14]
    }
  ]
}

Rules:
- Only include insights with confidence >= 0.85
- Maximum 10 insights
- transaction_indices must reference actual indices from the list
- Be specific in summaries`;
}

async function callClaude(
  prompt: string,
  apiKey: string,
): Promise<ClaudeInsightsResponse | null> {
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
    console.error("[Intelligence insights] Claude API error:", response.status);
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ClaudeInsightsResponse;
  } catch {
    console.error("[Intelligence insights] Failed to parse Claude response");
    return null;
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();

  const failClosed = (reasonCode: string, reasonMessage: string) =>
    NextResponse.json(
      {
        intelligence_version: "1",
        lifecycle: "failed",
        reason_code: reasonCode,
        reason_message: reasonMessage,
        generated_at: now,
        items: null,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );

  try {
    const { userId } = await auth();
    if (!userId) {
      return failClosed("not_authenticated", "Authentication required");
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return failClosed("not_configured", "Intelligence API not configured");
    }

    // Fetch transactions from Supabase (user-scoped)
    const supabase = supabaseAdmin();
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        "id, transaction_id, date, amount, name, merchant_name, category, pending",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Intelligence insights] Supabase error:", error.message);
      return failClosed("database_error", "Failed to fetch transactions");
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        {
          intelligence_version: "1",
          lifecycle: "success",
          reason_code: null,
          reason_message: null,
          generated_at: now,
          items: [],
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Sanitize and analyze
    const sanitized = sanitizeTransactions(transactions as Transaction[]);
    const prompt = buildPrompt(sanitized);
    const analysis = await callClaude(prompt, apiKey);

    if (!analysis) {
      return failClosed("analysis_failed", "Claude analysis unavailable");
    }

    // Map insights back to transaction IDs
    const items: InsightItem[] = analysis.insights
      .filter((i) => i.confidence >= 0.85)
      .slice(0, 10)
      .map((insight, idx) => ({
        id: `insight_${requestId.slice(0, 8)}_${idx}`,
        type: (insight.type as InsightItem["type"]) || "anomaly",
        title: insight.title,
        summary: insight.summary,
        confidence: insight.confidence,
        source: "llm" as const,
        transaction_ids: insight.transaction_indices.map(
          (i) => transactions[i]?.transaction_id || `tx_${i}`,
        ),
        suggested_category: insight.suggested_category,
        created_at: now,
      }));

    return NextResponse.json(
      {
        intelligence_version: "1",
        lifecycle: "success",
        reason_code: null,
        reason_message: null,
        generated_at: now,
        items,
        request_id: requestId,
        _transaction_count: transactions.length,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Intelligence insights] Error:", err);
    return failClosed(
      "computation_error",
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}
