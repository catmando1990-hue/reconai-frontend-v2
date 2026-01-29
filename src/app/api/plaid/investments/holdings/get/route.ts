import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/investments/holdings/get
 *
 * Proxies to backend POST /api/plaid/investments/holdings/get
 * Returns investment holdings data.
 *
 * Phase 8C: Liabilities & Investments UI
 * - Manual fetch only (no polling)
 * - Returns request_id for audit provenance
 * - All values are "as of" fetch time, NOT live
 */
export async function POST() {
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

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Backend not configured",
          holdings: [],
          accounts: [],
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(
      `${backendUrl}/api/plaid/investments/holdings/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Investments holdings] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to fetch holdings: ${res.status}`;
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
          holdings: [],
          accounts: [],
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

    // Normalize holdings with security and account info
    const holdings = (backendData.holdings || []) as Array<
      Record<string, unknown>
    >;
    const normalizedHoldings = holdings.map((holding) => {
      const security = securitiesMap.get(holding.security_id as string) || {};
      const account = accountsMap.get(holding.account_id as string) || {};

      return {
        holding_id:
          holding.holding_id || `${holding.account_id}-${holding.security_id}`,
        account_id: holding.account_id,
        institution_name: account.institution_name || account.name || "Unknown",
        account_name:
          account.name || account.official_name || "Investment Account",
        account_mask: account.mask || "****",
        security_id: holding.security_id,
        security_name:
          security.name || security.ticker_symbol || "Unknown Security",
        ticker_symbol: security.ticker_symbol || null,
        security_type: security.type || "unknown",
        quantity: Number(holding.quantity || 0),
        price_as_of: Number(
          holding.institution_price || security.close_price || 0,
        ),
        value_as_of: Number(
          holding.institution_value ||
            Number(holding.quantity || 0) *
              Number(holding.institution_price || 0),
        ),
        cost_basis: holding.cost_basis ?? null,
        as_of:
          holding.institution_price_as_of ||
          backendData.as_of ||
          new Date().toISOString(),
      };
    });

    // Normalize accounts
    const normalizedAccounts = accounts.map((acct) => ({
      account_id: acct.account_id,
      institution_name: acct.institution_name || "Unknown",
      account_name: acct.name || acct.official_name || "Investment Account",
      account_mask: acct.mask || "****",
      account_type: acct.type || acct.subtype || "investment",
      reported_balance: Number(
        (acct.balances as Record<string, unknown> | undefined)?.available ??
          (acct.balances as Record<string, unknown> | undefined)?.current ??
          acct.balance ??
          0,
      ),
    }));

    return NextResponse.json(
      {
        ok: true,
        holdings: normalizedHoldings,
        accounts: normalizedAccounts,
        total_value: normalizedHoldings.reduce(
          (sum, h) => sum + h.value_as_of,
          0,
        ),
        fetched_at: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Investments holdings] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to fetch holdings: ${message}`,
        holdings: [],
        accounts: [],
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
