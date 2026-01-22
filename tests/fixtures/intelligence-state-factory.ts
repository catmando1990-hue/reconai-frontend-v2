// tests/fixtures/intelligence-state-factory.ts
/**
 * Canonical Intelligence State Factory (Phase 36)
 *
 * SINGLE SOURCE OF TRUTH for Intelligence/Insights test data.
 * All tests MUST use this factory to ensure contract compliance.
 *
 * CANONICAL LAWS:
 * - intelligence_version is ALWAYS present and must match SUPPORTED_INTELLIGENCE_VERSIONS
 * - lifecycle is ALWAYS present (no inference)
 * - reason_code is REQUIRED when lifecycle !== "success"
 * - items is REQUIRED when lifecycle === "success"
 * - confidence must be 0-1 range for each insight
 *
 * CONTRACT VERSION: 1
 */

import type {
  InsightsSummaryResponse,
  IntelligenceLifecycleStatus,
  IntelligenceReasonCode,
  Insight,
  InsightType,
  InsightSeverity,
} from "@/lib/api/types";

// =============================================================================
// CONTRACT VERSION (Must match useInsightsSummary.tsx)
// =============================================================================

export const INTELLIGENCE_CONTRACT_VERSION = "1";

export const SUPPORTED_INTELLIGENCE_VERSIONS = ["1"] as const;
export type SupportedIntelligenceVersion =
  (typeof SUPPORTED_INTELLIGENCE_VERSIONS)[number];

// =============================================================================
// VALID ENUM VALUES (Fail-closed validation)
// =============================================================================

export const VALID_INTELLIGENCE_LIFECYCLE_STATUSES: readonly IntelligenceLifecycleStatus[] =
  ["success", "pending", "failed", "stale"] as const;

export const VALID_INTELLIGENCE_REASON_CODES: readonly IntelligenceReasonCode[] =
  [
    "insufficient_data",
    "computation_error",
    "backend_timeout",
    "data_stale",
    "no_transactions",
    "not_configured",
    "unknown",
  ] as const;

export const VALID_INSIGHT_TYPES: readonly InsightType[] = [
  "anomaly",
  "cash_flow",
  "category_drift",
  "duplicate_charge",
  "vendor_risk",
  "compliance",
  "opportunity",
] as const;

export const VALID_SEVERITY_LEVELS: readonly InsightSeverity[] = [
  "low",
  "medium",
  "high",
] as const;

export const VALID_INSIGHT_SOURCES = ["rules", "ml", "llm", "hybrid"] as const;

// =============================================================================
// INSIGHT BUILDERS
// =============================================================================

export type InsightOverrides = Partial<Insight>;

/**
 * Create a valid Insight with defaults
 */
export function insightBuilder(overrides: InsightOverrides = {}): Insight {
  return {
    id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Unusual expense pattern detected",
    summary:
      "Monthly software expenses increased 45% compared to 3-month average",
    type: "anomaly",
    severity: "medium",
    confidence: 0.85,
    created_at: new Date().toISOString(),
    source: "ml",
    ...overrides,
  };
}

/**
 * Create multiple insights for testing
 */
export function insightsBuilder(
  count: number = 3,
  baseOverrides: InsightOverrides = {}
): Insight[] {
  const types: InsightType[] = [
    "anomaly",
    "cash_flow",
    "duplicate_charge",
    "vendor_risk",
    "compliance",
  ];
  const severities: InsightSeverity[] = ["low", "medium", "high"];

  return Array.from({ length: count }, (_, i) =>
    insightBuilder({
      id: `insight-${i + 1}`,
      title: `Insight ${i + 1}`,
      type: types[i % types.length],
      severity: severities[i % severities.length],
      confidence: 0.7 + Math.random() * 0.25, // 0.70-0.95
      ...baseOverrides,
    })
  );
}

// =============================================================================
// CANONICAL INTELLIGENCE STATE FACTORY
// =============================================================================

export type IntelligenceStateFactoryOverrides = {
  intelligence_version?: string;
  lifecycle?: IntelligenceLifecycleStatus;
  reason_code?: IntelligenceReasonCode | null;
  reason_message?: string | null;
  generated_at?: string;
  items?: Insight[] | null;
};

