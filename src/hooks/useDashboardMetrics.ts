"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface DashboardMetrics {
  counts: {
    invoices: number;
    bills: number;
    customers: number;
    vendors: number;
  };
  summary: {
    totalInvoiced: number;
    totalInvoicePaid: number;
    totalInvoiceDue: number;
    totalBilled: number;
    totalBillPaid: number;
    totalBillDue: number;
  };
  invoicesByStatus: {
    paid: number;
    pending: number;
    overdue: number;
    draft: number;
  };
  billsByStatus: {
    paid: number;
    pending: number;
    overdue: number;
    draft: number;
  };
}

// Empty metrics for fallback
const emptyMetrics: DashboardMetrics = {
  counts: {
    invoices: 0,
    bills: 0,
    customers: 0,
    vendors: 0,
  },
  summary: {
    totalInvoiced: 0,
    totalInvoicePaid: 0,
    totalInvoiceDue: 0,
    totalBilled: 0,
    totalBillPaid: 0,
    totalBillDue: 0,
  },
  invoicesByStatus: {
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
  },
  billsByStatus: {
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
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
        // Silent failure: use empty metrics
        if (alive) {
          setMetrics(emptyMetrics);
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
