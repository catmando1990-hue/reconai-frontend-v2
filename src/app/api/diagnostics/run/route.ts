import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * POST /api/diagnostics/run
 *
 * Proxies diagnostic run requests to backend.
 * Requires admin access.
 *
 * Request body:
 *   agent: "health" | "performance" | "security" | "bug_detection"
 *   confirm: Exact confirmation phrase
 *
 * Response: Always valid JSON with request_id
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    // Auth check
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

    // Backend URL check
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

    // Parse request body
    let body: { agent?: string; confirm?: string };
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

    // Validate required fields
    if (!body.agent || !body.confirm) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Missing required fields: agent, confirm",
          },
          request_id: requestId,
        },
        { status: 400 },
      );
    }

    // Get auth token
    const token = await getToken();

    // Proxy to backend
    const backendRes = await fetch(`${API_URL}/api/diagnostics/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // Read response as text first to handle empty/invalid responses
    const responseText = await backendRes.text();

    // Handle empty response
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

    // Try to parse JSON
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

    // Return backend response with original status
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Diagnostic run proxy error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to proxy diagnostic request",
        },
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
