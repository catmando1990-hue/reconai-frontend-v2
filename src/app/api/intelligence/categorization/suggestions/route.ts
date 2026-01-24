import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/intelligence/categorization/suggestions
 *
 * Returns AI-suggested categories for transactions.
 * Calls the /api/intelligence/analyze endpoint and extracts suggestions.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const baseUrl = new URL(req.url).origin;

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { suggestions: [], request_id: requestId },
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
        { suggestions: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    return NextResponse.json(
      {
        suggestions: data.suggestions || [],
        request_id: requestId,
        _analyzed: data._analyzed,
        _timestamp: data._timestamp,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Categorization suggestions] Error:", err);
    return NextResponse.json(
      { suggestions: [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
