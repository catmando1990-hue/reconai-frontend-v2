import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/system/status
 *
 * Returns system health status for the admin dashboard.
 * Aggregates data from backend services.
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

    // Try to get backend health status
    let backendOk = false;
    let maintenance = false;

    try {
      const backendUrl = getBackendUrl();
      const healthResp = await fetch(`${backendUrl}/`, {
        method: "GET",
        headers: {
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(5000),
      });
      backendOk = healthResp.ok;

      // Try maintenance status
      try {
        const maintResp = await fetch(`${backendUrl}/api/maintenance/status`, {
          method: "GET",
          headers: { "x-request-id": requestId },
          signal: AbortSignal.timeout(2000),
        });
        if (maintResp.ok) {
          const maintData = await maintResp.json();
          maintenance = Boolean(maintData?.enabled);
        }
      } catch {
        // Maintenance check failed, assume not in maintenance
      }
    } catch {
      // Backend unreachable
      backendOk = false;
    }

    // Try to get Plaid status for last sync
    let lastPlaidSync: string | null = null;
    try {
      const backendUrl = getBackendUrl();
      const plaidResp = await fetch(`${backendUrl}/api/plaid/items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": requestId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(5000),
      });
      if (plaidResp.ok) {
        const plaidData = await plaidResp.json();
        const items = plaidData?.items || [];
        // Find most recent sync timestamp
        const syncTimes = items
          .map((i: { last_synced_at?: string }) => i.last_synced_at)
          .filter((t: string | undefined): t is string => !!t);
        if (syncTimes.length > 0) {
          lastPlaidSync = syncTimes.sort().reverse()[0];
        }
      }
    } catch {
      // Plaid status check failed
    }

    const status = {
      ok: backendOk,
      api: backendOk ? "ok" : "degraded",
      maintenance,
      signals_24h: 0,
      audit_total: 0,
      last_plaid_sync: lastPlaidSync,
      timestamp: new Date().toISOString(),
      request_id: requestId,
    };

    return NextResponse.json(status, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[System status] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        api: "error",
        maintenance: false,
        signals_24h: 0,
        audit_total: 0,
        last_plaid_sync: null,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
