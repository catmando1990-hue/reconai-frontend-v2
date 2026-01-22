"use client";

// src/lib/hooks/useInsightsSummary.tsx
// Phase 36: Insights hook with version enforcement and lifecycle validation.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type {
  InsightsSummaryResponse,
  IntelligenceLifecycleStatus,
  IntelligenceReasonCode,
} from "@/lib/api/types";
import { fetchInsightsSummary } from "@/lib/api/fetchers";

// =============================================================================
// VERSION ENFORCEMENT - Fail-closed on unknown/missing versions
// =============================================================================

/**
 * SUPPORTED INTELLIGENCE VERSIONS
 * Frontend will FAIL-CLOSED on unknown or missing versions.
 * Add new versions here when backend contract changes.
 */
export const SUPPORTED_INTELLIGENCE_VERSIONS = ["1"] as const;
export type SupportedIntelligenceVersion =
  (typeof SUPPORTED_INTELLIGENCE_VERSIONS)[number];

/**
 * Type guard: Check if intelligence_version is supported
 * FAIL-CLOSED: Unknown versions are rejected
 */
export function isSupportedIntelligenceVersion(
  version: unknown
): version is SupportedIntelligenceVersion {
  return (
    typeof version === "string" &&
    SUPPORTED_INTELLIGENCE_VERSIONS.includes(
      version as SupportedIntelligenceVersion
    )
  );
}

/**
 * Valid lifecycle statuses
 */
const VALID_LIFECYCLE_STATUSES: IntelligenceLifecycleStatus[] = [
  "success",
  "pending",
  "failed",
  "stale",
];

/**
 * Validate Intelligence response has supported version and valid lifecycle
 * Returns false if version is missing/unknown or lifecycle is invalid
 */
export function isValidIntelligenceResponse(
  response: unknown
): response is InsightsSummaryResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;

  // PART 1: Version enforcement - fail closed on unknown/missing
  if (!isSupportedIntelligenceVersion(r.intelligence_version)) return false;

  // PART 2: Lifecycle validation - required for rendering decisions
  if (
    typeof r.lifecycle !== "string" ||
    !VALID_LIFECYCLE_STATUSES.includes(r.lifecycle as IntelligenceLifecycleStatus)
  ) {
    return false;
  }

  // PART 2: Non-success requires reason_code
  if (r.lifecycle !== "success") {
    if (typeof r.reason_code !== "string") return false;
  }

  return true;
}

// =============================================================================
// FAIL-CLOSED STATE - Returned when data unavailable or invalid
// =============================================================================

/**
 * Fail-closed state for Intelligence data
 * Note: version "1" used for internal consistency, lifecycle "failed" indicates error
 */
const failClosedState: InsightsSummaryResponse = {
  intelligence_version: "1",
  lifecycle: "failed",
  reason_code: "unknown",
  reason_message: "Unable to load insights",
  generated_at: new Date().toISOString(),
  items: null,
};

// =============================================================================
// HOOK STATE TYPE
// =============================================================================

export type UseInsightsSummaryState = {
  data: InsightsSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Derived: true only when lifecycle is "success" and items is valid */
  isSuccess: boolean;
  /** Derived: lifecycle status for UI rendering decisions */
  lifecycle: IntelligenceLifecycleStatus | null;
  /** Derived: reason code for non-success states */
  reasonCode: IntelligenceReasonCode | null;
  /** Derived: human-readable reason message */
  reasonMessage: string | null;
  refetch: () => Promise<void>;
};

export function useInsightsSummary(): UseInsightsSummaryState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<InsightsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchInsightsSummary(apiFetch, {});

      // FAIL-CLOSED: Validate response structure, version, and lifecycle
      if (res && isValidIntelligenceResponse(res)) {
        setData(res);
      } else {
        // Unknown or missing version/lifecycle = fail-closed
        const resObj = res as Record<string, unknown> | null;
        console.warn(
          "[useInsightsSummary] Invalid response or unsupported intelligence_version, failing closed",
          {
            intelligenceVersion: resObj?.intelligence_version,
            lifecycle: resObj?.lifecycle,
          }
        );
        setData(failClosedState);
        setError("Intelligence data validation failed");
      }
    } catch {
      setError("Unable to load insights.");
      setData(failClosedState);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Derived state helpers
  const derived = useMemo(() => {
    if (!data) {
      return {
        isSuccess: false,
        lifecycle: null,
        reasonCode: null,
        reasonMessage: null,
      };
    }

    return {
      isSuccess: data.lifecycle === "success" && data.items !== null,
      lifecycle: data.lifecycle,
      reasonCode: data.reason_code,
      reasonMessage: data.reason_message,
    };
  }, [data]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      ...derived,
      refetch,
    }),
    [data, isLoading, error, derived, refetch]
  );
}
