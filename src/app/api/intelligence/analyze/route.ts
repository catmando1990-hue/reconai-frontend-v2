import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/intelligence/analyze
 *
 * Claude-powered transaction intelligence.
 * Fetches user transactions from Supabase, sends to Claude for analysis.
 * Includes user-defined category rules for learning.
 *
 * SECURITY INVARIANTS:
 * - Transactions scoped by authenticated user_id
 * - Sensitive fields (account_id, transaction_id) stripped before sending to Claude
 * - No logging of transaction data
 * - No persistence of results
 * - Fail-closed on any error
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const CONFIDENCE_THRESHOLD = 0.85;

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

interface CategoryRule {
  merchant_pattern: string;
  category: string;
}

interface SanitizedTransaction {
  index: number;
  date: string;
  amount: number;
  description: string;
  merchant: string | null;
  existing_category: string | null;
}

interface CategorizedTransaction {
  index: number;
  suggested_category: string;
  confidence: number;
  explanation: string;
}

interface DuplicateGroup {
  indices: number[];
  confidence: number;
  explanation: string;
}

interface CashflowInsight {
  trend: string;
  forecast: string | null;
  confidence: number;
  explanation: string;
}

interface ClaudeAnalysisResponse {
  categorizations: CategorizedTransaction[];
  duplicates: DuplicateGroup[];
  cashflow: CashflowInsight | null;
}

function sanitizeTransactions(transactions: Transaction[]): SanitizedTransaction[] {
  return transactions.map((tx, index) => ({
    index,
    date: tx.date,
    amount: tx.amount,
    description: tx.name,
    merchant: tx.merchant_name,
    existing_category: tx.category?.[0] || null,
  }));
}

function buildPrompt(
  transactions: SanitizedTransaction[],
  userRules: CategoryRule[],
): string {
  const txList = transactions
    .map(
      (tx) =>
        `[${tx.index}] ${tx.date} | $${tx.amount.toFixed(2)} | ${tx.merchant || tx.description} | Category: ${tx.existing_category || "Uncategorized"}`,
    )
    .join("\n");

  // Build user rules section if any exist
  let rulesSection = "";
  if (userRules.length > 0) {
    const rulesList = userRules
      .map((r) => `- "${r.merchant_pattern}" → "${r.category}"`)
      .join("\n");
    rulesSection = `
USER-DEFINED CATEGORY RULES (MUST APPLY):
The user has defined these merchant-to-category mappings. You MUST use these categories for matching merchants. These take priority over your own judgment.

${rulesList}

When a transaction's merchant or description contains any of these patterns (case-insensitive), use the user's specified category with 0.99 confidence.
`;
  }

  return `You are a financial analyst assistant. Analyze these transactions and provide:

1. CATEGORIZATION SUGGESTIONS: For transactions that appear miscategorized or uncategorized, suggest appropriate categories. Only suggest if you have high confidence (>= 0.85).

2. DUPLICATE DETECTION: Identify potential duplicate transactions (same amount, similar dates, same merchant). Flag suspicious patterns.

3. CASHFLOW INSIGHT: Provide a brief trend analysis and forecast based on spending patterns.
${rulesSection}
TRANSACTIONS:
${txList}

Respond ONLY with valid JSON in this exact format:
{
  "categorizations": [
    {
      "index": 0,
      "suggested_category": "Software & SaaS",
      "confidence": 0.92,
      "explanation": "Merchant name indicates subscription software"
    }
  ],
  "duplicates": [
    {
      "indices": [5, 7],
      "confidence": 0.88,
      "explanation": "Same amount and merchant within 48 hours"
    }
  ],
  "cashflow": {
    "trend": "stable",
    "forecast": "slight decrease expected",
    "confidence": 0.85,
    "explanation": "Recurring expenses consistent, one-time purchases declining"
  }
}

Rules:
- Only include categorizations where confidence >= 0.85
- Only include duplicates where confidence >= 0.85
- If no issues found, return empty arrays
- Do not invent transactions or indices
- Base analysis only on provided data
- User-defined rules take absolute priority - use 0.99 confidence for matches`;
}

