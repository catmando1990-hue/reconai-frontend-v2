import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * GET /api/me
 *
 * Proxies to backend /api/me which auto-provisions personal workspace for new users.
 * Never returns 404 for valid Clerk sessions.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}/api/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const responseText = await resp.text();

    if (!responseText || responseText.trim() === "") {
      console.error("Backend /api/me returned empty response");
      return NextResponse.json(
        { error: "Empty response from backend", request_id: requestId },
        { status: 502, headers: { "x-request-id": requestId } },
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
        { status: 502, headers: { "x-request-id": requestId } },
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
          request_id: requestId,
        },
        { status: resp.status, headers: { "x-request-id": requestId } },
      );
    }

    const user = data.user as Record<string, unknown> | undefined;
    const org = data.org as Record<string, unknown> | undefined;
    const permissions = data.permissions as Record<string, unknown> | undefined;

    const profile = {
      request_id: requestId,
      id: user?.id,
      email: user?.email,
      name:
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        undefined,
      firstName: user?.first_name,
      lastName: user?.last_name,
      organizationName: org?.name,
      orgId: org?.id,
      orgSlug: org?.slug,
      tier: org?.tier,
      isPersonalWorkspace: org?.is_personal_workspace || false,
      role: permissions?.role,
      profileCompleted: Boolean(user?.profile_completed),
      timezone: undefined,
      currency: undefined,
      fiscalYearStart: undefined,
      lastLogin: undefined,
      mfaEnabled: undefined,
    };

    return NextResponse.json(profile, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err: unknown) {
    console.error("Profile fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch profile: " + message, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
