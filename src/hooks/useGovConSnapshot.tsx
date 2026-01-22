"use client";

// src/hooks/useGovConSnapshot.tsx
// Phase 36: GovCon hook with version enforcement and lifecycle validation.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import type {
  GovConSnapshotResponse,
  GovConLifecycleStatus,
  GovConReasonCode,
} from "@/lib/api/types";

// =============================================================================
// VERSION ENFORCEMENT - Fail-closed on unknown/missing versions
// =============================================================================

/**
 * SUPPORTED GOVCON VERSIONS
 * Frontend will FAIL-CLOSED on unknown or missing versions.
 * Add new versions here when backend contract changes.
 */
export const SUPPORTED_GOVCON_VERSIONS = ["1"] as const;
export type SupportedGovConVersion = (typeof SUPPORTED_GOVCON_VERSIONS)[number];

/**
 * Type guard: Check if govcon_version is supported
 * FAIL-CLOSED: Unknown versions are rejected
 */
export function isSupportedGovConVersion(
  version: unknown,
): version is SupportedGovConVersion {
  return (
    typeof version === "string" &&
    SUPPORTED_GOVCON_VERSIONS.includes(version as SupportedGovConVersion)
  );
}

/**
 * Valid lifecycle statuses
 */
const VALID_LIFECYCLE_STATUSES: GovConLifecycleStatus[] = [
  "success",
  "pending",
  "failed",
  "stale",
  "no_evidence",
];

/**
 * Validate GovCon response has supported version, valid lifecycle, and evidence flag
 * Returns false if version is missing/unknown, lifecycle is invalid, or evidence flag is missing
 */
export function isValidGovConResponse(
  response: unknown,
): response is GovConSnapshotResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;

  // PART 1: Version enforcement - fail closed on unknown/missing
  if (!isSupportedGovConVersion(r.govcon_version)) return false;

  // PART 2: Lifecycle validation - required for rendering decisions
  if (
    typeof r.lifecycle !== "string" ||
    !VALID_LIFECYCLE_STATUSES.includes(r.lifecycle as GovConLifecycleStatus)
  ) {
    return false;
  }

  // PART 2: Non-success requires reason_code
  if (r.lifecycle !== "success") {
    if (typeof r.reason_code !== "string") return false;
  }

  // PART 2: Evidence flag REQUIRED - fail closed if missing
  if (typeof r.has_evidence !== "boolean") return false;

  return true;
}

// =============================================================================
// FAIL-CLOSED STATE - Returned when data unavailable or invalid
// =============================================================================

/**
 * Fail-closed state for GovCon data
 * Note: version "1" used for internal consistency, lifecycle "failed" indicates error
 */
const failClosedState: GovConSnapshotResponse = {
  govcon_version: "1",
  lifecycle: "failed",
  reason_code: "unknown",
  reason_message: "Unable to load compliance data",
  generated_at: new Date().toISOString(),
  snapshot: null,
  has_evidence: false,
};

// =============================================================================
// HOOK STATE TYPE
// =============================================================================

export type UseGovConSnapshotState = {
  data: GovConSnapshotResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Derived: true only when lifecycle is "success" AND has_evidence is true */
  isSuccess: boolean;
  /** Derived: lifecycle status for UI rendering decisions */
  lifecycle: GovConLifecycleStatus | null;
  /** Derived: reason code for non-success states */
  reasonCode: GovConReasonCode | null;
  /** Derived: human-readable reason message */
  reasonMessage: string | null;
  /** Derived: whether evidence is attached (REQUIRED for compliance) */
  hasEvidence: boolean;
  refetch: () => Promise<void>;
};

export function useGovConSnapshot(): UseGovConSnapshotState {
  const { apiFetch } = useApi();

  const [data, setData] = useState<GovConSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch<GovConSnapshotResponse>("/govcon/snapshot", {
        method: "GET",
      });

      // FAIL-CLOSED: Validate response structure, version, lifecycle, and evidence
      if (res && isValidGovConResponse(res)) {
        setData(res);
      } else {
        // Unknown or missing version/lifecycle/evidence = fail-closed
        const resObj = res as Record<string, unknown> | null;
        console.warn(
          "[useGovConSnapshot] Invalid response or unsupported govcon_version, failing closed",
          {
            govconVersion: resObj?.govcon_version,
            lifecycle: resObj?.lifecycle,
            hasEvidence: resObj?.has_evidence,
          },
        );
        setData(failClosedState);
        setError("GovCon compliance data validation failed");
      }
    } catch {
      setError("Unable to load compliance data.");
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
        hasEvidence: false,
      };
    }

    return {
      // SUCCESS requires BOTH lifecycle success AND evidence attached
      isSuccess: data.lifecycle === "success" && data.has_evidence === true,
      lifecycle: data.lifecycle,
      reasonCode: data.reason_code,
      reasonMessage: data.reason_message,
      hasEvidence: data.has_evidence,
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
