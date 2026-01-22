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

// =============================================================================
// GOVCON COMPLIANCE TYPES
// =============================================================================

/**
 * GovCon Lifecycle Status
 * - success: Data is valid, evidence attached, ready for display
 * - pending: Compliance check in progress
 * - failed: Compliance check failed, reason_code required
 * - stale: Data exists but may be outdated
 * - no_evidence: Data exists but lacks required evidence
 */
export type GovConLifecycleStatus =
  | "success"
  | "pending"
  | "failed"
  | "stale"
  | "no_evidence";

/**
 * GovCon Reason Codes - Required for non-success lifecycle states
 * Provides explicit context for compliance status
 */
export type GovConReasonCode =
  | "no_contracts"
  | "no_timesheets"
  | "missing_evidence"
  | "evidence_expired"
  | "audit_incomplete"
  | "configuration_required"
  | "dcaa_validation_failed"
  | "backend_timeout"
  | "unknown";

/**
 * Evidence attachment - REQUIRED for DCAA compliance
 */
export type GovConEvidence = {
  id: string;
  type: "timesheet" | "invoice" | "contract" | "approval" | "audit_log";
  filename: string;
  hash: string; // SHA-256
  uploaded_at: string; // ISO8601
  verified: boolean;
};

/**
 * DCAA Readiness Item
 */
export type DcaaReadinessItem = {
  id: string;
  category:
    | "timekeeping"
    | "job_cost"
    | "audit_trail"
    | "ics_schedules"
    | "indirect_rates";
  status: "compliant" | "non_compliant" | "not_evaluated" | "pending";
  last_checked: string | null; // ISO8601
  evidence_count: number;
  issues: string[];
};

/**
 * GovCon Compliance Snapshot
 */
export type GovConSnapshot = {
  as_of: string; // ISO8601
  active_contracts: number | null;
  pending_timesheets: number | null;
  audit_entries: number | null;
  dcaa_readiness: DcaaReadinessItem[];
  evidence_attached: GovConEvidence[];
};

export type GovConSnapshotResponse = {
  /** Version of GovCon contract - frontend validates against supported versions */
  govcon_version: string;
  /** Lifecycle status - REQUIRED for rendering decisions */
  lifecycle: GovConLifecycleStatus;
  /** Reason code - REQUIRED when lifecycle is not "success" */
  reason_code: GovConReasonCode | null;
  /** Human-readable reason message */
  reason_message: string | null;
  generated_at: string; // ISO8601
  /** Snapshot data - only valid when lifecycle is "success" */
  snapshot: GovConSnapshot | null;
  /** Evidence REQUIRED for compliance - fail-closed if missing */
  has_evidence: boolean;
};
