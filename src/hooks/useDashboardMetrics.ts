"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;

    const fetchMetrics = async () => {
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

    fetchMetrics();
    return () => {
      alive = false;
    };
  }, []);

  return { metrics, isLoading, error };
}
