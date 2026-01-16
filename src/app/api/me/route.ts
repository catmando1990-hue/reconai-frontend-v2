import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend - check both env vars for compatibility
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * GET /api/me
 *
 * Proxies to backend /api/me which auto-provisions personal workspace for new users.
 * Never returns 404 for valid Clerk sessions.
 *
 * Response always includes request_id for tracing.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401 },
      );
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}/api/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    // Read response as text first for fail-safe parsing
    const responseText = await resp.text();

    if (!responseText || responseText.trim() === "") {
      console.error("Backend /api/me returned empty response");
      return NextResponse.json(
        { error: "Empty response from backend", request_id: requestId },
        { status: 502 },
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Backend /api/me returned invalid JSON:",
        responseText.slice(0, 200),
      );
      return NextResponse.json(
        { error: "Invalid JSON from backend", request_id: requestId },
        { status: 502 },
      );
    }

    if (!resp.ok) {
      console.error("Backend /api/me error:", resp.status, data);
      return NextResponse.json(
        {
          error:
            (data.detail as Record<string, unknown>)?.message ||
            data.detail ||
            data.error ||
            "Failed to fetch profile",
          backend_status: resp.status,
          request_id: data.request_id || requestId,
        },
        { status: resp.status },
      );
    }

    // Transform backend response to match frontend ProfileData interface
    const user = data.user as Record<string, unknown> | undefined;
    const org = data.org as Record<string, unknown> | undefined;
    const permissions = data.permissions as Record<string, unknown> | undefined;

    const profile = {
      request_id: data.request_id || requestId,
      id: user?.id,
      email: user?.email,
      name:
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        undefined,
      organizationName: org?.name,
      orgId: org?.id,
      orgSlug: org?.slug,
      tier: org?.tier,
      isPersonalWorkspace: org?.is_personal_workspace || false,
      role: permissions?.role,
      timezone: undefined, // Not provided by backend yet
      currency: undefined, // Not provided by backend yet
      fiscalYearStart: undefined, // Not provided by backend yet
      lastLogin: undefined, // Not provided by backend yet
      mfaEnabled: undefined, // Not provided by backend yet
    };

    return NextResponse.json(profile);
  } catch (err: unknown) {
    console.error("Profile fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch profile: " + message, request_id: requestId },
      { status: 500 },
    );
  }
}