/**
 * CANONICAL INTELLIGENCE STATE FACTORY
 *
 * Creates a valid InsightsSummaryResponse with sensible defaults.
 * Use this for ALL Intelligence-related tests.
 *
 * @param overrides - Optional overrides for any field
 * @returns A valid InsightsSummaryResponse
 *
 * @example
 * // Success state with default insights
 * const state = intelligenceStateFactory();
 *
 * @example
 * // Failed state with reason
 * const state = intelligenceStateFactory({
 *   lifecycle: "failed",
 *   reason_code: "computation_error",
 *   reason_message: "Backend processing failed",
 *   items: null,
 * });
 */
export function intelligenceStateFactory(
  overrides: IntelligenceStateFactoryOverrides = {}
): InsightsSummaryResponse {
  const lifecycle = overrides.lifecycle ?? "success";

  // Apply canonical laws
  const needsReasonCode = lifecycle !== "success";
  const needsItems = lifecycle === "success";

  return {
    intelligence_version:
      overrides.intelligence_version ?? INTELLIGENCE_CONTRACT_VERSION,
    lifecycle,
    reason_code: needsReasonCode
      ? overrides.reason_code ?? "unknown"
      : overrides.reason_code ?? null,
    reason_message: needsReasonCode
      ? overrides.reason_message ?? "No insights available"
      : overrides.reason_message ?? null,
    generated_at: overrides.generated_at ?? new Date().toISOString(),
    items: needsItems ? overrides.items ?? insightsBuilder(3) : overrides.items ?? null,
  };
}

// =============================================================================
// PRESET FACTORIES (Common test scenarios)
// =============================================================================

/**
 * Success state - Valid insights ready for display
 */
export function successIntelligenceState(
  insights: Insight[] = insightsBuilder(5)
): InsightsSummaryResponse {
  return intelligenceStateFactory({
    lifecycle: "success",
    reason_code: null,
    reason_message: null,
    items: insights,
  });
}

/**
 * Pending state - Insights are being computed
 */
export function pendingIntelligenceState(
  reason_message = "Computing insights..."
): InsightsSummaryResponse {
  return intelligenceStateFactory({
    lifecycle: "pending",
    reason_code: "not_configured",
    reason_message,
    items: null,
  });
}

/**
 * Failed state - Insight computation failed
 */
export function failedIntelligenceState(
  reason_code: IntelligenceReasonCode = "computation_error",
  reason_message = "Unable to compute insights"
): InsightsSummaryResponse {
  return intelligenceStateFactory({
    lifecycle: "failed",
    reason_code,
    reason_message,
    items: null,
  });
}

/**
 * Stale state - Insights exist but are outdated
 */
export function staleIntelligenceState(
  insights: Insight[] = insightsBuilder(3),
  reason_message = "Insights are more than 24 hours old"
): InsightsSummaryResponse {
  return intelligenceStateFactory({
    lifecycle: "stale",
    reason_code: "data_stale",
    reason_message,
    items: insights,
  });
}

/**
 * No transactions state - Not enough data for insights
 */
export function noTransactionsIntelligenceState(): InsightsSummaryResponse {
  return intelligenceStateFactory({
    lifecycle: "failed",
    reason_code: "no_transactions",
    reason_message: "No transactions available for analysis",
    items: null,
  });
}

/**
 * Low confidence insights - All insights below threshold
 */
export function lowConfidenceIntelligenceState(): InsightsSummaryResponse {
  const lowConfidenceInsights = insightsBuilder(3).map((insight) => ({
    ...insight,
    confidence: 0.4 + Math.random() * 0.2, // 0.40-0.60
  }));

  return intelligenceStateFactory({
    lifecycle: "success",
    items: lowConfidenceInsights,
  });
}

// =============================================================================
// SCHEMA ASSERTION HELPER
// =============================================================================

export class IntelligenceStateValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = "IntelligenceStateValidationError";
  }
}

