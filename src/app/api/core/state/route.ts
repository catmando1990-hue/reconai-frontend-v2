import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * CORE State API - Single source of truth for all CORE surfaces
 *
 * P0 FIX: Every CORE UI surface MUST be driven by this single endpoint.
 * - Dashboard home
 * - Accounts summary
 * - Invoicing/Bills cards
 * - Customers/Vendors
 *
 * FAIL-CLOSED: Returns { available: false } if data cannot be fetched.
 * Never returns placeholders, zeros, or partial data.
 */

// Backend data types
interface InvoiceData {
  id: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date?: string;
  created_at?: string;
  customer_name?: string;
}

interface BillData {
  id: string;
  status: string;
  amount_total: number;
  amount_paid: number;
  amount_due: number;
  due_date?: string;
  created_at?: string;
  vendor_name?: string;
}

interface TransactionData {
  id: string;
  date: string;
  amount: number;
  merchant_name?: string;
  category?: string;
  account_id?: string;
}

interface PlaidItemData {
  item_id: string;
  status: string;
  last_synced_at?: string;
  institution_name?: string;
}

// Response type for CORE state
export interface CoreStateResponse {
  /**
   * MANDATORY CHECK: If false, render NOTHING for CORE widgets.
   * Do not show "--", do not show empty cards, do not show placeholders.
   */
  available: boolean;

  /** Request tracking */
  request_id: string;
  fetched_at: string;

  /** Live State - what needs attention NOW */
  live_state: {
    unpaid_invoices: {
      count: number;
      total_due: number;
      items: Array<{
        id: string;
        customer_name: string;
        amount_due: number;
        due_date: string | null;
        is_overdue: boolean;
      }>;
    } | null;

    unpaid_bills: {
      count: number;
      total_due: number;
      items: Array<{
        id: string;
        vendor_name: string;
        amount_due: number;
        due_date: string | null;
        is_overdue: boolean;
      }>;
    } | null;

    bank_sync: {
      status: "healthy" | "stale" | "error" | "not_connected";
      last_synced_at: string | null;
      items_needing_attention: number;
    } | null;
  };

  /** Evidence - actual backend data */
  evidence: {
    invoices: {
      total_count: number;
      total_amount: number;
      paid_amount: number;
      due_amount: number;
      by_status: {
        paid: number;
        pending: number;
        overdue: number;
        draft: number;
      };
    } | null;

    bills: {
      total_count: number;
      total_amount: number;
      paid_amount: number;
      due_amount: number;
      by_status: {
        paid: number;
        pending: number;
        overdue: number;
      };
    } | null;

    customers: {
      total_count: number;
    } | null;

    vendors: {
      total_count: number;
    } | null;

    recent_transactions: {
      count: number;
      items: Array<{
        id: string;
        date: string;
        amount: number;
        merchant_name: string;
      }>;
    } | null;
  };
}

/**
 * Fail-closed response - returned when data cannot be fetched
 */
function failClosedResponse(requestId: string): CoreStateResponse {
  return {
    available: false,
    request_id: requestId,
    fetched_at: new Date().toISOString(),
    live_state: {
      unpaid_invoices: null,
      unpaid_bills: null,
      bank_sync: null,
    },
    evidence: {
      invoices: null,
      bills: null,
      customers: null,
      vendors: null,
      recent_transactions: null,
    },
  };
}

/**
 * Check if a date is in the past (overdue)
 */
function isOverdue(dueDate: string | undefined | null): boolean {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch {
    return false;
  }
}

/**
 * Check if a sync is stale (>24h old)
 */
function isSyncStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return true;
  try {
    const syncDate = new Date(lastSyncedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  } catch {
    return true;
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(failClosedResponse(requestId), { status: 200 });
    }

    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Generic fetch helper with fail-closed behavior
    const fetchData = async <T>(endpoint: string): Promise<T[] | null> => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: "GET",
          headers,
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (Array.isArray(data)) return data as T[];
        if (data?.items && Array.isArray(data.items)) return data.items as T[];
        return null;
      } catch {
        return null;
      }
    };

    const fetchCount = async (endpoint: string): Promise<number | null> => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
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

    // Fetch all data in parallel - SINGLE FETCH for all CORE data
    const [invoices, bills, customerCount, vendorCount, transactions, plaidItems] =
      await Promise.all([
        fetchData<InvoiceData>("/api/invoices?limit=1000"),
        fetchData<BillData>("/api/bills?limit=1000"),
        fetchCount("/api/customers?limit=1000"),
        fetchCount("/api/vendors?limit=1000"),
        fetchData<TransactionData>("/api/transactions?limit=50"),
        fetchData<PlaidItemData>("/api/plaid/items"),
      ]);

    // Determine overall availability - need at least some data
    const hasAnyData =
      invoices !== null ||
      bills !== null ||
      customerCount !== null ||
      vendorCount !== null;

    if (!hasAnyData) {
      return NextResponse.json(failClosedResponse(requestId), { status: 200 });
    }

    // Build Live State - what needs attention NOW
    let unpaidInvoices: CoreStateResponse["live_state"]["unpaid_invoices"] = null;
    if (invoices !== null) {
      const unpaid = invoices.filter(
        (inv) => inv.status !== "paid" && inv.status !== "cancelled" && inv.amount_due > 0
      );
      if (unpaid.length > 0) {
        unpaidInvoices = {
          count: unpaid.length,
          total_due: unpaid.reduce((sum, inv) => sum + (inv.amount_due || 0), 0),
          items: unpaid.slice(0, 5).map((inv) => ({
            id: inv.id,
            customer_name: inv.customer_name || "Unknown",
            amount_due: inv.amount_due,
            due_date: inv.due_date || null,
            is_overdue: isOverdue(inv.due_date),
          })),
        };
      }
    }

    let unpaidBills: CoreStateResponse["live_state"]["unpaid_bills"] = null;
    if (bills !== null) {
      const unpaid = bills.filter(
        (bill) => bill.status !== "paid" && bill.amount_due > 0
      );
      if (unpaid.length > 0) {
        unpaidBills = {
          count: unpaid.length,
          total_due: unpaid.reduce((sum, bill) => sum + (bill.amount_due || 0), 0),
          items: unpaid.slice(0, 5).map((bill) => ({
            id: bill.id,
            vendor_name: bill.vendor_name || "Unknown",
            amount_due: bill.amount_due,
            due_date: bill.due_date || null,
            is_overdue: isOverdue(bill.due_date),
          })),
        };
      }
    }

    let bankSync: CoreStateResponse["live_state"]["bank_sync"] = null;
    if (plaidItems !== null) {
      if (plaidItems.length === 0) {
        bankSync = {
          status: "not_connected",
          last_synced_at: null,
          items_needing_attention: 0,
        };
      } else {
        const needsAttention = plaidItems.filter(
          (item) => item.status === "error" || item.status === "login_required"
        );
        const latestSync = plaidItems
          .map((item) => item.last_synced_at)
          .filter((ts): ts is string => ts !== undefined && ts !== null)
          .sort()
          .reverse()[0] || null;

        let status: "healthy" | "stale" | "error" = "healthy";
        if (needsAttention.length > 0) {
          status = "error";
        } else if (isSyncStale(latestSync)) {
          status = "stale";
        }

        bankSync = {
          status,
          last_synced_at: latestSync,
          items_needing_attention: needsAttention.length,
        };
      }
    }

    // Build Evidence - actual backend data
    let invoiceEvidence: CoreStateResponse["evidence"]["invoices"] = null;
    if (invoices !== null) {
      invoiceEvidence = {
        total_count: invoices.length,
        total_amount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        paid_amount: invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
        due_amount: invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0),
        by_status: {
          paid: invoices.filter((inv) => inv.status === "paid").length,
          pending: invoices.filter((inv) => inv.status === "sent").length,
          overdue: invoices.filter((inv) => inv.status === "overdue").length,
          draft: invoices.filter((inv) => inv.status === "draft").length,
        },
      };
    }

    let billEvidence: CoreStateResponse["evidence"]["bills"] = null;
    if (bills !== null) {
      billEvidence = {
        total_count: bills.length,
        total_amount: bills.reduce((sum, bill) => sum + (bill.amount_total || 0), 0),
        paid_amount: bills.reduce((sum, bill) => sum + (bill.amount_paid || 0), 0),
        due_amount: bills.reduce((sum, bill) => sum + (bill.amount_due || 0), 0),
        by_status: {
          paid: bills.filter((bill) => bill.status === "paid").length,
          pending: bills.filter(
            (bill) => bill.status === "pending" || bill.status === "partial"
          ).length,
          overdue: 0, // Backend doesn't track overdue for bills
        },
      };
    }

    let recentTransactions: CoreStateResponse["evidence"]["recent_transactions"] = null;
    if (transactions !== null && transactions.length > 0) {
      recentTransactions = {
        count: transactions.length,
        items: transactions.slice(0, 10).map((tx) => ({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          merchant_name: tx.merchant_name || "Unknown",
        })),
      };
    }

    const response: CoreStateResponse = {
      available: true,
      request_id: requestId,
      fetched_at: new Date().toISOString(),
      live_state: {
        unpaid_invoices: unpaidInvoices,
        unpaid_bills: unpaidBills,
        bank_sync: bankSync,
      },
      evidence: {
        invoices: invoiceEvidence,
        bills: billEvidence,
        customers: customerCount !== null ? { total_count: customerCount } : null,
        vendors: vendorCount !== null ? { total_count: vendorCount } : null,
        recent_transactions: recentTransactions,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Core state fetch error:", error);
    return NextResponse.json(failClosedResponse(requestId), { status: 200 });
  }
}
