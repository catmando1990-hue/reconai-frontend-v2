import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function GET(request: NextRequest) {
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
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: data.detail || data.error || "Failed to fetch audit log",
          request_id: requestId,
        },
        { status: resp.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();
    return NextResponse.json(
      { ...data, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("Audit fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch audit log: " + message,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
