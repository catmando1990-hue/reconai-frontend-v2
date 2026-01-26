import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://reconai-backend.onrender.com";

/**
 * Assert that the current user has admin role.
 * Returns a NextResponse error if not admin, null otherwise.
 */
async function assertAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Not authenticated" },
      { status: 401 }
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
  const userRole = (
    user?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (userRole === "admin" || userRole === "org:admin") {
    return null;
  }

  return NextResponse.json(
    { error: "Forbidden", message: "Admin access required" },
    { status: 403 }
  );
}

/**
 * GET /api/admin/exports/[exportId]/provenance
 *
 * Proxies to internal backend endpoint for export provenance.
 * Admin-only, read-only.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ exportId: string }> }
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { exportId } = await params;

  if (!exportId) {
    return NextResponse.json(
      { error: "Bad request", message: "Export ID is required" },
      { status: 400 }
    );
  }

  const { getToken } = await auth();
  const token = await getToken();

  try {
    const res = await fetch(
      `${BACKEND_URL}/internal/exports/${exportId}/provenance`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Not found", message: "Export not found" },
        { status: 404 }
      );
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Backend error",
          message: errorData.detail || `Status ${res.status}`,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching export provenance:", err);
    return NextResponse.json(
      {
        error: "Internal error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
