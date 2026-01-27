import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/assets/report/remove
 *
 * Proxies to backend POST /api/plaid/assets/report/remove
 * Permanently removes an Asset Report (Net Worth Snapshot).
 *
 * Request body:
 * - report_id: The Plaid asset report ID to remove
 *
 * Phase 8B: Net Worth Snapshot UI
 * - Manual delete only (requires confirmation)
 * - Hard delete (no soft delete)
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
    const reportId = body.report_id;

    if (!reportId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing report_id parameter",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
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

    const res = await fetch(`${backendUrl}/api/plaid/assets/report/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ report_id: reportId }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Asset report remove] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to remove snapshot: ${res.status}`;
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

    return NextResponse.json(
      {
        ok: true,
        removed: true,
        report_id: reportId,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Asset report remove] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to remove snapshot: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
