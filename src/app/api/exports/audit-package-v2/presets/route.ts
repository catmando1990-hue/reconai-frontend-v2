import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * Assert that the current user has admin role.
 * Returns a NextResponse error if not admin, null otherwise.
 */
async function assertAdmin(requestId: string) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Not authenticated",
        request_id: requestId,
      },
      { status: 401, headers: { "x-request-id": requestId } },
    );
  }

  // Check session claims first
  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (sessionRole === "admin" || sessionRole === "org:admin") {
    return null;
  }

  // Fallback: fetch user directly
  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (userRole === "admin" || userRole === "org:admin") {
    return null;
  }

  return NextResponse.json(
    {
      error: "Forbidden",
      message: "Admin access required",
      request_id: requestId,
    },
    { status: 403, headers: { "x-request-id": requestId } },
  );
}

/**
 * POST /api/exports/audit-package-v2/presets
 *
 * Triggers generation of a GovCon packet preset bundle.
 * Phase 12B: Manual trigger only, no polling, admin-only.
 *
 * Request body:
 * - preset: string (e.g. "sf_1408_pre_award")
 * - options: { statement_period_from, statement_period_to, asset_snapshot }
 *
 * Returns:
 * - export_id, generated_at, preset, sections, request_id
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const forbidden = await assertAdmin(requestId);
  if (forbidden) return forbidden;

  const { getToken, orgId, userId } = await auth();
  const token = await getToken();

  // Get organization ID from Clerk org context or user metadata
  let organizationId = orgId;
  if (!organizationId) {
    const user = await currentUser();
    organizationId = (
      user?.publicMetadata as Record<string, unknown> | undefined
    )?.organization_id as string | undefined;
  }

  // Parse request body
  let body: Record<string, unknown> = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // Use empty body
  }

  const preset = body.preset;
  if (typeof preset !== "string" || !preset) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing or invalid preset identifier",
        request_id: requestId,
      },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const options = body.options;
  if (!options || typeof options !== "object") {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing preset options",
        request_id: requestId,
      },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendUrl();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Backend not configured",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const res = await fetch(`${backendUrl}/api/audit-exports/v2/presets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        organization_id: organizationId || userId,
        preset,
        options,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[GovCon Preset] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to generate preset packet: ${res.status}`;
      try {
        const errData = JSON.parse(errorText);
        errorMsg =
          errData.error || errData.detail || errData.message || errorMsg;
      } catch {
        // Keep default error message
      }

      return NextResponse.json(
        {
          ok: false,
          error: errorMsg,
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();
    const backendData = data.data || data;

    // Pass through govcon_mapping if present
    const govconMapping = backendData.govcon_mapping;
    const hasGovconMapping =
      govconMapping !== undefined &&
      govconMapping !== null &&
      govconMapping !== false;

    // Pass through integrity metadata if present
    const integrity = backendData.integrity;
    const hasIntegrity =
      integrity !== undefined &&
      integrity !== null &&
      typeof integrity === "object";

    return NextResponse.json(
      {
        ok: true,
        export_id: backendData.export_id,
        generated_at: backendData.generated_at || new Date().toISOString(),
        preset: backendData.preset || preset,
        sections: backendData.sections || [],
        download_url: backendData.download_url || null,
        ...(hasGovconMapping ? { govcon_mapping: govconMapping } : {}),
        ...(hasIntegrity ? { integrity } : {}),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Preset] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to generate preset packet: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
