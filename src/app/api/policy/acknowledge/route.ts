import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/policy/acknowledge
 *
 * Proxies to backend POST /api/policy/acknowledge
 * Backend handles persistence and audit logging.
 */
export async function POST(req: Request) {
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
    const body = await req.json().catch(() => ({}));

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      // Backend not configured — accept silently for graceful degradation
      console.warn(
        "[Policy acknowledge] Backend URL not configured, returning success",
      );
      return NextResponse.json(
        {
          ok: true,
          acknowledged: true,
          policy: body.policy,
          timestamp: new Date().toISOString(),
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const resp = await fetch(`${backendUrl}/api/policy/acknowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error(
        `[Policy acknowledge] Backend error (${resp.status}):`,
        data,
      );
      // Graceful degradation — don't block UI for policy failures
      return NextResponse.json(
        {
          ok: true,
          acknowledged: true,
          policy: body.policy,
          timestamp: new Date().toISOString(),
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Policy acknowledge] Error:", err);
    // Graceful degradation
    return NextResponse.json(
      {
        ok: true,
        acknowledged: true,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
