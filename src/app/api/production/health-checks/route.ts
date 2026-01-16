import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * GET /api/production/health-checks
 *
 * Proxies health checks requests to backend.
 * Requires authentication.
 *
 * Response: Always valid JSON with request_id
 */
export async function GET() {
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

    const backendRes = await fetch(`${API_URL}/api/production/health-checks`, {
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
    console.error("Health checks proxy error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to proxy health checks request",
        },
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
