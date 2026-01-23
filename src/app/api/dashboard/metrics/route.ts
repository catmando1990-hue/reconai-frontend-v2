import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * Backend invoice response shape (subset for aggregation)
 */
interface InvoiceData {
  id: string;
  status: string; // "draft" | "sent" | "paid" | "overdue" | "cancelled"
  total_amount: number;
  amount_paid: number;
  amount_due: number;
}

/**
 * Backend bill response shape (subset for aggregation)
 */
interface BillData {
  id: string;
  status: string; // "pending" | "partial" | "paid"
  amount_total: number;
  amount_paid: number;
  amount_due: number;
}

/**
 * GET /api/dashboard/metrics
 *
 * Aggregates dashboard metrics from backend sources.
 * FAIL-CLOSED: Returns null for summary fields if aggregation fails.
 * Never returns 0 as a fallback for financial data.
 *
 * Auth: Required via Clerk
 * Response: Always valid JSON with request_id
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  // Fail-closed metrics: null indicates unknown state, not zero
  const failClosedMetrics = {
    request_id: requestId,
    counts: {
      invoices: null as number | null,
      bills: null as number | null,
      customers: null as number | null,
      vendors: null as number | null,
    },
    summary: {
      totalInvoiced: null as number | null,
      totalInvoicePaid: null as number | null,
      totalInvoiceDue: null as number | null,
      totalBilled: null as number | null,
      totalBillPaid: null as number | null,
      totalBillDue: null as number | null,
    },
    invoicesByStatus: {
      paid: null as number | null,
      pending: null as number | null,
      overdue: null as number | null,
      draft: null as number | null,
    },
    billsByStatus: {
      paid: null as number | null,
      pending: null as number | null,
      overdue: null as number | null,
      draft: null as number | null,
    },
  };

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      // Not authenticated - return fail-closed metrics
      return NextResponse.json(failClosedMetrics, { status: 200 });
    }

    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Fetch full data for aggregation (fail-closed: null on failure)
    const fetchData = async <T>(endpoint: string): Promise<T[] | null> => {
      try {
        const res = await fetch(`${getBackendUrl()}${endpoint}`, {
          method: "GET",
          headers,
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data)) return data as T[];
        return null;
      } catch {
        return null;
      }
    };

    // Fetch count only (for customers/vendors where we don't need aggregation)
    const fetchCount = async (endpoint: string): Promise<number | null> => {
      try {
        const res = await fetch(`${getBackendUrl()}${endpoint}`, {
          method: "GET",
          headers,
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data)) return data.length;
        if (typeof data?.count === "number") return data.count;
        if (typeof data?.total === "number") return data.total;
        return null;
      } catch {
        return null;
      }
    };

    // Fetch all data in parallel
    const [invoices, bills, customerCount, vendorCount] = await Promise.all([
      fetchData<InvoiceData>("/api/invoices?limit=1000"),
      fetchData<BillData>("/api/bills?limit=1000"),
      fetchCount("/api/customers?limit=1000"),
      fetchCount("/api/vendors?limit=1000"),
    ]);

    // Aggregate invoice data (null if fetch failed)
    let invoiceSummary: {
      totalInvoiced: number | null;
      totalInvoicePaid: number | null;
      totalInvoiceDue: number | null;
    };
    let invoicesByStatus: {
      paid: number | null;
      pending: number | null;
      overdue: number | null;
      draft: number | null;
    };

    if (invoices === null) {
      // FAIL-CLOSED: Could not fetch invoices
      invoiceSummary = {
        totalInvoiced: null,
        totalInvoicePaid: null,
        totalInvoiceDue: null,
      };
      invoicesByStatus = {
        paid: null,
        pending: null,
        overdue: null,
        draft: null,
      };
    } else {
      // Real aggregation from backend truth
      invoiceSummary = {
        totalInvoiced: invoices.reduce(
          (sum, inv) => sum + (inv.total_amount || 0),
          0,
        ),
        totalInvoicePaid: invoices.reduce(
          (sum, inv) => sum + (inv.amount_paid || 0),
          0,
        ),
        totalInvoiceDue: invoices.reduce(
          (sum, inv) => sum + (inv.amount_due || 0),
          0,
        ),
      };
      // Status counts - map backend status to UI categories
      // Backend statuses: "draft", "sent", "paid", "overdue", "cancelled"
      invoicesByStatus = {
        paid: invoices.filter((inv) => inv.status === "paid").length,
        pending: invoices.filter((inv) => inv.status === "sent").length,
        overdue: invoices.filter((inv) => inv.status === "overdue").length,
        draft: invoices.filter((inv) => inv.status === "draft").length,
      };
    }

    // Aggregate bill data (null if fetch failed)
    let billSummary: {
      totalBilled: number | null;
      totalBillPaid: number | null;
      totalBillDue: number | null;
    };
    let billsByStatus: {
      paid: number | null;
      pending: number | null;
      overdue: number | null;
      draft: number | null;
    };

    if (bills === null) {
      // FAIL-CLOSED: Could not fetch bills
      billSummary = {
        totalBilled: null,
        totalBillPaid: null,
        totalBillDue: null,
      };
      billsByStatus = { paid: null, pending: null, overdue: null, draft: null };
    } else {
      // Real aggregation from backend truth
      billSummary = {
        totalBilled: bills.reduce(
          (sum, bill) => sum + (bill.amount_total || 0),
          0,
        ),
        totalBillPaid: bills.reduce(
          (sum, bill) => sum + (bill.amount_paid || 0),
          0,
        ),
        totalBillDue: bills.reduce(
          (sum, bill) => sum + (bill.amount_due || 0),
          0,
        ),
      };
      // Status counts - map backend status to UI categories
      // Backend statuses: "pending", "partial", "paid"
      billsByStatus = {
        paid: bills.filter((bill) => bill.status === "paid").length,
        pending: bills.filter(
          (bill) => bill.status === "pending" || bill.status === "partial",
        ).length,
        overdue: 0, // Backend doesn't have overdue status for bills
        draft: 0, // Backend doesn't have draft status for bills
      };
    }

    return NextResponse.json({
      request_id: requestId,
      counts: {
        invoices: invoices?.length ?? null,
        bills: bills?.length ?? null,
        customers: customerCount,
        vendors: vendorCount,
      },
      summary: {
        ...invoiceSummary,
        ...billSummary,
      },
      invoicesByStatus,
      billsByStatus,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    // FAIL-CLOSED: Return null values, never fake zeros
    return NextResponse.json(failClosedMetrics, { status: 200 });
  }
}
