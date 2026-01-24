import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/intelligence/alerts
 *
 * Claude-powered alerts from transaction analysis.
 * Returns actionable alerts (duplicates, anomalies, compliance issues).
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

interface AlertItem {
  id: string;
  title: string;
  summary: string;
  kind: "duplicate_charge" | "anomaly" | "compliance" | "data_quality";
  status: "new" | "in_review" | "resolved";
  confidence: number;
  transaction_ids: string[];
  created_at: string;
}

interface ClaudeAlertsResponse {
  alerts: Array<{
    kind: string;
    title: string;
    summary: string;
    confidence: number;
    transaction_indices: number[];
  }>;
}

function sanitizeTransactions(transactions: Transaction[]): SanitizedTransaction[] {
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
        `[${tx.index}] ${tx.date} | $${tx.amount.toFixed(2)} | ${tx.merchant || tx.description} | ${tx.category || "Uncategorized"}`,
    )
    .join("\n");

  return `You are a financial compliance analyst. Review these transactions and identify alerts requiring human review.

TRANSACTIONS:
${txList}

Generate alerts for:
1. DUPLICATE CHARGES - Same amount, merchant, within 48 hours
2. ANOMALIES - Unusual amounts or patterns vs typical spending
3. COMPLIANCE ISSUES - Missing documentation, unusual vendors, large round numbers
4. DATA QUALITY - Missing categories, incomplete merchant info

Respond ONLY with valid JSON:
{
  "alerts": [
    {
      "kind": "duplicate_charge",
      "title": "Potential duplicate charge requires review",
      "summary": "Two transactions appear similar in merchant and amount. Confirm if one is a duplicate.",
      "confidence": 0.92,
      "transaction_indices": [5, 7]
    },
    {
      "kind": "compliance",
      "title": "Large transaction missing documentation",
      "summary": "Transaction over $1000 without clear merchant categorization. Consider adding notes.",
      "confidence": 0.88,
      "transaction_indices": [12]
    }
  ]
}

Rules:
- Only include alerts with confidence >= 0.85
- Maximum 10 alerts
- kind must be one of: duplicate_charge, anomaly, compliance, data_quality
- transaction_indices must reference actual indices
- Be specific and actionable in summaries`;
}

async function callClaude(
  prompt: string,
  apiKey: string,
): Promise<ClaudeAlertsResponse | null> {
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
    console.error("[Intelligence alerts] Claude API error:", response.status);
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) return null;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ClaudeAlertsResponse;
  } catch {
    console.error("[Intelligence alerts] Failed to parse Claude response");
    return null;
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();

  const emptyResponse = (isDemo = false, disclaimer?: string) =>
    NextResponse.json(
      {
        generated_at: now,
        items: [],
        _isDemo: isDemo,
        _demoDisclaimer: disclaimer,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );

  try {
    const { userId } = await auth();
    if (!userId) {
      return emptyResponse();
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return emptyResponse();
    }

    // Fetch transactions from Supabase (user-scoped)
    const supabase = supabaseAdmin();
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("id, transaction_id, date, amount, name, merchant_name, category, pending")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Intelligence alerts] Supabase error:", error.message);
      return emptyResponse();
    }

    if (!transactions || transactions.length === 0) {
      return emptyResponse();
    }

    // Sanitize and analyze
    const sanitized = sanitizeTransactions(transactions as Transaction[]);
    const prompt = buildPrompt(sanitized);
    const analysis = await callClaude(prompt, apiKey);

    if (!analysis) {
      return emptyResponse();
    }

    // Map alerts back to transaction IDs
    const items: AlertItem[] = analysis.alerts
      .filter((a) => a.confidence >= 0.85)
      .slice(0, 10)
      .map((alert, idx) => ({
        id: `alert_${requestId.slice(0, 8)}_${idx}`,
        title: alert.title,
        summary: alert.summary,
        kind: (alert.kind as AlertItem["kind"]) || "anomaly",
        status: "new" as const,
        confidence: alert.confidence,
        transaction_ids: alert.transaction_indices.map(
          (i) => transactions[i]?.transaction_id || `tx_${i}`,
        ),
        created_at: now,
      }));

    return NextResponse.json(
      {
        generated_at: now,
        items,
        request_id: requestId,
        _transaction_count: transactions.length,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Intelligence alerts] Error:", err);
    return emptyResponse();
  }
}
