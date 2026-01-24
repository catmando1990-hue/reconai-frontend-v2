import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * GET /api/documents/[id]/audit
 * Proxies to backend /api/documents/{id}/audit with x-request-id header
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          document_id: id,
          organization_id: null,
          current_status: null,
          audit_trail: [],
          event_count: 0,
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

    const res = await fetch(`${API_URL}/api/documents/${id}/audit`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error("[Documents Audit] Backend error:", res.status, res.statusText);
      return NextResponse.json(
        {
          document_id: id,
          organization_id: null,
          current_status: null,
          audit_trail: [],
          event_count: 0,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();

    const response = {
      ...data,
      request_id: requestId,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Documents Audit] Fetch error:", err);
    return NextResponse.json(
      {
        document_id: id,
        organization_id: null,
        current_status: null,
        audit_trail: [],
        event_count: 0,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
