import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/intelligence/worker/tasks
 *
 * Proxies to backend GET /intelligence/worker/tasks
 * Returns AI worker tasks for the current user.
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
      // Backend not configured - return empty tasks with lifecycle
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

    // Proxy to backend /intelligence/worker/tasks
    const resp = await fetch(`${backendUrl}/intelligence/worker/tasks`, {
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
        `[Intelligence worker tasks] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      // Return empty tasks on error
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
    console.error("[Intelligence worker tasks] Error:", err);
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
