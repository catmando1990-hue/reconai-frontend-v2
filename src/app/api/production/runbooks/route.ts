import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/production/runbooks
 *
 * Proxies runbooks requests to backend.
 * Supports optional query params: category, severity
 * Requires authentication.
 *
 * Response: Always valid JSON with request_id
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
          request_id: requestId,
        },
        { status: 401 },
      );
    }

    if (!API_URL) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "Backend API not configured",
          },
          request_id: requestId,
        },
        { status: 500 },
      );
    }

    const token = await getToken();

    // Forward query params
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const backendUrl = queryString
      ? `${API_URL}/api/production/runbooks?${queryString}`
      : `${API_URL}/api/production/runbooks`;

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await backendRes.text();

    if (!responseText || responseText.trim() === "") {
      return NextResponse.json(
        {
          error: {
            code: "EMPTY_RESPONSE",
            message: "Empty response from backend",
          },
          request_id: requestId,
        },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON response from backend",
          },
          request_id: requestId,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Runbooks proxy error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to proxy runbooks request",
        },
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
