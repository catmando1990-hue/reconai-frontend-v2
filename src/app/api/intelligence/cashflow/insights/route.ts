import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/intelligence/cashflow/insights
 *
 * Returns cashflow insights and trend analysis.
 * Proxies to backend or returns null insight.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { trend: null, confidence: 0, explanation: "Not authenticated", request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      // Backend not configured - return empty insight
      return NextResponse.json(
        { trend: null, confidence: 0, explanation: "Backend not configured", request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const resp = await fetch(`${backendUrl}/intelligence/cashflow/insights`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      console.error(
        `[Cashflow insights] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      return NextResponse.json(
        { trend: null, confidence: 0, explanation: "Backend unavailable", request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();
    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Cashflow insights] Error:", err);
    return NextResponse.json(
      { trend: null, confidence: 0, explanation: "Request failed", request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
