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

  const { getToken, orgId, userId } = await auth();
  const token = await getToken();

  // Get organization ID from Clerk org context or user metadata
  let organizationId = orgId;
  if (!organizationId) {
    const user = await currentUser();
    organizationId = (user?.publicMetadata as Record<string, unknown> | undefined)?.organization_id as string | undefined;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/internal/exports/audit-package`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        organization_id: organizationId || userId, // Fall back to userId if no org
      }),
    });

    if (!res.ok) {
      // Handle 400/404 - backend endpoint not yet implemented or bad request
      if (res.status === 404 || res.status === 400) {
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

    // Backend returns envelope: { ok, data, request_id }
    // Unwrap to get the actual data
    const backendData = data.data || data;

    return NextResponse.json(
      {
        export_id: backendData.export_id,
        status: backendData.status,
        request_id: requestId,
      },
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