async function callClaude(prompt: string, apiKey: string): Promise<ClaudeAnalysisResponse | null> {
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
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("[Intelligence analyze] Claude API error:", response.status);
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    console.error("[Intelligence analyze] No content in Claude response");
    return null;
  }

  try {
    // Extract JSON from response (Claude may wrap in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Intelligence analyze] No JSON found in response");
      return null;
    }
    return JSON.parse(jsonMatch[0]) as ClaudeAnalysisResponse;
  } catch (err) {
    console.error("[Intelligence analyze] Failed to parse Claude response:", err);
    return null;
  }
}

export async function POST() {
  const requestId = crypto.randomUUID();

  // Fail-closed response
  const failClosed = (reason: string) =>
    NextResponse.json(
      {
        suggestions: [],
        duplicates: [],
        cashflow: null,
        request_id: requestId,
        _analyzed: false,
        _reason: reason,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );

  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return failClosed("not_authenticated");
    }

    // API key check
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[Intelligence analyze] ANTHROPIC_API_KEY not configured");
      return failClosed("api_not_configured");
    }

    const supabase = supabaseAdmin();

    // Fetch user's category rules for learning
    const { data: rulesData } = await supabase
      .from("category_rules")
      .select("merchant_pattern, category")
      .eq("user_id", userId);

    const userRules: CategoryRule[] = (rulesData || []).map((r) => ({
      merchant_pattern: r.merchant_pattern,
      category: r.category,
    }));

    // Fetch transactions from Supabase (user-scoped)
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("id, transaction_id, date, amount, name, merchant_name, category, pending")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Intelligence analyze] Supabase error:", error.message);
      return failClosed("database_error");
    }

    if (!transactions || transactions.length === 0) {
      return failClosed("no_transactions");
    }

    // Sanitize before sending to Claude
    const sanitized = sanitizeTransactions(transactions as Transaction[]);

    // Build prompt with user rules and call Claude
    const prompt = buildPrompt(sanitized, userRules);
    const analysis = await callClaude(prompt, apiKey);

    if (!analysis) {
      return failClosed("analysis_failed");
    }

    // Map results back to transaction IDs with display info
    const suggestions = analysis.categorizations
      .filter((c) => c.confidence >= CONFIDENCE_THRESHOLD)
      .map((c) => {
        const tx = transactions[c.index] as Transaction | undefined;
        return {
          transaction_id: tx?.transaction_id || `tx_${c.index}`,
          suggested_category: c.suggested_category,
          confidence: c.confidence,
          explanation: c.explanation,
          // Include display info for UI
          merchant_name: tx?.merchant_name || null,
          description: tx?.name || null,
          amount: tx?.amount || null,
          date: tx?.date || null,
          current_category: tx?.category?.[0] || null,
          evidence: [
            { type: "ai_analysis", value: "claude-sonnet-4" },
            { type: "threshold", value: CONFIDENCE_THRESHOLD },
          ],
        };
      });

    const duplicates = analysis.duplicates
      .filter((d) => d.confidence >= CONFIDENCE_THRESHOLD)
      .map((d, idx) => ({
        group_id: `dup_${requestId.slice(0, 8)}_${idx}`,
        transactions: d.indices.map((i) => transactions[i]?.transaction_id || `tx_${i}`),
        confidence: d.confidence,
        explanation: d.explanation,
        evidence: [
          { type: "ai_analysis", value: "claude-sonnet-4" },
          { type: "indices", value: d.indices },
        ],
      }));

    const cashflow = analysis.cashflow
      ? {
          trend: analysis.cashflow.trend,
          forecast: analysis.cashflow.forecast,
          confidence: analysis.cashflow.confidence,
          explanation: analysis.cashflow.explanation,
        }
      : null;

    return NextResponse.json(
      {
        suggestions,
        duplicates,
        cashflow,
        request_id: requestId,
        _analyzed: true,
        _transaction_count: transactions.length,
        _rules_applied: userRules.length,
        _timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Intelligence analyze] Unexpected error:", err);
    return failClosed("unexpected_error");
  }
}
