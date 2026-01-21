"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";

/**
 * Raw API response shape - may have nullable nested objects.
 * Backend correctly returns nullable fields; frontend must honor the contract.
 */
interface RawMetricsResponse {
  counts?: {
    invoices?: number | null;
    bills?: number | null;
    customers?: number | null;
    vendors?: number | null;
  } | null;
  summary?: {
    totalInvoiced?: number | null;
    totalInvoicePaid?: number | null;
    totalInvoiceDue?: number | null;
    totalBilled?: number | null;
    totalBillPaid?: number | null;
    totalBillDue?: number | null;
  } | null;
  invoicesByStatus?: {
    paid?: number | null;
    pending?: number | null;
    overdue?: number | null;
    draft?: number | null;
  } | null;
  billsByStatus?: {
    paid?: number | null;
    pending?: number | null;
    overdue?: number | null;
    draft?: number | null;
  } | null;
}

/**
 * Dashboard metrics interface with nullable fields for fail-closed behavior.
 * null = data unavailable (unknown state), NOT zero.
 *
 * P0 FIX: Added `available` flag to signal when metrics can be safely accessed.
 * Consumers MUST check `available === true` before dereferencing any nested fields.
 */
export interface DashboardMetrics {
  /**
   * P0 NULL-SAFE: Availability flag.
   * - true: All nested objects are guaranteed non-null (safe to access)
   * - false: Data unavailable - render explicit unavailable state
   *
   * MANDATORY CHECK: if (!metrics?.available) { render unavailable UI }
   */
  available: boolean;
  counts: {
    invoices: number | null;
    bills: number | null;
    customers: number | null;
    vendors: number | null;
  };
  summary: {
    totalInvoiced: number | null;
    totalInvoicePaid: number | null;
    totalInvoiceDue: number | null;
    totalBilled: number | null;
    totalBillPaid: number | null;
    totalBillDue: number | null;
  };
  invoicesByStatus: {
    paid: number | null;
    pending: number | null;
    overdue: number | null;
    draft: number | null;
  };
  billsByStatus: {
    paid: number | null;
    pending: number | null;
    overdue: number | null;
    draft: number | null;
  };
}

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
function normalizeMetrics(raw: RawMetricsResponse | null | undefined): DashboardMetrics {
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
        const raw = await apiFetch<RawMetricsResponse>("/api/dashboard/metrics");
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
    [metrics, isLoading, error, fetchMetrics]
  );
}
