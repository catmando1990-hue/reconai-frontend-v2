import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/production/load-test/trigger
 *
 * Proxies load test trigger requests to backend.
 * Requires admin access.
 *
 * Request body:
 *   test_type: "smoke" | "load" | "stress"
 *   duration_seconds: number (10-300)
 *   target_rps: number (1-1000)
 *   confirmation: "RUN LOAD TEST"
 *
 * Response: Always valid JSON with request_id
 */
export async function POST(req: Request) {
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

    // Admin check
    const user = await currentUser();
    const userRole = (
      user?.publicMetadata as Record<string, unknown> | undefined
    )?.role;
    const isAdmin = userRole === "admin" || userRole === "org:admin";

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: { code: "FORBIDDEN", message: "Admin permission required" },
          request_id: requestId,
        },
        { status: 403 },
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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Invalid JSON in request body",
          },
          request_id: requestId,
        },
        { status: 400 },
      );
    }

    const token = await getToken();

    const backendRes = await fetch(
      `${API_URL}/api/production/load-test/trigger`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

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
            raw_preview: responseText.slice(0, 200),
          },
          request_id: requestId,
        },
        { status: 502 },
      );
    }

    if (backendRes.status >= 400) {
      console.error("Backend load test error:", {
        status: backendRes.status,
        data,
        requestId,
      });
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Load test trigger proxy error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to proxy load test request",
        },
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
