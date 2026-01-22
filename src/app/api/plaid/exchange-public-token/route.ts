import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * ============================================================================
 * PLAID TOKEN EXCHANGE - FAIL-CLOSED IMPLEMENTATION
 * ============================================================================
 *
 * This route proxies to the v2 Plaid API endpoint on the backend.
 *
 * CRITICAL: We must verify response is JSON before parsing.
 * If backend returns HTML (410/404/error page), we fail gracefully.
 *
 * v1 endpoints (/exchange-public-token) are DEPRECATED and return 410 Gone.
 * v2 endpoint is: /api/plaid/exchange-public-token
 *
 * ============================================================================
 */

// Proxy to Render backend which has Plaid credentials configured
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

// v2 Plaid API endpoint (NOT the deprecated v1 /exchange-public-token)
const EXCHANGE_ENDPOINT = "/api/plaid/exchange-public-token";

export async function POST(req: Request) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const public_token = body?.public_token;

    if (!public_token || typeof public_token !== "string") {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 },
      );
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}${EXCHANGE_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ user_id: userId, public_token }),
    });

    // ========================================================================
    // FAIL-CLOSED: Verify response is JSON before parsing
    // ========================================================================
    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!isJson) {
      // Backend returned non-JSON (HTML error page, 410 Gone, etc.)
      const textBody = await resp.text().catch(() => "[unreadable]");
      console.error(
        `[FAIL-CLOSED] Plaid exchange received non-JSON response. ` +
          `Status: ${resp.status}, Content-Type: ${contentType}, ` +
          `Body preview: ${textBody.slice(0, 200)}`,
      );
      return NextResponse.json(
        {
          error: "Bank connection failed. Please retry.",
          detail: "Plaid exchange failed — non-JSON response from backend",
        },
        { status: 502 },
      );
    }

    // Safe to parse as JSON
    const data = await resp.json();

    if (!resp.ok) {
      // Backend returned JSON error response
      return NextResponse.json(
        {
          error: data.detail || data.error || "Failed to exchange token",
        },
        { status: resp.status },
      );
    }

    // Return minimal metadata (never expose access_token to client)
    return NextResponse.json({ item_id: data.item_id });
  } catch (err: unknown) {
    console.error("Plaid exchange token error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Bank connection failed. Please retry.", detail: message },
      { status: 500 },
    );
  }
}
