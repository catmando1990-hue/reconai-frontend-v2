// src/lib/api/types.ts
// Phase 34: Typed API contracts for frontend logic (backend-agnostic).
// Enterprise rule: UI depends on stable contracts, not backend internals.

export type InsightSeverity = "low" | "medium" | "high";
export type InsightType =
  | "anomaly"
  | "cash_flow"
  | "category_drift"
  | "duplicate_charge"
  | "vendor_risk"
  | "compliance"
  | "opportunity";

export type Insight = {
  id: string;
  title: string;
  summary: string;
  type: InsightType;
  severity: InsightSeverity;
  confidence: number; // 0..1
  created_at: string; // ISO8601
  source: "rules" | "ml" | "llm" | "hybrid";
};

export type InsightsSummaryResponse = {
  generated_at: string; // ISO8601
  items: Insight[];
};

export type CfoSnapshot = {
  as_of: string; // ISO8601
  runway_days: number | null;
  cash_on_hand: number | null;
  burn_rate_monthly: number | null;
  top_risks: Array<{
    id: string;
    title: string;
    severity: InsightSeverity;
  }>;
  next_actions: Array<{
    id: string;
    title: string;
    rationale: string;
  }>;
};

export type CfoSnapshotResponse = {
  generated_at: string; // ISO8601
  snapshot: CfoSnapshot;
};
