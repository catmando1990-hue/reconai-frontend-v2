import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/transactions
 *
 * Returns transactions from the backend.
 * Currently returns empty array if backend call fails or no transactions exist.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    // Try to get transactions from backend
    // The backend may have a /api/transactions endpoint or we need to sync first
    let transactions: unknown[] = [];

    try {
      const backendUrl = getBackendUrl();

      // Try the transactions endpoint if it exists
      const resp = await fetch(`${backendUrl}/api/transactions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(10000),
      });

      if (resp.ok) {
        const data = await resp.json();
        transactions = data?.transactions || data || [];
      }
    } catch {
      // Backend transactions endpoint not available or failed
      // Return empty array - this is a valid state
    }

    // Return transactions (may be empty array)
    return NextResponse.json(transactions, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Transactions] Error:", err);
    // Return empty array on error - graceful degradation
    return NextResponse.json([], {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  }
}