/**
 * FAIL-CLOSED INTELLIGENCE STATE VALIDATOR
 *
 * Validates an InsightsSummaryResponse against the contract schema.
 * Throws IntelligenceStateValidationError on any violation.
 *
 * CANONICAL LAWS ENFORCED:
 * 1. intelligence_version MUST be present and supported
 * 2. lifecycle MUST be present and valid
 * 3. reason_code MUST be present when lifecycle !== "success"
 * 4. items MUST be present (non-null) when lifecycle === "success"
 * 5. generated_at MUST be present (ISO8601)
 * 6. Each insight MUST have valid confidence (0-1)
 *
 * @param state - The state to validate
 * @throws IntelligenceStateValidationError if validation fails
 */
export function assertValidIntelligenceState(
  state: unknown
): asserts state is InsightsSummaryResponse {
  if (!state || typeof state !== "object") {
    throw new IntelligenceStateValidationError(
      "Intelligence state must be a non-null object",
      "root",
      state
    );
  }

  const s = state as Record<string, unknown>;

  // ==========================================================================
  // PART 1: intelligence_version - REQUIRED, must be supported
  // ==========================================================================

  if (!("intelligence_version" in s)) {
    throw new IntelligenceStateValidationError(
      "Missing required field: intelligence_version",
      "intelligence_version",
      undefined
    );
  }

  if (typeof s.intelligence_version !== "string") {
    throw new IntelligenceStateValidationError(
      `intelligence_version must be a string, got ${typeof s.intelligence_version}`,
      "intelligence_version",
      s.intelligence_version
    );
  }

  if (
    !SUPPORTED_INTELLIGENCE_VERSIONS.includes(
      s.intelligence_version as SupportedIntelligenceVersion
    )
  ) {
    throw new IntelligenceStateValidationError(
      `Unsupported intelligence_version: "${s.intelligence_version}". Supported: ${SUPPORTED_INTELLIGENCE_VERSIONS.join(", ")}`,
      "intelligence_version",
      s.intelligence_version
    );
  }

  // ==========================================================================
  // PART 2: lifecycle - REQUIRED, must be valid enum
  // ==========================================================================

  if (!("lifecycle" in s)) {
    throw new IntelligenceStateValidationError(
      "Missing required field: lifecycle",
      "lifecycle",
      undefined
    );
  }

  if (typeof s.lifecycle !== "string") {
    throw new IntelligenceStateValidationError(
      `lifecycle must be a string, got ${typeof s.lifecycle}`,
      "lifecycle",
      s.lifecycle
    );
  }

  if (
    !VALID_INTELLIGENCE_LIFECYCLE_STATUSES.includes(
      s.lifecycle as IntelligenceLifecycleStatus
    )
  ) {
    throw new IntelligenceStateValidationError(
      `Invalid lifecycle: "${s.lifecycle}". Valid: ${VALID_INTELLIGENCE_LIFECYCLE_STATUSES.join(", ")}`,
      "lifecycle",
      s.lifecycle
    );
  }

  // ==========================================================================
  // PART 3: reason_code - REQUIRED when lifecycle !== "success"
  // ==========================================================================

  const lifecycle = s.lifecycle as IntelligenceLifecycleStatus;

  if (lifecycle !== "success") {
    if (!("reason_code" in s) || s.reason_code === null) {
      throw new IntelligenceStateValidationError(
        `reason_code is required when lifecycle is "${lifecycle}"`,
        "reason_code",
        s.reason_code
      );
    }

    if (typeof s.reason_code !== "string") {
      throw new IntelligenceStateValidationError(
        `reason_code must be a string, got ${typeof s.reason_code}`,
        "reason_code",
        s.reason_code
      );
    }

    if (
      !VALID_INTELLIGENCE_REASON_CODES.includes(
        s.reason_code as IntelligenceReasonCode
      )
    ) {
      throw new IntelligenceStateValidationError(
        `Invalid reason_code: "${s.reason_code}". Valid: ${VALID_INTELLIGENCE_REASON_CODES.join(", ")}`,
        "reason_code",
        s.reason_code
      );
    }
  }

  // ==========================================================================
  // PART 4: generated_at - REQUIRED, ISO8601 string
  // ==========================================================================

  if (!("generated_at" in s)) {
    throw new IntelligenceStateValidationError(
      "Missing required field: generated_at",
      "generated_at",
      undefined
    );
  }

  if (typeof s.generated_at !== "string") {
    throw new IntelligenceStateValidationError(
      `generated_at must be a string, got ${typeof s.generated_at}`,
      "generated_at",
      s.generated_at
    );
  }

  // ==========================================================================
  // PART 5: items - REQUIRED (non-null) when lifecycle === "success"
  // ==========================================================================

  if (lifecycle === "success") {
    if (!("items" in s) || s.items === null) {
      throw new IntelligenceStateValidationError(
        'items is required (non-null) when lifecycle is "success"',
        "items",
        s.items
      );
    }

    if (!Array.isArray(s.items)) {
      throw new IntelligenceStateValidationError(
        `items must be an array, got ${typeof s.items}`,
        "items",
        s.items
      );
    }

    // Validate each insight
    for (let i = 0; i < s.items.length; i++) {
      assertValidInsight(s.items[i], `items[${i}]`);
    }
  }

  // ==========================================================================
  // PART 6: reason_message - Must be string or null
  // ==========================================================================

  if ("reason_message" in s && s.reason_message !== null) {
    if (typeof s.reason_message !== "string") {
      throw new IntelligenceStateValidationError(
        `reason_message must be a string or null, got ${typeof s.reason_message}`,
        "reason_message",
        s.reason_message
      );
    }
  }
}

