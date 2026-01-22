import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * POST /api/profile/complete
 *
 * P0: Atomic profile completion endpoint.
 * Proxies to backend which:
 * 1. Persists first_name, last_name
 * 2. Creates organization if missing
 * 3. Links user to organization
 * 4. Marks profile_completed = true
 *
 * FAIL-CLOSED: Returns explicit error on any failure.
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401 },
      );
    }

    const token = await getToken();
    const body = await request.json();

    // Validate required fields
    const { firstName, lastName } = body;
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "First name and last name are required",
          request_id: requestId,
        },
        { status: 400 },
      );
    }

    const resp = await fetch(`${BACKEND_URL}/api/profile/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      }),
    });

    const responseText = await resp.text();

    if (!responseText || responseText.trim() === "") {
      console.error("Backend /api/profile/complete returned empty response");
      return NextResponse.json(
        {
          ok: false,
          error: "Empty response from backend",
          request_id: requestId,
        },
        { status: 502 },
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Backend /api/profile/complete returned invalid JSON:",
        responseText.slice(0, 200),
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON from backend",
          request_id: requestId,
        },
        { status: 502 },
      );
    }

    if (!resp.ok) {
      console.error("Backend /api/profile/complete error:", resp.status, data);
      const detail = data.detail as
        | Record<string, unknown>
        | string
        | undefined;
      return NextResponse.json(
        {
          ok: false,
          error:
            (typeof detail === "object" ? detail?.message : detail) ||
            data.error ||
            "Profile completion failed",
          request_id: data.request_id || requestId,
        },
        { status: resp.status },
      );
    }

    // Return canonical response
    return NextResponse.json({
      ok: true,
      profileCompleted: Boolean(data.profileCompleted),
      orgId: data.orgId,
      userId: data.userId,
      message: data.message,
      request_id: data.request_id || requestId,
    });
  } catch (err: unknown) {
    console.error("Profile completion error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Profile completion failed: " + message,
        request_id: requestId,
      },
      { status: 500 },
    );
  }
}
