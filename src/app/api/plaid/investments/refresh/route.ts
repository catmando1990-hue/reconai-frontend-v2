import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/investments/refresh
 *
 * Proxies to backend POST /api/plaid/investments/refresh
 * Triggers a manual refresh of investment data from Plaid.
 *
 * Phase 8C: Liabilities & Investments UI
 * - Manual trigger only (no auto-refresh)
 * - Returns refresh timestamp and status
 * - Returns request_id for audit provenance
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
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(`${backendUrl}/api/plaid/investments/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(60000), // 60s timeout for refresh
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Investments refresh] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to refresh investments: ${res.status}`;
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
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();
    const backendData = data.data || data;

    return NextResponse.json(
      {
        ok: true,
        refreshed_at: backendData.refreshed_at || new Date().toISOString(),
        status: backendData.status || "success",
        accounts_updated: backendData.accounts_updated || 0,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Investments refresh] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to refresh investments: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
