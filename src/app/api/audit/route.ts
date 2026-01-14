import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    // Forward query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "100";
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const params = new URLSearchParams({ limit });
    if (entity) params.append("entity", entity);
    if (action) params.append("action", action);

    const resp = await fetch(`${BACKEND_URL}/api/audit?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to fetch audit log" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Audit fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch audit log: " + message },
      { status: 500 },
    );
  }
}
