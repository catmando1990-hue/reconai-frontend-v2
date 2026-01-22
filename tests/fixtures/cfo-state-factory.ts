// tests/fixtures/cfo-state-factory.ts
/**
 * Canonical CFO State Factory (Phase 36)
 *
 * SINGLE SOURCE OF TRUTH for CFO snapshot test data.
 * All tests MUST use this factory to ensure contract compliance.
 *
 * CANONICAL LAWS:
 * - cfo_version is ALWAYS present and must match SUPPORTED_CFO_VERSIONS
 * - lifecycle is ALWAYS present (no inference)
 * - reason_code is REQUIRED when lifecycle !== "success"
 * - snapshot is REQUIRED when lifecycle === "success"
 *
 * CONTRACT VERSION: 1
 */

import type {
  CfoSnapshotResponse,
  CfoLifecycleStatus,
  CfoReasonCode,
  CfoSnapshot,
  InsightSeverity,
} from "@/lib/api/types";

// =============================================================================
// CONTRACT VERSION (Must match useCfoSnapshot.tsx)
// =============================================================================

export const CFO_CONTRACT_VERSION = "1";

export const SUPPORTED_CFO_VERSIONS = ["1"] as const;
export type SupportedCfoVersion = (typeof SUPPORTED_CFO_VERSIONS)[number];

// =============================================================================
// VALID ENUM VALUES (Fail-closed validation)
// =============================================================================

export const VALID_CFO_LIFECYCLE_STATUSES: readonly CfoLifecycleStatus[] = [
  "success",
  "pending",
  "failed",
  "stale",
] as const;

export const VALID_CFO_REASON_CODES: readonly CfoReasonCode[] = [
  "insufficient_data",
  "computation_error",
  "backend_timeout",
  "data_stale",
  "not_configured",
  "unknown",
] as const;

export const VALID_SEVERITY_LEVELS: readonly InsightSeverity[] = [
  "low",
  "medium",
  "high",
] as const;

// =============================================================================
// SNAPSHOT DATA BUILDERS
// =============================================================================

export type CfoSnapshotOverrides = Partial<CfoSnapshot>;

/**
 * Create a valid CfoSnapshot with defaults
 */
