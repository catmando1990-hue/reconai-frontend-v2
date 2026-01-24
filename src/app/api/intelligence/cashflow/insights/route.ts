import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/intelligence/cashflow/insights
 *
 * Returns cashflow insights and trend analysis.
 * Calls the /api/intelligence/analyze endpoint and extracts cashflow.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const baseUrl = new URL(req.url).origin;

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { trend: null, confidence: 0, explanation: "Not authenticated", request_id: requestId },
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
        { trend: null, confidence: 0, explanation: "Analysis unavailable", request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    if (!data.cashflow) {
      return NextResponse.json(
        {
          trend: null,
          confidence: 0,
          explanation: data._reason || "No cashflow data",
          request_id: requestId,
          _analyzed: data._analyzed,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      {
        trend: data.cashflow.trend,
        forecast: data.cashflow.forecast,
        confidence: data.cashflow.confidence,
        explanation: data.cashflow.explanation,
        request_id: requestId,
        _analyzed: data._analyzed,
        _timestamp: data._timestamp,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Cashflow insights] Error:", err);
    return NextResponse.json(
      { trend: null, confidence: 0, explanation: "Request failed", request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