/**
 * Validate individual Insight structure
 */
function assertValidInsight(insight: unknown, context: string): void {
  if (!insight || typeof insight !== "object") {
    throw new IntelligenceStateValidationError(
      `${context}: Insight must be a non-null object`,
      context,
      insight
    );
  }

  const i = insight as Record<string, unknown>;

  // id - REQUIRED string
  if (typeof i.id !== "string") {
    throw new IntelligenceStateValidationError(
      `${context}.id must be a string`,
      `${context}.id`,
      i.id
    );
  }

  // title - REQUIRED string
  if (typeof i.title !== "string") {
    throw new IntelligenceStateValidationError(
      `${context}.title must be a string`,
      `${context}.title`,
      i.title
    );
  }

  // summary - REQUIRED string
  if (typeof i.summary !== "string") {
    throw new IntelligenceStateValidationError(
      `${context}.summary must be a string`,
      `${context}.summary`,
      i.summary
    );
  }

  // type - REQUIRED valid enum
  if (!VALID_INSIGHT_TYPES.includes(i.type as InsightType)) {
    throw new IntelligenceStateValidationError(
      `${context}.type must be one of: ${VALID_INSIGHT_TYPES.join(", ")}`,
      `${context}.type`,
      i.type
    );
  }

  // severity - REQUIRED valid enum
  if (!VALID_SEVERITY_LEVELS.includes(i.severity as InsightSeverity)) {
    throw new IntelligenceStateValidationError(
      `${context}.severity must be one of: ${VALID_SEVERITY_LEVELS.join(", ")}`,
      `${context}.severity`,
      i.severity
    );
  }

  // confidence - REQUIRED number 0-1
  if (typeof i.confidence !== "number") {
    throw new IntelligenceStateValidationError(
      `${context}.confidence must be a number`,
      `${context}.confidence`,
      i.confidence
    );
  }

  if (i.confidence < 0 || i.confidence > 1) {
    throw new IntelligenceStateValidationError(
      `${context}.confidence must be between 0 and 1, got ${i.confidence}`,
      `${context}.confidence`,
      i.confidence
    );
  }

  // created_at - REQUIRED string
  if (typeof i.created_at !== "string") {
    throw new IntelligenceStateValidationError(
      `${context}.created_at must be a string`,
      `${context}.created_at`,
      i.created_at
    );
  }

  // source - REQUIRED valid enum
  if (!VALID_INSIGHT_SOURCES.includes(i.source as (typeof VALID_INSIGHT_SOURCES)[number])) {
    throw new IntelligenceStateValidationError(
      `${context}.source must be one of: ${VALID_INSIGHT_SOURCES.join(", ")}`,
      `${context}.source`,
      i.source
    );
  }
}
