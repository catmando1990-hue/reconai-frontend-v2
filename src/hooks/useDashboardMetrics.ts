"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";

/**
 * Dashboard metrics interface with nullable fields for fail-closed behavior.
 * null = data unavailable (unknown state), NOT zero.
 */
export interface DashboardMetrics {
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
 * FAIL-CLOSED: null metrics indicate unknown state.
 * UI must display "Unknown" or similar, NOT fake zeros.
 */
const failClosedMetrics: DashboardMetrics = {
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
      const data = await apiFetch<DashboardMetrics>("/api/dashboard/metrics");
      setMetrics(data);
    } catch {
      // FAIL-CLOSED: Use null metrics, not fake zeros
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
        const data = await apiFetch<DashboardMetrics>("/api/dashboard/metrics");
        if (alive) setMetrics(data);
      } catch {
        // FAIL-CLOSED: Use null metrics, not fake zeros
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
