"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import type {
  DashboardMetrics,
  DashboardMetricsResponse,
} from "@/types/api-contracts";

// Re-export for backward compatibility
export type { DashboardMetrics } from "@/types/api-contracts";

/**
 * Raw API response shape - may have nullable nested objects.
 * Backend correctly returns nullable fields; frontend must honor the contract.
 */
type RawMetricsResponse = Partial<DashboardMetricsResponse>;

/**
 * FAIL-CLOSED: Unavailable metrics with available=false.
 * UI must display "Unknown" or similar, NOT fake zeros.
 * All nested objects are guaranteed to exist (for type safety) but fields are null.
 */
const failClosedMetrics: DashboardMetrics = {
  available: false,
  counts: {
    invoices: null,
    bills: null,
    customers: null,
    vendors: null,
  },
  summary: {
    totalInvoiced: null,
    totalInvoicePaid: null,
    totalInvoiceDue: null,
    totalBilled: null,
    totalBillPaid: null,
    totalBillDue: null,
  },
  invoicesByStatus: {
    paid: null,
    pending: null,
    overdue: null,
    draft: null,
  },
  billsByStatus: {
    paid: null,
    pending: null,
    overdue: null,
    draft: null,
  },
};

/**
 * Normalize raw API response into safe DashboardMetrics.
 * Ensures all nested objects exist even if API returns null/undefined.
 *
 * P0 FIX: Prevents runtime crashes from accessing undefined nested objects.
 */
function normalizeMetrics(
  raw: RawMetricsResponse | null | undefined,
): DashboardMetrics {
  // If no data at all, return fail-closed
  if (!raw) {
    return failClosedMetrics;
  }

  // Check if any required nested objects are missing
  const hasValidStructure =
    raw.counts != null &&
    raw.summary != null &&
    raw.invoicesByStatus != null &&
    raw.billsByStatus != null;

  return {
    // P0 FIX: available is true ONLY if all nested objects exist
    available: hasValidStructure,
    counts: {
      invoices: raw.counts?.invoices ?? null,
      bills: raw.counts?.bills ?? null,
      customers: raw.counts?.customers ?? null,
      vendors: raw.counts?.vendors ?? null,
    },
    summary: {
      totalInvoiced: raw.summary?.totalInvoiced ?? null,
      totalInvoicePaid: raw.summary?.totalInvoicePaid ?? null,
      totalInvoiceDue: raw.summary?.totalInvoiceDue ?? null,
      totalBilled: raw.summary?.totalBilled ?? null,
      totalBillPaid: raw.summary?.totalBillPaid ?? null,
      totalBillDue: raw.summary?.totalBillDue ?? null,
    },
    invoicesByStatus: {
      paid: raw.invoicesByStatus?.paid ?? null,
      pending: raw.invoicesByStatus?.pending ?? null,
      overdue: raw.invoicesByStatus?.overdue ?? null,
      draft: raw.invoicesByStatus?.draft ?? null,
    },
    billsByStatus: {
      paid: raw.billsByStatus?.paid ?? null,
      pending: raw.billsByStatus?.pending ?? null,
      overdue: raw.billsByStatus?.overdue ?? null,
      draft: raw.billsByStatus?.draft ?? null,
    },
  };
}

/**
 * useDashboardMetrics - Fetches dashboard metrics with proper auth gating.
 *
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook which includes org context
 * - Gates fetch behind isLoaded from useOrg() to ensure Clerk session is ready
 * - Does NOT fetch until authentication is confirmed ready
 * - Prevents 401 errors from race condition where fetch runs before Clerk initializes
 */
export function useDashboardMetrics() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const raw = await apiFetch<RawMetricsResponse>("/api/dashboard/metrics");
      // P0 FIX: Normalize response to ensure all nested objects exist
      setMetrics(normalizeMetrics(raw));
    } catch {
      // FAIL-CLOSED: Use unavailable metrics, not fake zeros
      setMetrics(failClosedMetrics);
      setError(new Error("Failed to load dashboard metrics"));
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    // This prevents 401 errors from fetch running before session is available
    if (!authReady) {
      return;
    }

    let alive = true;

    const doFetch = async () => {
      try {
        setIsLoading(true);
        if (alive) setError(null);
        const raw = await apiFetch<RawMetricsResponse>(
          "/api/dashboard/metrics",
        );
        // P0 FIX: Normalize response to ensure all nested objects exist
        if (alive) setMetrics(normalizeMetrics(raw));
      } catch {
        // FAIL-CLOSED: Use unavailable metrics, not fake zeros
        if (alive) {
          setMetrics(failClosedMetrics);
          setError(new Error("Failed to load dashboard metrics"));
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void doFetch();
    return () => {
      alive = false;
    };
  }, [authReady, apiFetch]);

  return useMemo(
    () => ({ metrics, isLoading, error, refetch: fetchMetrics }),
    [metrics, isLoading, error, fetchMetrics],
  );
}
