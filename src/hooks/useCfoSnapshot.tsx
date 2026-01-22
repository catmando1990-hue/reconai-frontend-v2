"use client";

// src/lib/hooks/useCfoSnapshot.tsx
// Phase 36: CFO snapshot hook with version enforcement and lifecycle validation.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type {
  CfoSnapshotResponse,
  CfoLifecycleStatus,
  CfoReasonCode,
} from "@/lib/api/types";
import { fetchCfoSnapshot } from "@/lib/api/fetchers";

// =============================================================================
// VERSION ENFORCEMENT - Fail-closed on unknown/missing versions
// =============================================================================

/**
 * SUPPORTED CFO VERSIONS
 * Frontend will FAIL-CLOSED on unknown or missing versions.
 * Add new versions here when backend contract changes.
 */
export const SUPPORTED_CFO_VERSIONS = ["1"] as const;
export type SupportedCfoVersion = (typeof SUPPORTED_CFO_VERSIONS)[number];

/**
 * Type guard: Check if cfo_version is supported
 * FAIL-CLOSED: Unknown versions are rejected
 */
export function isSupportedCfoVersion(
  version: unknown,
): version is SupportedCfoVersion {
  return (
    typeof version === "string" &&
    SUPPORTED_CFO_VERSIONS.includes(version as SupportedCfoVersion)
  );
}

/**
 * Valid lifecycle statuses
 */
const VALID_LIFECYCLE_STATUSES: CfoLifecycleStatus[] = [
  "success",
  "pending",
  "failed",
  "stale",
];

/**
 * Validate CFO response has supported version and valid lifecycle
 * Returns false if version is missing/unknown or lifecycle is invalid
 */
export function isValidCfoResponse(
  response: unknown,
): response is CfoSnapshotResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;

  // PART 1: Version enforcement - fail closed on unknown/missing
  if (!isSupportedCfoVersion(r.cfo_version)) return false;

  // PART 2: Lifecycle validation - required for rendering decisions
  if (
    typeof r.lifecycle !== "string" ||
    !VALID_LIFECYCLE_STATUSES.includes(r.lifecycle as CfoLifecycleStatus)
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
 * Fail-closed state for CFO data
 * Note: version "1" used for internal consistency, lifecycle "failed" indicates error
 */
const failClosedState: CfoSnapshotResponse = {
  cfo_version: "1",
  lifecycle: "failed",
  reason_code: "unknown",
  reason_message: "Unable to load CFO data",
  generated_at: new Date().toISOString(),
  snapshot: null,
};

// =============================================================================
// HOOK STATE TYPE
// =============================================================================

export type UseCfoSnapshotState = {
  data: CfoSnapshotResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Derived: true only when lifecycle is "success" and snapshot is valid */
  isSuccess: boolean;
  /** Derived: lifecycle status for UI rendering decisions */
  lifecycle: CfoLifecycleStatus | null;
  /** Derived: reason code for non-success states */
  reasonCode: CfoReasonCode | null;
  /** Derived: human-readable reason message */
  reasonMessage: string | null;
  refetch: () => Promise<void>;
};

export function useCfoSnapshot(): UseCfoSnapshotState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<CfoSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchCfoSnapshot(apiFetch, {});

      // FAIL-CLOSED: Validate response structure, version, and lifecycle
      if (res && isValidCfoResponse(res)) {
        setData(res);
      } else {
        // Unknown or missing version/lifecycle = fail-closed
        const resObj = res as Record<string, unknown> | null;
        console.warn(
          "[useCfoSnapshot] Invalid response or unsupported cfo_version, failing closed",
          {
            cfoVersion: resObj?.cfo_version,
            lifecycle: resObj?.lifecycle,
          },
        );
        setData(failClosedState);
        setError("CFO data validation failed");
      }
    } catch {
      setError("Unable to load CFO snapshot.");
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
      isSuccess: data.lifecycle === "success" && data.snapshot !== null,
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
    [data, isLoading, error, derived, refetch],
  );
}
