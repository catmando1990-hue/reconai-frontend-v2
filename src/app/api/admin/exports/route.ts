import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * Assert that the current user has admin role.
 * Returns a NextResponse error if not admin, null otherwise.
 */
async function assertAdmin(requestId: string) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Not authenticated", request_id: requestId },
      { status: 401, headers: { "x-request-id": requestId } },
    );
  }

  // Check session claims first
  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (sessionRole === "admin" || sessionRole === "org:admin") {
    return null;
  }

  // Fallback: fetch user directly
  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (userRole === "admin" || userRole === "org:admin") {
    return null;
  }

  return NextResponse.json(
    { error: "Forbidden", message: "Admin access required", request_id: requestId },
    { status: 403, headers: { "x-request-id": requestId } },
  );
}

/**
 * GET /api/admin/exports
 *
 * Proxies to internal backend endpoint for listing exports.
 * Admin-only, read-only.
 *
 * Query params:
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 20)
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  const forbidden = await assertAdmin(requestId);
  if (forbidden) return forbidden;

  const { getToken } = await auth();
  const token = await getToken();

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("page_size") || "20";

  try {
    const res = await fetch(
      `${BACKEND_URL}/internal/exports/stats?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      // Handle 404 - backend endpoint not yet implemented
      if (res.status === 404) {
        return NextResponse.json(
          {
            exports: [],
            total_count: 0,
            page: parseInt(page),
            page_size: parseInt(pageSize),
            request_id: requestId,
          },
          { status: 200, headers: { "x-request-id": requestId } },
        );
      }

      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Backend error",
          message: errorData.detail || `Status ${res.status}`,
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("Error fetching exports:", err);
    // Network errors or backend unavailable - return empty list
    return NextResponse.json(
      {
        exports: [],
        total_count: 0,
        page: parseInt(page),
        page_size: parseInt(pageSize),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
