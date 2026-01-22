// tests/fixtures/govcon-state-factory.ts
/**
 * Canonical GovCon State Factory (Phase 36)
 *
 * SINGLE SOURCE OF TRUTH for GovCon/DCAA compliance test data.
 * All tests MUST use this factory to ensure contract compliance.
 *
 * CANONICAL LAWS:
 * - govcon_version is ALWAYS present and must match SUPPORTED_GOVCON_VERSIONS
 * - lifecycle is ALWAYS present (no inference)
 * - reason_code is REQUIRED when lifecycle !== "success"
 * - snapshot is REQUIRED when lifecycle === "success"
 * - has_evidence is ALWAYS present (boolean) - REQUIRED for DCAA compliance
 * - SUCCESS requires BOTH lifecycle success AND has_evidence === true
 *
 * CONTRACT VERSION: 1
 */

import type {
  GovConSnapshotResponse,
  GovConLifecycleStatus,
  GovConReasonCode,
  GovConSnapshot,
  GovConEvidence,
  DcaaReadinessItem,
} from "@/lib/api/types";

// =============================================================================
// CONTRACT VERSION (Must match useGovConSnapshot.tsx)
// =============================================================================

export const GOVCON_CONTRACT_VERSION = "1";

export const SUPPORTED_GOVCON_VERSIONS = ["1"] as const;
export type SupportedGovConVersion = (typeof SUPPORTED_GOVCON_VERSIONS)[number];

// =============================================================================
// VALID ENUM VALUES (Fail-closed validation)
// =============================================================================

export const VALID_GOVCON_LIFECYCLE_STATUSES: readonly GovConLifecycleStatus[] =
  ["success", "pending", "failed", "stale", "no_evidence"] as const;

export const VALID_GOVCON_REASON_CODES: readonly GovConReasonCode[] = [
  "no_contracts",
  "no_timesheets",
  "missing_evidence",
  "evidence_expired",
  "audit_incomplete",
  "configuration_required",
  "dcaa_validation_failed",
  "backend_timeout",
  "unknown",
] as const;

export const VALID_EVIDENCE_TYPES = [
  "timesheet",
  "invoice",
  "contract",
  "approval",
  "audit_log",
] as const;

export const VALID_DCAA_CATEGORIES = [
  "timekeeping",
  "job_cost",
  "audit_trail",
  "ics_schedules",
  "indirect_rates",
] as const;

export const VALID_DCAA_STATUSES = [
  "compliant",
  "non_compliant",
  "not_evaluated",
  "pending",
] as const;

// =============================================================================
// EVIDENCE BUILDERS
// =============================================================================

export type GovConEvidenceOverrides = Partial<GovConEvidence>;

/**
 * Create a valid GovConEvidence with defaults
 */
export function evidenceBuilder(
  overrides: GovConEvidenceOverrides = {},
): GovConEvidence {
  return {
    id: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "timesheet",
    filename: "timesheet_2024_01.pdf",
    hash: "sha256:abc123def456789...",
    uploaded_at: new Date().toISOString(),
    verified: true,
    ...overrides,
  };
}

/**
 * Create multiple evidence items for testing
 */
export function evidenceListBuilder(count: number = 3): GovConEvidence[] {
  const types: GovConEvidence["type"][] = [
    "timesheet",
    "invoice",
    "contract",
    "approval",
    "audit_log",
  ];

  return Array.from({ length: count }, (_, i) =>
    evidenceBuilder({
      id: `evidence-${i + 1}`,
      type: types[i % types.length],
      filename: `${types[i % types.length]}_${i + 1}.pdf`,
    }),
  );
}

// =============================================================================
// DCAA READINESS BUILDERS
// =============================================================================

export type DcaaReadinessOverrides = Partial<DcaaReadinessItem>;

/**
 * Create a valid DcaaReadinessItem with defaults
 */
