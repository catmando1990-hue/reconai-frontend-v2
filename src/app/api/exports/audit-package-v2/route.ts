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
 * POST /api/exports/audit-package-v2
 *
 * Triggers generation of an Audit Export v2 bundle.
 * Includes statements, asset snapshots, and liabilities based on section toggles.
 *
 * Request body:
 * - include_statements: boolean (default true)
 * - include_assets: boolean (default true)
 * - include_liabilities: boolean (default true)
 *
 * Returns:
 * - export_id: Unique identifier for the export
 * - generated_at: Timestamp of generation
 * - sections: Array of included section names
 * - request_id: Request tracking ID
 *
 * Phase 9B: Manual trigger only, no polling, admin-only.
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

  // Parse request body for section toggles
  let includeStatements = true;
  let includeAssets = true;
  let includeLiabilities = true;

  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.include_statements === "boolean") {
      includeStatements = body.include_statements;
    }
    if (typeof body.include_assets === "boolean") {
      includeAssets = body.include_assets;
    }
    if (typeof body.include_liabilities === "boolean") {
      includeLiabilities = body.include_liabilities;
    }
  } catch {
    // Use defaults if body parsing fails
  }

  // Build sections array
  const sections: string[] = [];
  if (includeStatements) sections.push("statements");
  if (includeAssets) sections.push("assets");
  if (includeLiabilities) sections.push("liabilities");

  if (sections.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "At least one section must be selected",
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
    const res = await fetch(`${backendUrl}/api/audit-exports/v2`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        organization_id: organizationId || userId,
        include_statements: includeStatements,
        include_assets: includeAssets,
        include_liabilities: includeLiabilities,
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout for ZIP generation
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Audit Export v2] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to generate export: ${res.status}`;
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

    // Pass through govcon_mapping if present (Phase 10B)
    // Silently omit if not present or malformed
    const govconMapping = backendData.govcon_mapping;
    const hasGovconMapping =
      govconMapping !== undefined &&
      govconMapping !== null &&
      govconMapping !== false;

    // Pass through integrity metadata if present (Phase 11B)
    // Silently omit if not present
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
        sections: sections,
        download_url: backendData.download_url || null,
        ...(hasGovconMapping ? { govcon_mapping: govconMapping } : {}),
        ...(hasIntegrity ? { integrity } : {}),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Audit Export v2] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to generate export: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
