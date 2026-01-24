import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/intelligence/duplicates
 *
 * Returns duplicate transaction detection results.
 * Proxies to backend or returns empty array.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { duplicates: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      // Backend not configured - return empty duplicates
      return NextResponse.json(
        { duplicates: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const resp = await fetch(`${backendUrl}/intelligence/duplicates`, {
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
        `[Duplicates] Backend error (${resp.status}):`,
        await resp.text().catch(() => "unknown"),
      );
      return NextResponse.json(
        { duplicates: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();
    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Duplicates] Error:", err);
    return NextResponse.json(
      { duplicates: [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
