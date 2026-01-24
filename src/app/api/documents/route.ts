import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * GET /api/documents
 * Proxies to backend /api/documents with x-request-id header
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          organization_id: null,
          documents: [],
          count: 0,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-request-id": requestId,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api/documents`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error("[Documents] Backend error:", res.status, res.statusText);
      return NextResponse.json(
        {
          organization_id: null,
          documents: [],
          count: 0,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();

    // Ensure response has request_id
    const response = {
      ...data,
      request_id: requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Documents] Fetch error:", err);
    return NextResponse.json(
      {
        organization_id: null,
        documents: [],
        count: 0,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
