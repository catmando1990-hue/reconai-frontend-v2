import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/plaid/statements/download
 *
 * Proxies to backend GET /api/plaid/statements/download
 * Downloads a specific Plaid statement PDF and returns:
 * - The PDF file as attachment
 * - SHA-256 hash in x-content-hash header
 *
 * Query params:
 * - statement_id: The Plaid statement ID to download
 *
 * Phase 8A: Statements Evidence UI
 * - Manual download only (no caching, no auto-preview)
 * - Returns request_id for audit provenance
 * - Returns SHA-256 hash for evidence integrity
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const statementId = request.nextUrl.searchParams.get("statement_id");

    if (!statementId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing statement_id parameter",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
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
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    const url = new URL(`${backendUrl}/api/plaid/statements/download`);
    url.searchParams.set("statement_id", statementId);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(60000), // 60s timeout for large PDFs
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Plaid statement download] Backend error (${res.status}):`,
        errorText,
      );

      return NextResponse.json(
        {
          ok: false,
          error: `Failed to download statement: ${res.status}`,
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    // Get the PDF content
    const pdfBuffer = await res.arrayBuffer();

    // Calculate SHA-256 hash of the PDF content
    const hashBuffer = await crypto.subtle.digest("SHA-256", pdfBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256Hash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Get filename from backend or generate default
    const contentDisposition = res.headers.get("content-disposition");
    let filename = `statement_${statementId}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) {
        filename = match[1];
      }
    }

    // Return PDF with hash header
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "x-request-id": requestId,
        "x-content-hash": sha256Hash,
        "x-hash-algorithm": "SHA-256",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[Plaid statement download] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to download statement: ${message}`,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
