import { NextResponse } from "next/server";
import { auth} from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/plaid/statements/list
 *
 * Proxies to backend GET /api/plaid/statements/list
 * Returns list of available Plaid statements for the authenticated user.
 *
 * Phase 8A: Statements Evidence UI
 * - Manual fetch only (no polling)
 * - RBAC enforced at component level (admin/org:admin)
 * - Returns request_id for audit provenance
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Backend not configured",
          statements: [],
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(`${backendUrl}/api/plaid/statements/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Plaid statements list] Backend error (${res.status}):`,
        errorText,
      );

      return NextResponse.json(
        {
          ok: false,
          error: `Failed to fetch statements: ${res.status}`,
          statements: [],
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();

    // Unwrap backend response envelope if present
    const backendData = data.data || data;
    const statements = backendData.statements || [];

    return NextResponse.json(
      {
        ok: true,
        statements,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Plaid statements list] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to fetch statements: ${message}`,
        statements: [],
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
