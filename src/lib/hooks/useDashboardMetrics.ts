'use client';

import { useState, useEffect } from 'react';

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

// Mock data for demonstration - replace with actual API calls
const mockMetrics: DashboardMetrics = {
  counts: {
    invoices: 24,
    bills: 18,
    customers: 12,
    vendors: 8,
  },
  summary: {
    totalInvoiced: 125000,
    totalInvoicePaid: 98500,
    totalInvoiceDue: 26500,
    totalBilled: 67000,
    totalBillPaid: 52000,
    totalBillDue: 15000,
  },
  invoicesByStatus: {
    paid: 18,
    pending: 4,
    overdue: 2,
    draft: 0,
  },
  billsByStatus: {
    paid: 12,
    pending: 4,
    overdue: 2,
    draft: 0,
  },
};

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // TODO: Replace with actual API call
        // const response = await fetch('/api/dashboard/metrics');
        // const data = await response.json();
        // setMetrics(data);

        setMetrics(mockMetrics);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, isLoading, error };
}
