import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

const ENDPOINT = "/api/plaid/create-link-token";

export async function POST(req: Request) {
  // Generate request ID for provenance tracking
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId = incomingRequestId || crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();
    const headersList = await headers();
    const host = headersList.get("host") || "www.reconaitechnology.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/plaid/oauth`;

    // Log token presence for debugging (never log actual token)
    console.log(
      `[Plaid create-link-token] userId=${userId}, hasToken=${!!token}, requestId=${requestId}`,
    );

    const backendUrl = getBackendUrl();
    const resp = await fetch(`${backendUrl}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        redirect_uri: redirectUri,
      }),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const rawText = await resp.text();
      console.error(
        `[Plaid create-link-token] Non-JSON response (${resp.status}): ${rawText.slice(0, 500)}`,
      );
      return NextResponse.json(
        {
          error: "Bank connection failed. Please retry.",
          code: "NON_JSON_RESPONSE",
          request_id: requestId,
        },
        { status: 502, headers: { "x-request-id": requestId } },
      );
    }

    const data = await resp.json();

    if (!resp.ok) {
      // Log full error details for debugging
      console.error(
        `[Plaid create-link-token] Backend error (${resp.status}):`,
        JSON.stringify(data, null, 2),
      );
      return NextResponse.json(
        {
          error:
            data.detail?.message ||
            data.detail ||
            data.error ||
            "Failed to create link token",
          code: data.detail?.error_code || data.detail?.error || "UPSTREAM_ERROR",
          request_id: requestId,
        },
        { status: resp.status, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      {
        link_token: data.link_token,
        expiration: data.expiration,
        request_id: requestId,
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid create-link-token] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Bank connection failed. Please retry.",
        code: "INTERNAL_ERROR",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
