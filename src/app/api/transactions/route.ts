import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/transactions
 *
 * Proxies to backend GET /api/intelligence/transactions
 * Returns transactions with classification overlay.
 */
export async function GET(req: Request) {
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
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      // Backend not configured — return empty array
      return NextResponse.json([], {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    // Try intelligence/transactions endpoint first
    const resp = await fetch(
      `${backendUrl}/api/intelligence/transactions?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!resp.ok) {
      console.error(`[Transactions] Backend error (${resp.status})`);
      // Return empty array on error — graceful degradation
      return NextResponse.json([], {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    const data = await resp.json();

    // The intelligence endpoint returns { transactions: [...], ... }
    // Extract and transform for frontend table
    const transactions = data.transactions || [];

    // Map to frontend expected format
    const mapped = transactions.map(
      (tx: {
        id?: string;
        transaction_id?: string;
        date?: string;
        merchant_name?: string;
        name?: string;
        description?: string;
        amount?: number;
        account_name?: string;
        account_id?: string;
        category?: string[];
        classification?: { category?: string };
        duplicate_group?: string;
      }) => ({
        id: tx.id || tx.transaction_id,
        date: tx.date,
        merchant: tx.merchant_name || tx.name,
        description: tx.description || tx.name,
        amount: tx.amount,
        account: tx.account_name || tx.account_id,
        category: tx.classification?.category || (tx.category && tx.category[0]) || null,
        duplicate: !!tx.duplicate_group,
      }),
    );

    return NextResponse.json(mapped, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Transactions] Error:", err);
    // Return empty array on error
    return NextResponse.json([], {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  }
}
