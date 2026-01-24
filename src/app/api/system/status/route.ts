import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/system/status
 *
 * Proxies to backend GET /api/system/status
 * Returns system health metrics for admin dashboard.
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

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      // Backend not configured — return degraded status
      return NextResponse.json(
        {
          ok: false,
          api: "unavailable",
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

    const resp = await fetch(`${backendUrl}/api/system/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.error(`[System status] Backend error (${resp.status})`);
      return NextResponse.json(
        {
          ok: false,
          api: "degraded",
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

    const data = await resp.json();

    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
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
