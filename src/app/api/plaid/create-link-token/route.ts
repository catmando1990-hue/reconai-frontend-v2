import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

/**
 * ============================================================================
 * PLAID CREATE LINK TOKEN - FAIL-CLOSED IMPLEMENTATION
 * ============================================================================
 *
 * This route proxies to the v2 Plaid API endpoint on the backend.
 *
 * CRITICAL: We must verify response is JSON before parsing.
 * If backend returns HTML (410/404/error page), we fail gracefully.
 *
 * v1 endpoints (/link-token) are DEPRECATED and return 410 Gone.
 * v2 endpoint is: /api/plaid/create-link-token
 *
 * ============================================================================
 */

// Proxy to Render backend which has Plaid credentials configured
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

// v2 Plaid API endpoint (NOT the deprecated v1 /link-token)
const CREATE_LINK_TOKEN_ENDPOINT = "/api/plaid/create-link-token";

export async function POST() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    // Build OAuth redirect URI from request headers
    // IMPORTANT: This URI must EXACTLY match what's configured in the Plaid Dashboard
    const headersList = await headers();
    const host = headersList.get("host") || "www.reconaitechnology.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    // Use /plaid/oauth path to match Plaid Dashboard configuration
    const redirectUri = `${protocol}://${host}/plaid/oauth`;

    const resp = await fetch(`${BACKEND_URL}${CREATE_LINK_TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        user_id: userId,
        redirect_uri: redirectUri,
      }),
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
        `[FAIL-CLOSED] Plaid create-link-token received non-JSON response. ` +
          `Status: ${resp.status}, Content-Type: ${contentType}, ` +
          `Body preview: ${textBody.slice(0, 200)}`,
      );
      return NextResponse.json(
        {
          error: "Bank connection failed. Please retry.",
          detail:
            "Plaid link token creation failed — non-JSON response from backend",
        },
        { status: 502 },
      );
    }

    // Safe to parse as JSON
    const data = await resp.json();

    if (!resp.ok) {
      // Backend returned JSON error response
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to create link token" },
        { status: resp.status },
      );
    }

    return NextResponse.json({
      link_token: data.link_token,
      expiration: data.expiration,
    });
  } catch (err: unknown) {
    console.error("Plaid link token error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Bank connection failed. Please retry.", detail: message },
      { status: 500 },
    );
  }
}
