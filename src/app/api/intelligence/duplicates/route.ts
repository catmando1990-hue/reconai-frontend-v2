import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/intelligence/duplicates
 *
 * Returns potential duplicate transactions.
 * Calls the /api/intelligence/analyze endpoint and extracts duplicates.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const baseUrl = new URL(req.url).origin;

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { duplicates: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    // Call the analyze endpoint
    const resp = await fetch(`${baseUrl}/api/intelligence/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { duplicates: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    return NextResponse.json(
      {
        duplicates: data.duplicates || [],
        request_id: requestId,
        _analyzed: data._analyzed,
        _timestamp: data._timestamp,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Duplicates] Error:", err);
    return NextResponse.json(
      { duplicates: [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
