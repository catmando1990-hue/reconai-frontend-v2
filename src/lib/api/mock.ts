// src/lib/api/mock.ts
// Phase 34: Mock data used when backend is unavailable.
// NOTE: This is intentional to keep UI logic real while backend contracts finalize.

import type {
  CfoSnapshotResponse,
  InsightsSummaryResponse,
} from "@/lib/api/types";

function isoNow() {
  return new Date().toISOString();
}

export function mockInsights(): InsightsSummaryResponse {
  const now = isoNow();
  return {
    generated_at: now,
    items: [
      {
        id: "ins_001",
        title: "Unusual spend spike at a recurring vendor",
        summary:
          "Vendor spend increased 38% vs prior 30-day baseline. Review for scope creep or pricing change.",
        type: "anomaly",
        severity: "medium",
        confidence: 0.86,
        created_at: now,
        source: "hybrid",
      },
      {
        id: "ins_002",
        title: "Potential duplicate charge detected",
        summary:
          "Two transactions appear similar in merchant and amount. Confirm if one should be disputed or reclassified.",
        type: "duplicate_charge",
        severity: "high",
        confidence: 0.91,
        created_at: now,
        source: "rules",
      },
      {
        id: "ins_003",
        title: "Cash flow: upcoming obligations concentrated in 7 days",
        summary:
          "A cluster of expected bills may compress liquidity. Consider timing adjustments or reserve planning.",
        type: "cash_flow",
        severity: "low",
        confidence: 0.74,
        created_at: now,
        source: "ml",
      },
    ],
  };
}

export function mockCfoSnapshot(): CfoSnapshotResponse {
  const now = isoNow();
  return {
    generated_at: now,
    snapshot: {
      as_of: now,
      runway_days: 62,
      cash_on_hand: null,
      burn_rate_monthly: null,
      top_risks: [
        {
          id: "risk_001",
          title: "Unreviewed high-severity anomaly",
          severity: "high",
        },
        {
          id: "risk_002",
          title: "Uncategorized transactions trending upward",
          severity: "medium",
        },
      ],
      next_actions: [
        {
          id: "act_001",
          title: "Review duplicate charge candidates",
          rationale:
            "High confidence pattern match. Confirm and dispute if needed.",
        },
        {
          id: "act_002",
          title: "Set vendor rule for recurring spike vendor",
          rationale:
            "Reduce future drift and improve categorization consistency.",
        },
      ],
    },
  };
}
