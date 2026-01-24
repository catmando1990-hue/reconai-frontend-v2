import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

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

    const resp = await fetch(`${BACKEND_URL}/api/intelligence/status`, {
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
          error:
            data.detail || data.error || "Failed to fetch intelligence status",
          request_id: requestId,
        },
        { status: resp.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    const intelStatus = {
      lastRun: data.lastRun || undefined,
      cache: data.cache || undefined,
      request_id: requestId,
    };

    return NextResponse.json(intelStatus, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err: unknown) {
    console.error("Intelligence status fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch intelligence status: " + message,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
