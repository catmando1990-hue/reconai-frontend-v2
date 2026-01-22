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

/**
 * Intelligence Lifecycle Status
 * - success: Insights are valid and ready for display
 * - pending: Insights are being computed
 * - failed: Computation failed, reason_code required
 * - stale: Insights exist but are outdated
 */
export type IntelligenceLifecycleStatus =
  | "success"
  | "pending"
  | "failed"
  | "stale";

/**
 * Intelligence Reason Codes - Required for non-success lifecycle states
 * Provides explicit context for why insights are unavailable
 */
export type IntelligenceReasonCode =
  | "insufficient_data"
  | "computation_error"
  | "backend_timeout"
  | "data_stale"
  | "no_transactions"
  | "not_configured"
  | "unknown";

export type InsightsSummaryResponse = {
  /** Version of Intelligence contract - frontend validates against supported versions */
  intelligence_version: string;
  /** Lifecycle status - REQUIRED for rendering decisions */
  lifecycle: IntelligenceLifecycleStatus;
  /** Reason code - REQUIRED when lifecycle is not "success" */
  reason_code: IntelligenceReasonCode | null;
  /** Human-readable reason message */
  reason_message: string | null;
  generated_at: string; // ISO8601
  /** Insights data - only valid when lifecycle is "success" */
  items: Insight[] | null;
};

/**
 * CFO Lifecycle Status
 * - success: Data is valid and ready for display
 * - pending: Data is being computed
 * - failed: Computation failed, reason_code required
 * - stale: Data exists but is outdated
 */
export type CfoLifecycleStatus = "success" | "pending" | "failed" | "stale";

/**
 * CFO Reason Codes - Required for non-success lifecycle states
 * Provides explicit context for why data is unavailable
 */
export type CfoReasonCode =
  | "insufficient_data"
  | "computation_error"
  | "backend_timeout"
  | "data_stale"
  | "not_configured"
  | "unknown";

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
  /** Version of CFO contract - frontend validates against supported versions */
  cfo_version: string;
  /** Lifecycle status - REQUIRED for rendering decisions */
  lifecycle: CfoLifecycleStatus;
  /** Reason code - REQUIRED when lifecycle is not "success" */
  reason_code: CfoReasonCode | null;
  /** Human-readable reason message */
  reason_message: string | null;
  generated_at: string; // ISO8601
  /** Snapshot data - only valid when lifecycle is "success" */
  snapshot: CfoSnapshot | null;
};
