import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/cfo/snapshot
 *
 * Proxies to backend GET /cfo/snapshot
 * Transforms backend response to include lifecycle/version fields.
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
      // Backend not configured - return lifecycle response
      return NextResponse.json(
        {
          cfo_version: "1",
          lifecycle: "failed",
          reason_code: "not_configured",
          reason_message: "Backend not configured",
          generated_at: new Date().toISOString(),
          snapshot: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Proxy to backend /cfo/snapshot
    const resp = await fetch(`${backendUrl}/cfo/snapshot`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.error(
        `[CFO snapshot] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      // Return lifecycle response on error
      return NextResponse.json(
        {
          cfo_version: "1",
          lifecycle: "failed",
          reason_code: "backend_timeout",
          reason_message: `Backend returned ${resp.status}`,
          generated_at: new Date().toISOString(),
          snapshot: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    // Transform backend response to frontend expected shape
    // Backend returns: { generated_at, snapshot: {...} }
    // Frontend expects: { cfo_version, lifecycle, reason_code, reason_message, generated_at, snapshot }
    const snapshot = data?.snapshot || null;

    return NextResponse.json(
      {
        cfo_version: "1",
        lifecycle: snapshot ? "success" : "pending",
        reason_code: snapshot ? null : "insufficient_data",
        reason_message: snapshot ? null : "No CFO data available yet",
        generated_at: data?.generated_at || new Date().toISOString(),
        snapshot: snapshot,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[CFO snapshot] Error:", err);
    return NextResponse.json(
      {
        cfo_version: "1",
        lifecycle: "failed",
        reason_code: "computation_error",
        reason_message: err instanceof Error ? err.message : "Unknown error",
        generated_at: new Date().toISOString(),
        snapshot: null,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
