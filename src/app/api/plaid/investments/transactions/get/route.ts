import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/investments/transactions/get
 *
 * Proxies to backend POST /api/plaid/investments/transactions/get
 * Returns investment transactions within a date range.
 *
 * Request body:
 * - start_date: ISO date string (optional, defaults to 30 days ago)
 * - end_date: ISO date string (optional, defaults to today)
 *
 * Phase 8C: Liabilities & Investments UI
 * - Manual fetch only (no polling)
 * - Date-bounded view
 * - Read-only display
 * - Returns request_id for audit provenance
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await request.json().catch(() => ({}));

    // Default date range: last 30 days
    const endDate = body.end_date || new Date().toISOString().split("T")[0];
    const startDate =
      body.start_date ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split("T")[0];
      })();

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Backend not configured",
          transactions: [],
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(
      `${backendUrl}/api/plaid/investments/transactions/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Investment transactions] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to fetch transactions: ${res.status}`;
      try {
        const errData = JSON.parse(errorText);
        errorMsg = errData.error || errData.detail || errorMsg;
      } catch {
        // Keep default error message
      }

      return NextResponse.json(
        {
          ok: false,
          error: errorMsg,
          transactions: [],
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();
    const backendData = data.data || data;

    // Build securities lookup
    const securities = (backendData.securities || []) as Array<
      Record<string, unknown>
    >;
    const securitiesMap = new Map<string, Record<string, unknown>>();
    for (const sec of securities) {
      if (sec.security_id) {
        securitiesMap.set(sec.security_id as string, sec);
      }
    }

    // Build accounts lookup
    const accounts = (backendData.accounts || []) as Array<
      Record<string, unknown>
    >;
    const accountsMap = new Map<string, Record<string, unknown>>();
    for (const acct of accounts) {
      if (acct.account_id) {
        accountsMap.set(acct.account_id as string, acct);
      }
    }

    // Normalize transactions
    const transactions = (backendData.investment_transactions ||
      backendData.transactions ||
      []) as Array<Record<string, unknown>>;
    const normalizedTransactions = transactions.map((tx) => {
      const security = securitiesMap.get(tx.security_id as string) || {};
      const account = accountsMap.get(tx.account_id as string) || {};

      return {
        transaction_id: tx.investment_transaction_id || tx.transaction_id,
        account_id: tx.account_id,
        institution_name: account.institution_name || "Unknown",
        account_name:
          account.name || account.official_name || "Investment Account",
        account_mask: account.mask || "****",
        security_id: tx.security_id,
        security_name:
          security.name || security.ticker_symbol || tx.name || "Unknown",
        ticker_symbol: security.ticker_symbol || null,
        date: tx.date,
        type: tx.type || tx.subtype || "unknown",
        subtype: tx.subtype || null,
        quantity: tx.quantity ?? null,
        price: tx.price ?? null,
        amount: Number(tx.amount || 0),
        fees: tx.fees ?? null,
      };
    });

    // Sort by date descending
    normalizedTransactions.sort((a, b) => {
      const dateA =
        a.date && typeof a.date === "string" ? new Date(a.date).getTime() : 0;
      const dateB =
        b.date && typeof b.date === "string" ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(
      {
        ok: true,
        transactions: normalizedTransactions,
        start_date: startDate,
        end_date: endDate,
        total_count: normalizedTransactions.length,
        fetched_at: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Investment transactions] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to fetch transactions: ${message}`,
        transactions: [],
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
