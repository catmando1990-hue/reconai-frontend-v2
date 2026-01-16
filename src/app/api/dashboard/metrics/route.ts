import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * GET /api/dashboard/metrics
 *
 * Aggregates dashboard metrics from backend sources.
 * Returns empty metrics on any failure (fail-soft).
 *
 * Auth: Required via Clerk
 * Response: Always valid JSON with request_id
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  // Default empty metrics for fail-soft behavior
  const emptyMetrics = {
    request_id: requestId,
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

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(emptyMetrics, { status: 200 });
    }

    const token = await getToken();

    // Fetch counts from backend in parallel (fail-soft each)
    const fetchCount = async (endpoint: string): Promise<number> => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return 0;
        const data = await res.json();
        // Handle array response (count items) or object with count
        if (Array.isArray(data)) return data.length;
        if (typeof data?.count === "number") return data.count;
        if (typeof data?.total === "number") return data.total;
        return 0;
      } catch {
        return 0;
      }
    };

    // Fetch counts in parallel - bounded queries
    const [invoiceCount, billCount, customerCount, vendorCount] =
      await Promise.all([
        fetchCount("/api/invoices?limit=1000"),
        fetchCount("/api/bills?limit=1000"),
        fetchCount("/api/customers?limit=1000"),
        fetchCount("/api/vendors?limit=1000"),
      ]);

    return NextResponse.json({
      request_id: requestId,
      counts: {
        invoices: invoiceCount,
        bills: billCount,
        customers: customerCount,
        vendors: vendorCount,
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
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(emptyMetrics, { status: 200 });
  }
}
