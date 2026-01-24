import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/intelligence/insights
 *
 * Proxies to backend GET /intelligence/insights
 * Returns insights summary for the current user.
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
          intelligence_version: "1",
          lifecycle: "failed",
          reason_code: "not_configured",
          reason_message: "Backend not configured",
          generated_at: new Date().toISOString(),
          items: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Proxy to backend /intelligence/insights
    const resp = await fetch(`${backendUrl}/intelligence/insights`, {
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
        `[Intelligence insights] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      // Return lifecycle response on error
      return NextResponse.json(
        {
          intelligence_version: "1",
          lifecycle: "failed",
          reason_code: "backend_timeout",
          reason_message: `Backend returned ${resp.status}`,
          generated_at: new Date().toISOString(),
          items: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    // Transform backend response to frontend expected shape
    // Backend returns: { generated_at, items: [...] }
    // Frontend expects: { intelligence_version, lifecycle, reason_code, reason_message, generated_at, items }
    const items = data?.items || [];

    return NextResponse.json(
      {
        intelligence_version: "1",
        lifecycle: items.length > 0 ? "success" : "success",
        reason_code: null,
        reason_message: null,
        generated_at: data?.generated_at || new Date().toISOString(),
        items: items,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Intelligence insights] Error:", err);
    return NextResponse.json(
      {
        intelligence_version: "1",
        lifecycle: "failed",
        reason_code: "computation_error",
        reason_message: err instanceof Error ? err.message : "Unknown error",
        generated_at: new Date().toISOString(),
        items: null,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
