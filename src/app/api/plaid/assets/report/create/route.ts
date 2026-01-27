import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/assets/report/create
 *
 * Proxies to backend POST /api/plaid/assets/report/create
 * Creates a new Asset Report (Net Worth Snapshot).
 *
 * Phase 8B: Net Worth Snapshot UI
 * - Manual trigger only (no automation)
 * - Returns request_id for audit provenance
 * - Returns generated_at timestamp (UTC)
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

    const res = await fetch(`${backendUrl}/api/plaid/assets/report/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(60000), // 60s timeout for report generation
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Asset report create] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to create snapshot: ${res.status}`;
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

    // Unwrap backend response envelope if present
    const backendData = data.data || data;

    return NextResponse.json(
      {
        ok: true,
        report_id: backendData.asset_report_id || backendData.report_id,
        generated_at: backendData.generated_at || backendData.created_at || new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Asset report create] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to create snapshot: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