export function dcaaReadinessBuilder(
  overrides: DcaaReadinessOverrides = {},
): DcaaReadinessItem {
  return {
    id: `dcaa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: "timekeeping",
    status: "compliant",
    last_checked: new Date().toISOString(),
    evidence_count: 5,
    issues: [],
    ...overrides,
  };
}

/**
 * Create all DCAA readiness items (one per category)
 */
export function fullDcaaReadinessBuilder(): DcaaReadinessItem[] {
  return VALID_DCAA_CATEGORIES.map((category, i) =>
    dcaaReadinessBuilder({
      id: `dcaa-${category}`,
      category,
      status: "compliant",
      evidence_count: 3 + i,
    }),
  );
}

// =============================================================================
// SNAPSHOT BUILDER
// =============================================================================

export type GovConSnapshotOverrides = Partial<GovConSnapshot>;

/**
 * Create a valid GovConSnapshot with defaults
 */
export function govconSnapshotBuilder(
  overrides: GovConSnapshotOverrides = {},
): GovConSnapshot {
  return {
    as_of: new Date().toISOString(),
    active_contracts: 3,
    pending_timesheets: 2,
    audit_entries: 150,
    dcaa_readiness: fullDcaaReadinessBuilder(),
    evidence_attached: evidenceListBuilder(5),
    ...overrides,
  };
}

// =============================================================================
// CANONICAL GOVCON STATE FACTORY
// =============================================================================

export type GovConStateFactoryOverrides = {
  govcon_version?: string;
  lifecycle?: GovConLifecycleStatus;
  reason_code?: GovConReasonCode | null;
  reason_message?: string | null;
  generated_at?: string;
  snapshot?: GovConSnapshot | null;
  has_evidence?: boolean;
};

/**
 * CANONICAL GOVCON STATE FACTORY
 *
 * Creates a valid GovConSnapshotResponse with sensible defaults.
 * Use this for ALL GovCon-related tests.
 *
 * DCAA COMPLIANCE RULES:
 * - has_evidence MUST always be present (boolean)
 * - SUCCESS requires BOTH lifecycle "success" AND has_evidence === true
 *
 * @param overrides - Optional overrides for any field
 * @returns A valid GovConSnapshotResponse
 *
 * @example
 * // Success state with evidence
 * const state = govconStateFactory();
 *
 * @example
 * // Failed state with reason
 * const state = govconStateFactory({
 *   lifecycle: "failed",
 *   reason_code: "dcaa_validation_failed",
 *   reason_message: "Timekeeping records incomplete",
 *   snapshot: null,
 *   has_evidence: false,
 * });
 */
export function govconStateFactory(
  overrides: GovConStateFactoryOverrides = {},
): GovConSnapshotResponse {
  const lifecycle = overrides.lifecycle ?? "success";

  // Apply canonical laws
  const needsReasonCode = lifecycle !== "success";
  const needsSnapshot = lifecycle === "success";

  // Default has_evidence based on lifecycle
  const has_evidence =
    overrides.has_evidence ?? (lifecycle === "success" ? true : false);

  return {
    govcon_version: overrides.govcon_version ?? GOVCON_CONTRACT_VERSION,
    lifecycle,
    reason_code: needsReasonCode
      ? (overrides.reason_code ?? "unknown")
      : (overrides.reason_code ?? null),
    reason_message: needsReasonCode
      ? (overrides.reason_message ?? "Compliance data unavailable")
      : (overrides.reason_message ?? null),
    generated_at: overrides.generated_at ?? new Date().toISOString(),
    snapshot: needsSnapshot
      ? (overrides.snapshot ?? govconSnapshotBuilder())
      : (overrides.snapshot ?? null),
    has_evidence,
  };
}

// =============================================================================
// PRESET FACTORIES (Common test scenarios)
// =============================================================================

/**
 * Success state - Valid compliance data with evidence
 */
export function successGovConState(
  snapshotOverrides: GovConSnapshotOverrides = {},
): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "success",
    reason_code: null,
    reason_message: null,
    snapshot: govconSnapshotBuilder(snapshotOverrides),
    has_evidence: true,
  });
}

/**
 * Pending state - Compliance check in progress
 */
export function pendingGovConState(
  reason_message = "Compliance check in progress...",
): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "pending",
    reason_code: "configuration_required",
    reason_message,
    snapshot: null,
    has_evidence: false,
  });
}

/**
 * Failed state - Compliance check failed
 */
export function failedGovConState(
  reason_code: GovConReasonCode = "dcaa_validation_failed",
  reason_message = "Compliance validation failed",
): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "failed",
    reason_code,
    reason_message,
    snapshot: null,
    has_evidence: false,
  });
}

/**
 * Stale state - Data exists but may be outdated
 */
export function staleGovConState(
  snapshotOverrides: GovConSnapshotOverrides = {},
  reason_message = "Compliance data is more than 24 hours old",
): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "stale",
    reason_code: "evidence_expired",
    reason_message,
    snapshot: govconSnapshotBuilder(snapshotOverrides),
    has_evidence: true,
  });
}

/**
 * No evidence state - Data exists but lacks required evidence
 * CRITICAL: This state should fail compliance checks
 */
export function noEvidenceGovConState(
  reason_message = "Required evidence attachments missing",
): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "no_evidence",
    reason_code: "missing_evidence",
    reason_message,
    snapshot: govconSnapshotBuilder({
      evidence_attached: [], // No evidence
    }),
    has_evidence: false,
  });
}

/**
 * No contracts state - No government contracts configured
 */
export function noContractsGovConState(): GovConSnapshotResponse {
  return govconStateFactory({
    lifecycle: "failed",
    reason_code: "no_contracts",
    reason_message: "No government contracts found",
    snapshot: null,
    has_evidence: false,
  });
}

/**
 * Partial compliance state - Some items non-compliant
 */
export function partialComplianceGovConState(): GovConSnapshotResponse {
  const dcaaReadiness = fullDcaaReadinessBuilder().map((item, i) => ({
    ...item,
    status: i % 2 === 0 ? ("compliant" as const) : ("non_compliant" as const),
    issues: i % 2 === 0 ? [] : ["Missing documentation"],
  }));

  return govconStateFactory({
    lifecycle: "success", // Data is valid but has compliance issues
    snapshot: govconSnapshotBuilder({
      dcaa_readiness: dcaaReadiness,
    }),
    has_evidence: true,
  });
}

// =============================================================================
// SCHEMA ASSERTION HELPER
// =============================================================================

export class GovConStateValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
  ) {
    super(message);
    this.name = "GovConStateValidationError";
  }
}

/**
 * FAIL-CLOSED GOVCON STATE VALIDATOR
 *
 * Validates a GovConSnapshotResponse against the contract schema.
 * Throws GovConStateValidationError on any violation.
 *
 * CANONICAL LAWS ENFORCED:
 * 1. govcon_version MUST be present and supported
 * 2. lifecycle MUST be present and valid
 * 3. reason_code MUST be present when lifecycle !== "success"
 * 4. snapshot MUST be present when lifecycle === "success"
 * 5. generated_at MUST be present (ISO8601)
 * 6. has_evidence MUST be present (boolean) - REQUIRED for DCAA
 *
 * @param state - The state to validate
 * @throws GovConStateValidationError if validation fails
 */
export function assertValidGovConState(
  state: unknown,
): asserts state is GovConSnapshotResponse {
  if (!state || typeof state !== "object") {
    throw new GovConStateValidationError(
      "GovCon state must be a non-null object",
      "root",
      state,
    );
  }

  const s = state as Record<string, unknown>;

  // ==========================================================================
  // PART 1: govcon_version - REQUIRED, must be supported
  // ==========================================================================

  if (!("govcon_version" in s)) {
    throw new GovConStateValidationError(
      "Missing required field: govcon_version",
      "govcon_version",
      undefined,
    );
  }

  if (typeof s.govcon_version !== "string") {
    throw new GovConStateValidationError(
      `govcon_version must be a string, got ${typeof s.govcon_version}`,
      "govcon_version",
      s.govcon_version,
    );
  }

  if (
    !SUPPORTED_GOVCON_VERSIONS.includes(
      s.govcon_version as SupportedGovConVersion,
    )
  ) {
    throw new GovConStateValidationError(
      `Unsupported govcon_version: "${s.govcon_version}". Supported: ${SUPPORTED_GOVCON_VERSIONS.join(", ")}`,
      "govcon_version",
      s.govcon_version,
    );
  }

  // ==========================================================================
  // PART 2: lifecycle - REQUIRED, must be valid enum
  // ==========================================================================

  if (!("lifecycle" in s)) {
    throw new GovConStateValidationError(
      "Missing required field: lifecycle",
      "lifecycle",
      undefined,
    );
  }

  if (typeof s.lifecycle !== "string") {
    throw new GovConStateValidationError(
      `lifecycle must be a string, got ${typeof s.lifecycle}`,
      "lifecycle",
      s.lifecycle,
    );
  }

  if (
    !VALID_GOVCON_LIFECYCLE_STATUSES.includes(
      s.lifecycle as GovConLifecycleStatus,
    )
  ) {
    throw new GovConStateValidationError(
      `Invalid lifecycle: "${s.lifecycle}". Valid: ${VALID_GOVCON_LIFECYCLE_STATUSES.join(", ")}`,
      "lifecycle",
      s.lifecycle,
    );
  }

  // ==========================================================================
  // PART 3: reason_code - REQUIRED when lifecycle !== "success"
  // ==========================================================================

  const lifecycle = s.lifecycle as GovConLifecycleStatus;

  if (lifecycle !== "success") {
    if (!("reason_code" in s) || s.reason_code === null) {
      throw new GovConStateValidationError(
        `reason_code is required when lifecycle is "${lifecycle}"`,
        "reason_code",
        s.reason_code,
      );
    }

    if (typeof s.reason_code !== "string") {
      throw new GovConStateValidationError(
        `reason_code must be a string, got ${typeof s.reason_code}`,
        "reason_code",
        s.reason_code,
      );
    }

    if (
      !VALID_GOVCON_REASON_CODES.includes(s.reason_code as GovConReasonCode)
    ) {
      throw new GovConStateValidationError(
        `Invalid reason_code: "${s.reason_code}". Valid: ${VALID_GOVCON_REASON_CODES.join(", ")}`,
        "reason_code",
        s.reason_code,
      );
    }
  }

  // ==========================================================================
  // PART 4: generated_at - REQUIRED, ISO8601 string
  // ==========================================================================

  if (!("generated_at" in s)) {
    throw new GovConStateValidationError(
      "Missing required field: generated_at",
      "generated_at",
      undefined,
    );
  }

  if (typeof s.generated_at !== "string") {
    throw new GovConStateValidationError(
      `generated_at must be a string, got ${typeof s.generated_at}`,
      "generated_at",
      s.generated_at,
    );
  }

  // ==========================================================================
  // PART 5: has_evidence - REQUIRED, boolean (DCAA COMPLIANCE)
  // ==========================================================================

  if (!("has_evidence" in s)) {
    throw new GovConStateValidationError(
      "Missing required field: has_evidence (DCAA COMPLIANCE REQUIREMENT)",
      "has_evidence",
      undefined,
    );
  }

  if (typeof s.has_evidence !== "boolean") {
    throw new GovConStateValidationError(
      `has_evidence must be a boolean, got ${typeof s.has_evidence}`,
      "has_evidence",
      s.has_evidence,
    );
  }

  // ==========================================================================
  // PART 6: snapshot - REQUIRED when lifecycle === "success"
  // ==========================================================================

  if (lifecycle === "success") {
    if (!("snapshot" in s) || s.snapshot === null) {
      throw new GovConStateValidationError(
        'snapshot is required when lifecycle is "success"',
        "snapshot",
        s.snapshot,
      );
    }

    // Validate snapshot structure
    assertValidGovConSnapshot(s.snapshot);
  }

  // ==========================================================================
  // PART 7: reason_message - Must be string or null
  // ==========================================================================

  if ("reason_message" in s && s.reason_message !== null) {
    if (typeof s.reason_message !== "string") {
      throw new GovConStateValidationError(
        `reason_message must be a string or null, got ${typeof s.reason_message}`,
        "reason_message",
        s.reason_message,
      );
    }
  }
}

/**
 * Validate GovConSnapshot structure
 */
function assertValidGovConSnapshot(
  snapshot: unknown,
): asserts snapshot is GovConSnapshot {
  if (!snapshot || typeof snapshot !== "object") {
    throw new GovConStateValidationError(
      "snapshot must be a non-null object",
      "snapshot",
      snapshot,
    );
  }

  const snap = snapshot as Record<string, unknown>;

  // as_of - REQUIRED
  if (!("as_of" in snap) || typeof snap.as_of !== "string") {
    throw new GovConStateValidationError(
      "snapshot.as_of must be a string",
      "snapshot.as_of",
      snap.as_of,
    );
  }

  // dcaa_readiness - REQUIRED array
  if (!Array.isArray(snap.dcaa_readiness)) {
    throw new GovConStateValidationError(
      "snapshot.dcaa_readiness must be an array",
      "snapshot.dcaa_readiness",
      snap.dcaa_readiness,
    );
  }

  for (let i = 0; i < snap.dcaa_readiness.length; i++) {
    assertValidDcaaReadinessItem(
      snap.dcaa_readiness[i],
      `snapshot.dcaa_readiness[${i}]`,
    );
  }

  // evidence_attached - REQUIRED array
  if (!Array.isArray(snap.evidence_attached)) {
    throw new GovConStateValidationError(
      "snapshot.evidence_attached must be an array",
      "snapshot.evidence_attached",
      snap.evidence_attached,
    );
  }

  for (let i = 0; i < snap.evidence_attached.length; i++) {
    assertValidEvidence(
      snap.evidence_attached[i],
      `snapshot.evidence_attached[${i}]`,
    );
  }
}

/**
 * Validate DcaaReadinessItem structure
 */
function assertValidDcaaReadinessItem(item: unknown, context: string): void {
  if (!item || typeof item !== "object") {
    throw new GovConStateValidationError(
      `${context}: must be a non-null object`,
      context,
      item,
    );
  }

  const i = item as Record<string, unknown>;

  if (typeof i.id !== "string") {
    throw new GovConStateValidationError(
      `${context}.id must be a string`,
      `${context}.id`,
      i.id,
    );
  }

  if (
    !VALID_DCAA_CATEGORIES.includes(
      i.category as (typeof VALID_DCAA_CATEGORIES)[number],
    )
  ) {
    throw new GovConStateValidationError(
      `${context}.category must be one of: ${VALID_DCAA_CATEGORIES.join(", ")}`,
      `${context}.category`,
      i.category,
    );
  }

  if (
    !VALID_DCAA_STATUSES.includes(
      i.status as (typeof VALID_DCAA_STATUSES)[number],
    )
  ) {
    throw new GovConStateValidationError(
      `${context}.status must be one of: ${VALID_DCAA_STATUSES.join(", ")}`,
      `${context}.status`,
      i.status,
    );
  }

  if (typeof i.evidence_count !== "number") {
    throw new GovConStateValidationError(
      `${context}.evidence_count must be a number`,
      `${context}.evidence_count`,
      i.evidence_count,
    );
  }

  if (!Array.isArray(i.issues)) {
    throw new GovConStateValidationError(
      `${context}.issues must be an array`,
      `${context}.issues`,
      i.issues,
    );
  }
}

/**
 * Validate GovConEvidence structure
 */
function assertValidEvidence(evidence: unknown, context: string): void {
  if (!evidence || typeof evidence !== "object") {
    throw new GovConStateValidationError(
      `${context}: must be a non-null object`,
      context,
      evidence,
    );
  }

  const e = evidence as Record<string, unknown>;

  if (typeof e.id !== "string") {
    throw new GovConStateValidationError(
      `${context}.id must be a string`,
      `${context}.id`,
      e.id,
    );
  }

  if (
    !VALID_EVIDENCE_TYPES.includes(
      e.type as (typeof VALID_EVIDENCE_TYPES)[number],
    )
  ) {
    throw new GovConStateValidationError(
      `${context}.type must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`,
      `${context}.type`,
      e.type,
    );
  }

  if (typeof e.filename !== "string") {
    throw new GovConStateValidationError(
      `${context}.filename must be a string`,
      `${context}.filename`,
      e.filename,
    );
  }

  if (typeof e.hash !== "string") {
    throw new GovConStateValidationError(
      `${context}.hash must be a string`,
      `${context}.hash`,
      e.hash,
    );
  }

  if (typeof e.uploaded_at !== "string") {
    throw new GovConStateValidationError(
      `${context}.uploaded_at must be a string`,
      `${context}.uploaded_at`,
      e.uploaded_at,
    );
  }

  if (typeof e.verified !== "boolean") {
    throw new GovConStateValidationError(
      `${context}.verified must be a boolean`,
      `${context}.verified`,
      e.verified,
    );
  }
}
