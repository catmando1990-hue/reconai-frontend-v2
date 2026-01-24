import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/intelligence/alerts
 *
 * Proxies to backend GET /intelligence/alerts
 * Returns intelligence alerts for the current user.
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
      // Backend not configured - return empty alerts with lifecycle
      return NextResponse.json(
        {
          generated_at: new Date().toISOString(),
          items: [],
          _isDemo: false,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Proxy to backend /intelligence/alerts
    const resp = await fetch(`${backendUrl}/intelligence/alerts`, {
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
        `[Intelligence alerts] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      // Return empty alerts on error
      return NextResponse.json(
        {
          generated_at: new Date().toISOString(),
          items: [],
          _isDemo: false,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    // Return backend response directly (already has correct shape)
    return NextResponse.json(
      {
        ...data,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Intelligence alerts] Error:", err);
    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        items: [],
        _isDemo: false,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
