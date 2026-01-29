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
 * GET /api/exports/audit-package-v2/download
 *
 * Downloads a generated Audit Export v2 ZIP bundle.
 *
 * Query params:
 * - export_id: The export identifier from the generation step
 *
 * Returns:
 * - ZIP file stream with Content-Disposition header
 * - x-request-id header for audit provenance
 *
 * Phase 9B: Manual download only, no auto-download, admin-only.
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const forbidden = await assertAdmin(requestId);
  if (forbidden) return forbidden;

  const { getToken } = await auth();
  const token = await getToken();

  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get("export_id");

  if (!exportId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing export_id parameter",
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
    const res = await fetch(
      `${backendUrl}/api/audit-exports/v2/download?export_id=${encodeURIComponent(exportId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-request-id": requestId,
        },
        signal: AbortSignal.timeout(300000), // 5 minute timeout for large downloads
      },
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Audit Export v2 Download] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to download export: ${res.status}`;
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

    // Get filename from content-disposition header
    const contentDisposition = res.headers.get("content-disposition");
    let filename = `audit-export-v2-${exportId}.zip`;
    if (contentDisposition) {
      // Safely extract filename, sanitize to prevent path traversal
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) {
        // Remove any path components and dangerous characters
        const sanitized = match[1].replace(/[/\\:*?"<>|]/g, "_");
        if (sanitized.length > 0 && sanitized.length < 256) {
          filename = sanitized;
        }
      }
    }

    // Stream the response body
    const blob = await res.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": blob.size.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "x-request-id": requestId,
      },
    });
  } catch (err) {
    console.error("[Audit Export v2 Download] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to download export: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