export function cfoSnapshotBuilder(
  overrides: CfoSnapshotOverrides = {},
): CfoSnapshot {
  return {
    as_of: new Date().toISOString(),
    runway_days: 180,
    cash_on_hand: 500000,
    burn_rate_monthly: 25000,
    top_risks: [
      {
        id: "risk-1",
        title: "High burn rate trending upward",
        severity: "medium",
      },
    ],
    next_actions: [
      {
        id: "action-1",
        title: "Review recurring expenses",
        rationale: "Identify cost reduction opportunities",
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// CANONICAL CFO STATE FACTORY
// =============================================================================

export type CfoStateFactoryOverrides = {
  cfo_version?: string;
  lifecycle?: CfoLifecycleStatus;
  reason_code?: CfoReasonCode | null;
  reason_message?: string | null;
  generated_at?: string;
  snapshot?: CfoSnapshot | null;
};

/**
 * CANONICAL CFO STATE FACTORY
 *
 * Creates a valid CfoSnapshotResponse with sensible defaults.
 * Use this for ALL CFO-related tests.
 *
 * @param overrides - Optional overrides for any field
 * @returns A valid CfoSnapshotResponse
 *
 * @example
 * // Success state with default data
 * const state = cfoStateFactory();
 *
 * @example
 * // Failed state with reason
 * const state = cfoStateFactory({
 *   lifecycle: "failed",
 *   reason_code: "computation_error",
 *   reason_message: "Backend processing failed",
 *   snapshot: null,
 * });
 */
export function cfoStateFactory(
  overrides: CfoStateFactoryOverrides = {},
): CfoSnapshotResponse {
  const lifecycle = overrides.lifecycle ?? "success";

  // Apply canonical laws
  const needsReasonCode = lifecycle !== "success";
  const needsSnapshot = lifecycle === "success";

  return {
    cfo_version: overrides.cfo_version ?? CFO_CONTRACT_VERSION,
    lifecycle,
    reason_code: needsReasonCode
      ? (overrides.reason_code ?? "unknown")
      : (overrides.reason_code ?? null),
    reason_message: needsReasonCode
      ? (overrides.reason_message ?? "No data available")
      : (overrides.reason_message ?? null),
    generated_at: overrides.generated_at ?? new Date().toISOString(),
    snapshot: needsSnapshot
      ? (overrides.snapshot ?? cfoSnapshotBuilder())
      : (overrides.snapshot ?? null),
  };
}

// =============================================================================
// PRESET FACTORIES (Common test scenarios)
// =============================================================================

/**
 * Success state - Valid CFO data ready for display
 */
export function successCfoState(
  snapshotOverrides: CfoSnapshotOverrides = {},
): CfoSnapshotResponse {
  return cfoStateFactory({
    lifecycle: "success",
    reason_code: null,
    reason_message: null,
    snapshot: cfoSnapshotBuilder(snapshotOverrides),
  });
}

/**
 * Pending state - CFO data is being computed
 */
export function pendingCfoState(
  reason_message = "Computing financial metrics...",
): CfoSnapshotResponse {
  return cfoStateFactory({
    lifecycle: "pending",
    reason_code: "not_configured",
    reason_message,
    snapshot: null,
  });
}

/**
 * Failed state - CFO computation failed
 */
export function failedCfoState(
  reason_code: CfoReasonCode = "computation_error",
  reason_message = "Unable to compute CFO metrics",
): CfoSnapshotResponse {
  return cfoStateFactory({
    lifecycle: "failed",
    reason_code,
    reason_message,
    snapshot: null,
  });
}

/**
 * Stale state - CFO data exists but is outdated
 */
export function staleCfoState(
  snapshotOverrides: CfoSnapshotOverrides = {},
  reason_message = "Data is more than 24 hours old",
): CfoSnapshotResponse {
  return cfoStateFactory({
    lifecycle: "stale",
    reason_code: "data_stale",
    reason_message,
    snapshot: cfoSnapshotBuilder(snapshotOverrides),
  });
}

/**
 * Insufficient data state - Not enough transactions for analysis
 */
export function insufficientDataCfoState(): CfoSnapshotResponse {
  return cfoStateFactory({
    lifecycle: "failed",
    reason_code: "insufficient_data",
    reason_message: "Need at least 30 days of transaction history",
    snapshot: null,
  });
}

// =============================================================================
// SCHEMA ASSERTION HELPER
// =============================================================================

export class CfoStateValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
  ) {
    super(message);
    this.name = "CfoStateValidationError";
  }
}

/**
 * FAIL-CLOSED CFO STATE VALIDATOR
 *
 * Validates a CfoSnapshotResponse against the contract schema.
 * Throws CfoStateValidationError on any violation.
 *
 * CANONICAL LAWS ENFORCED:
 * 1. cfo_version MUST be present and supported
 * 2. lifecycle MUST be present and valid
 * 3. reason_code MUST be present when lifecycle !== "success"
 * 4. snapshot MUST be present when lifecycle === "success"
 * 5. generated_at MUST be present (ISO8601)
 *
 * @param state - The state to validate
 * @throws CfoStateValidationError if validation fails
 */
export function assertValidCfoState(
  state: unknown,
): asserts state is CfoSnapshotResponse {
  if (!state || typeof state !== "object") {
    throw new CfoStateValidationError(
      "CFO state must be a non-null object",
      "root",
      state,
    );
  }

  const s = state as Record<string, unknown>;

  // ==========================================================================
  // PART 1: cfo_version - REQUIRED, must be supported
  // ==========================================================================

  if (!("cfo_version" in s)) {
    throw new CfoStateValidationError(
      "Missing required field: cfo_version",
      "cfo_version",
      undefined,
    );
  }

  if (typeof s.cfo_version !== "string") {
    throw new CfoStateValidationError(
      `cfo_version must be a string, got ${typeof s.cfo_version}`,
      "cfo_version",
      s.cfo_version,
    );
  }

  if (!SUPPORTED_CFO_VERSIONS.includes(s.cfo_version as SupportedCfoVersion)) {
    throw new CfoStateValidationError(
      `Unsupported cfo_version: "${s.cfo_version}". Supported: ${SUPPORTED_CFO_VERSIONS.join(", ")}`,
      "cfo_version",
      s.cfo_version,
    );
  }

  // ==========================================================================
  // PART 2: lifecycle - REQUIRED, must be valid enum
  // ==========================================================================

  if (!("lifecycle" in s)) {
    throw new CfoStateValidationError(
      "Missing required field: lifecycle",
      "lifecycle",
      undefined,
    );
  }

  if (typeof s.lifecycle !== "string") {
    throw new CfoStateValidationError(
      `lifecycle must be a string, got ${typeof s.lifecycle}`,
      "lifecycle",
      s.lifecycle,
    );
  }

  if (
    !VALID_CFO_LIFECYCLE_STATUSES.includes(s.lifecycle as CfoLifecycleStatus)
  ) {
    throw new CfoStateValidationError(
      `Invalid lifecycle: "${s.lifecycle}". Valid: ${VALID_CFO_LIFECYCLE_STATUSES.join(", ")}`,
      "lifecycle",
      s.lifecycle,
    );
  }

  // ==========================================================================
  // PART 3: reason_code - REQUIRED when lifecycle !== "success"
  // ==========================================================================

  const lifecycle = s.lifecycle as CfoLifecycleStatus;

  if (lifecycle !== "success") {
    if (!("reason_code" in s) || s.reason_code === null) {
      throw new CfoStateValidationError(
        `reason_code is required when lifecycle is "${lifecycle}"`,
        "reason_code",
        s.reason_code,
      );
    }

    if (typeof s.reason_code !== "string") {
      throw new CfoStateValidationError(
        `reason_code must be a string, got ${typeof s.reason_code}`,
        "reason_code",
        s.reason_code,
      );
    }

    if (!VALID_CFO_REASON_CODES.includes(s.reason_code as CfoReasonCode)) {
      throw new CfoStateValidationError(
        `Invalid reason_code: "${s.reason_code}". Valid: ${VALID_CFO_REASON_CODES.join(", ")}`,
        "reason_code",
        s.reason_code,
      );
    }
  }

  // ==========================================================================
  // PART 4: generated_at - REQUIRED, ISO8601 string
  // ==========================================================================

  if (!("generated_at" in s)) {
    throw new CfoStateValidationError(
      "Missing required field: generated_at",
      "generated_at",
      undefined,
    );
  }

  if (typeof s.generated_at !== "string") {
    throw new CfoStateValidationError(
      `generated_at must be a string, got ${typeof s.generated_at}`,
      "generated_at",
      s.generated_at,
    );
  }

  // ==========================================================================
  // PART 5: snapshot - REQUIRED when lifecycle === "success"
  // ==========================================================================

  if (lifecycle === "success") {
    if (!("snapshot" in s) || s.snapshot === null) {
      throw new CfoStateValidationError(
        'snapshot is required when lifecycle is "success"',
        "snapshot",
        s.snapshot,
      );
    }

    // Validate snapshot structure
    assertValidCfoSnapshot(s.snapshot);
  }

  // ==========================================================================
  // PART 6: reason_message - Must be string or null
  // ==========================================================================

  if ("reason_message" in s && s.reason_message !== null) {
    if (typeof s.reason_message !== "string") {
      throw new CfoStateValidationError(
        `reason_message must be a string or null, got ${typeof s.reason_message}`,
        "reason_message",
        s.reason_message,
      );
    }
  }
}

/**
 * Validate CfoSnapshot structure
 */
function assertValidCfoSnapshot(
  snapshot: unknown,
): asserts snapshot is CfoSnapshot {
  if (!snapshot || typeof snapshot !== "object") {
    throw new CfoStateValidationError(
      "snapshot must be a non-null object",
      "snapshot",
      snapshot,
    );
  }

  const snap = snapshot as Record<string, unknown>;

  // as_of - REQUIRED
  if (!("as_of" in snap) || typeof snap.as_of !== "string") {
    throw new CfoStateValidationError(
      "snapshot.as_of must be a string",
      "snapshot.as_of",
      snap.as_of,
    );
  }

  // runway_days - number or null
  if ("runway_days" in snap && snap.runway_days !== null) {
    if (typeof snap.runway_days !== "number") {
      throw new CfoStateValidationError(
        "snapshot.runway_days must be a number or null",
        "snapshot.runway_days",
        snap.runway_days,
      );
    }
  }

  // cash_on_hand - number or null
  if ("cash_on_hand" in snap && snap.cash_on_hand !== null) {
    if (typeof snap.cash_on_hand !== "number") {
      throw new CfoStateValidationError(
        "snapshot.cash_on_hand must be a number or null",
        "snapshot.cash_on_hand",
        snap.cash_on_hand,
      );
    }
  }

  // burn_rate_monthly - number or null
  if ("burn_rate_monthly" in snap && snap.burn_rate_monthly !== null) {
    if (typeof snap.burn_rate_monthly !== "number") {
      throw new CfoStateValidationError(
        "snapshot.burn_rate_monthly must be a number or null",
        "snapshot.burn_rate_monthly",
        snap.burn_rate_monthly,
      );
    }
  }

  // top_risks - array
  if ("top_risks" in snap) {
    if (!Array.isArray(snap.top_risks)) {
      throw new CfoStateValidationError(
        "snapshot.top_risks must be an array",
        "snapshot.top_risks",
        snap.top_risks,
      );
    }

    for (const risk of snap.top_risks) {
      assertValidRisk(risk);
    }
  }

  // next_actions - array
  if ("next_actions" in snap) {
    if (!Array.isArray(snap.next_actions)) {
      throw new CfoStateValidationError(
        "snapshot.next_actions must be an array",
        "snapshot.next_actions",
        snap.next_actions,
      );
    }

    for (const action of snap.next_actions) {
      assertValidAction(action);
    }
  }
}

/**
 * Validate risk object structure
 */
function assertValidRisk(risk: unknown): void {
  if (!risk || typeof risk !== "object") {
    throw new CfoStateValidationError(
      "Risk must be a non-null object",
      "snapshot.top_risks[]",
      risk,
    );
  }

  const r = risk as Record<string, unknown>;

  if (typeof r.id !== "string") {
    throw new CfoStateValidationError(
      "Risk.id must be a string",
      "snapshot.top_risks[].id",
      r.id,
    );
  }

  if (typeof r.title !== "string") {
    throw new CfoStateValidationError(
      "Risk.title must be a string",
      "snapshot.top_risks[].title",
      r.title,
    );
  }

  if (!VALID_SEVERITY_LEVELS.includes(r.severity as InsightSeverity)) {
    throw new CfoStateValidationError(
      `Risk.severity must be one of: ${VALID_SEVERITY_LEVELS.join(", ")}`,
      "snapshot.top_risks[].severity",
      r.severity,
    );
  }
}

/**
 * Validate action object structure
 */
function assertValidAction(action: unknown): void {
  if (!action || typeof action !== "object") {
    throw new CfoStateValidationError(
      "Action must be a non-null object",
      "snapshot.next_actions[]",
      action,
    );
  }

  const a = action as Record<string, unknown>;

  if (typeof a.id !== "string") {
    throw new CfoStateValidationError(
      "Action.id must be a string",
      "snapshot.next_actions[].id",
      a.id,
    );
  }

  if (typeof a.title !== "string") {
    throw new CfoStateValidationError(
      "Action.title must be a string",
      "snapshot.next_actions[].title",
      a.title,
    );
  }

  if (typeof a.rationale !== "string") {
    throw new CfoStateValidationError(
      "Action.rationale must be a string",
      "snapshot.next_actions[].rationale",
      a.rationale,
    );
  }
}
