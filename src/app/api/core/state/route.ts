import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * CORE State API - Single source of truth for all CORE surfaces
 *
 * DATA SOURCES:
 * - Invoices, Bills, Customers, Vendors: Backend (FastAPI/SQLite)
 * - Transactions, Plaid Items: Supabase (source of truth)
 *
 * FAIL-CLOSED: Returns { available: false } if data cannot be fetched.
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
  name?: string;
  category?: string[];
  account_id?: string;
}

interface PlaidItemData {
  item_id: string;
  status: string;
  updated_at?: string;
  institution_name?: string;
}

// Response type for CORE state
export interface CoreStateResponse {
  available: boolean;
  request_id: string;
  fetched_at: string;
  sync: {
    version: string;
    status: "running" | "failed" | "success" | "never";
    started_at: string | null;
    last_successful_at: string | null;
    error_reason: string | null;
  };
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
    customers: { total_count: number } | null;
    vendors: { total_count: number } | null;
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

const SYNC_VERSION = "1";

function failClosedResponse(requestId: string): CoreStateResponse {
  return {
    available: false,
    request_id: requestId,
    fetched_at: new Date().toISOString(),
    sync: {
      version: SYNC_VERSION,
      status: "never",
      started_at: null,
      last_successful_at: null,
      error_reason: null,
    },
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

function isOverdue(dueDate: string | undefined | null): boolean {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch {
    return false;
  }
}

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

/**
 * Fetch transactions from Supabase (source of truth)
 */
async function fetchTransactionsFromSupabase(
  userId: string,
): Promise<TransactionData[] | null> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, transaction_id, date, amount, name, merchant_name, category, account_id",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Core state] Supabase transactions error:", error);
      return null;
    }

    return (data || []).map((tx) => ({
      id: tx.id || tx.transaction_id,
      date: tx.date,
      amount: tx.amount,
      merchant_name: tx.merchant_name || tx.name,
      name: tx.name,
      category: tx.category,
      account_id: tx.account_id,
    }));
  } catch (err) {
    console.error("[Core state] Supabase transactions fetch failed:", err);
    return null;
  }
}

/**
 * Fetch Plaid items from Supabase (source of truth)
 */
async function fetchPlaidItemsFromSupabase(
  userId: string,
): Promise<PlaidItemData[] | null> {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("plaid_items")
      .select("item_id, status, updated_at, institution_name")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (error) {
      console.error("[Core state] Supabase plaid_items error:", error);
      return null;
    }

    return (data || []).map((item) => ({
      item_id: item.item_id,
      status: item.status || "active",
      updated_at: item.updated_at,
      institution_name: item.institution_name,
    }));
  } catch (err) {
    console.error("[Core state] Supabase plaid_items fetch failed:", err);
    return null;
  }
}

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(failClosedResponse(requestId), {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Fetch from backend (invoices, bills, customers, vendors)
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

    // Fetch all data in parallel
    // Backend: invoices, bills, customers, vendors
    // Supabase: transactions, plaid_items (source of truth)
    const [
      invoices,
      bills,
      customerCount,
      vendorCount,
      transactions,
      plaidItems,
    ] = await Promise.all([
      fetchData<InvoiceData>("/api/invoices?limit=1000"),
      fetchData<BillData>("/api/bills?limit=1000"),
      fetchCount("/api/customers?limit=1000"),
      fetchCount("/api/vendors?limit=1000"),
      fetchTransactionsFromSupabase(userId),
      fetchPlaidItemsFromSupabase(userId),
    ]);

    // Determine overall availability
    // Now includes transactions from Supabase
    const hasAnyData =
      invoices !== null ||
      bills !== null ||
      customerCount !== null ||
      vendorCount !== null ||
      (transactions !== null && transactions.length > 0);

    if (!hasAnyData) {
      return NextResponse.json(failClosedResponse(requestId), {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    // Build Live State
    let unpaidInvoices: CoreStateResponse["live_state"]["unpaid_invoices"] =
      null;
    if (invoices !== null) {
      const unpaid = invoices.filter(
        (inv) =>
          inv.status !== "paid" &&
          inv.status !== "cancelled" &&
          inv.amount_due > 0,
      );
      if (unpaid.length > 0) {
        unpaidInvoices = {
          count: unpaid.length,
          total_due: unpaid.reduce(
            (sum, inv) => sum + (inv.amount_due || 0),
            0,
          ),
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
        (bill) => bill.status !== "paid" && bill.amount_due > 0,
      );
      if (unpaid.length > 0) {
        unpaidBills = {
          count: unpaid.length,
          total_due: unpaid.reduce(
            (sum, bill) => sum + (bill.amount_due || 0),
            0,
          ),
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
          (item) => item.status === "error" || item.status === "login_required",
        );
        const latestSync =
          plaidItems
            .map((item) => item.updated_at)
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

    // Build Evidence
    let invoiceEvidence: CoreStateResponse["evidence"]["invoices"] = null;
    if (invoices !== null) {
      invoiceEvidence = {
        total_count: invoices.length,
        total_amount: invoices.reduce(
          (sum, inv) => sum + (inv.total_amount || 0),
          0,
        ),
        paid_amount: invoices.reduce(
          (sum, inv) => sum + (inv.amount_paid || 0),
          0,
        ),
        due_amount: invoices.reduce(
          (sum, inv) => sum + (inv.amount_due || 0),
          0,
        ),
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
        total_amount: bills.reduce(
          (sum, bill) => sum + (bill.amount_total || 0),
          0,
        ),
        paid_amount: bills.reduce(
          (sum, bill) => sum + (bill.amount_paid || 0),
          0,
        ),
        due_amount: bills.reduce(
          (sum, bill) => sum + (bill.amount_due || 0),
          0,
        ),
        by_status: {
          paid: bills.filter((bill) => bill.status === "paid").length,
          pending: bills.filter(
            (bill) => bill.status === "pending" || bill.status === "partial",
          ).length,
          overdue: 0,
        },
      };
    }

    let recentTransactions: CoreStateResponse["evidence"]["recent_transactions"] =
      null;
    if (transactions !== null && transactions.length > 0) {
      recentTransactions = {
        count: transactions.length,
        items: transactions.slice(0, 10).map((tx) => ({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          merchant_name: tx.merchant_name || tx.name || "Unknown",
        })),
      };
    }

    const syncStatus: CoreStateResponse["sync"] = {
      version: SYNC_VERSION,
      status: hasAnyData ? "success" : "never",
      started_at: null,
      last_successful_at: hasAnyData ? new Date().toISOString() : null,
      error_reason: null,
    };

    const response: CoreStateResponse = {
      available: true,
      request_id: requestId,
      fetched_at: new Date().toISOString(),
      sync: syncStatus,
      live_state: {
        unpaid_invoices: unpaidInvoices,
        unpaid_bills: unpaidBills,
        bank_sync: bankSync,
      },
      evidence: {
        invoices: invoiceEvidence,
        bills: billEvidence,
        customers:
          customerCount !== null ? { total_count: customerCount } : null,
        vendors: vendorCount !== null ? { total_count: vendorCount } : null,
        recent_transactions: recentTransactions,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    console.error("Core state fetch error:", error);
    return NextResponse.json(failClosedResponse(requestId), {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  }
}
