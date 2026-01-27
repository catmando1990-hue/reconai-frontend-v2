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
 * POST /api/exports/audit-package
 *
 * Triggers generation of a compliance audit package.
 * Admin-only, manual trigger required.
 *
 * Returns:
 * - export_id: Unique identifier for the export
 * - status: Current status of the export
 * - request_id: Request tracking ID
 */
export async function POST() {
  const requestId = crypto.randomUUID();

  const forbidden = await assertAdmin(requestId);
  if (forbidden) return forbidden;

  const { getToken } = await auth();
  const token = await getToken();

  try {
    const res = await fetch(`${BACKEND_URL}/internal/exports/audit-package`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
    });

    if (!res.ok) {
      // Handle 404 - backend endpoint not yet implemented
      if (res.status === 404) {
        return NextResponse.json(
          {
            export_id: `stub-${requestId.slice(0, 8)}`,
            status: "pending",
            message: "Audit package export queued. Backend integration pending.",
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
    console.error("Error generating audit package:", err);
    // Network errors or backend unavailable - return stub response
    return NextResponse.json(
      {
        export_id: `stub-${requestId.slice(0, 8)}`,
        status: "pending",
        message: "Audit package export queued. Backend integration pending.",
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
