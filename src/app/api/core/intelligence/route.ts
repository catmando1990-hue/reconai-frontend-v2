import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { IntelligenceSignal } from "@/lib/intelligence-types";

/**
 * Core Intelligence API
 *
 * Returns AI-generated signals for Core module:
 * - Transaction classification anomalies
 * - Duplicate clusters
 * - Category drift
 * - Merchant normalization issues
 *
 * NOTE: In production, this would call the backend API.
 * Currently returns demo data with explicit labeling.
 */

// Demo data for Core intelligence
const DEMO_CORE_SIGNALS: IntelligenceSignal[] = [
  {
    id: "core-1",
    title: "Potential Duplicate Transactions Detected",
    description:
      "Found 3 transactions with similar amounts and dates from the same merchant. These may be duplicates that need review.",
    confidence: 0.92,
    severity: "medium",
    category: "Duplicate Detection",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      transactions: [
        { id: "txn-001", amount: 150.0, date: "2024-01-15", merchant: "AWS" },
        { id: "txn-002", amount: 150.0, date: "2024-01-15", merchant: "AWS" },
        { id: "txn-003", amount: 150.0, date: "2024-01-16", merchant: "AWS" },
      ],
    },
    advisory_disclaimer:
      "Review each transaction individually before marking as duplicate. Some recurring charges may appear similar but are distinct.",
  },
  {
    id: "core-2",
    title: "Category Drift: Office Supplies",
    description:
      "The 'Office Supplies' category shows significant variance from historical patterns. 23% increase in transactions categorized here vs. last quarter.",
    confidence: 0.87,
    severity: "low",
    category: "Category Drift",
    created_at: new Date().toISOString(),
    actionable: false,
    evidence: {
      current_quarter: { count: 45, total: 3200 },
      previous_quarter: { count: 36, total: 2450 },
      variance_percent: 23,
    },
    advisory_disclaimer:
      "Category drift may indicate changes in spending patterns or miscategorization. Review recent transactions in this category.",
  },
  {
    id: "core-3",
    title: "Merchant Normalization Opportunity",
    description:
      'Multiple merchant name variations detected for "Amazon". Consider normalizing to a single merchant name for better reporting.',
    confidence: 0.95,
    severity: "low",
    category: "Merchant Normalization",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      variations: [
        "AMAZON.COM",
        "AMZN MKTP US",
        "Amazon Web Services",
        "AMAZON PRIME",
      ],
      transaction_count: 28,
    },
    advisory_disclaimer:
      "Merchant normalization is advisory. Some variations may represent legitimately different business units.",
  },
];

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", request_id: requestId },
      { status: 401, headers: { "x-request-id": requestId } },
    );
  }

  // In production, fetch from backend API with orgId
  // const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  // const response = await fetch(`${backendUrl}/api/intelligence/core?org_id=${orgId}`);

  // For now, return demo data with lifecycle
  return NextResponse.json(
    {
      lifecycle: "success",
      generated_at: new Date().toISOString(),
      items: DEMO_CORE_SIGNALS,
      request_id: requestId,
      _demo: true, // Explicit demo labeling
      _org_id: orgId,
    },
    { headers: { "x-request-id": requestId } },
  );
}
