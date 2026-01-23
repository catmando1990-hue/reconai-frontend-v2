/**
 * API Contract Types
 *
 * Centralized type definitions for API responses.
 * These types are the contract between frontend and backend.
 */

/**
 * Dashboard metrics with nullable fields for fail-closed behavior.
 * null = data unavailable (unknown state), NOT zero.
 */
export interface DashboardMetrics {
  /**
   * Availability flag.
   * - true: All nested objects are guaranteed non-null (safe to access)
   * - false: Data unavailable - render explicit unavailable state
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
 * Raw API response shape from /api/dashboard/metrics
 */
export interface DashboardMetricsResponse {
  request_id: string;
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
