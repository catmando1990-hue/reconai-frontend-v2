import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend - check both env vars for compatibility
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}/api/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      console.error("Backend /api/me error:", resp.status, data);
      return NextResponse.json(
        {
          error:
            data.detail?.message ||
            data.detail ||
            data.error ||
            "Failed to fetch profile",
          backend_status: resp.status,
          backend_error: data,
        },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    // Transform backend response to match frontend ProfileData interface
    const profile = {
      id: data.user?.id,
      name:
        [data.user?.first_name, data.user?.last_name]
          .filter(Boolean)
          .join(" ") || undefined,
      organizationName: data.org?.name,
      orgId: data.org?.id,
      role: data.permissions?.role,
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
      { error: "Failed to fetch profile: " + message },
      { status: 500 },
    );
  }
}
