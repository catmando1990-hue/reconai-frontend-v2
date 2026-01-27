/**
 * Audit Export v2 API Wrapper
 *
 * Phase 9B: Thin API wrapper for audit export v2 functionality.
 * - POST /api/exports/audit-package-v2 (generate)
 * - GET /api/exports/audit-package-v2/download (download)
 *
 * Requirements:
 * - Handles streaming response
 * - Extracts filename from headers
 * - Returns { ok, request_id, filename } metadata
 * - No retries
 */

import type {
  AuditExportV2Sections,
  AuditExportV2GenerateResponse,
  AuditExportV2Result,
} from "@/types/audit";

// =============================================================================
// GENERATE EXPORT
// =============================================================================

/**
 * Generate an audit export v2 bundle.
 *
 * @param sections - Which sections to include in the export
 * @returns Generation result with export_id, generated_at, and sections
 * @throws Error with message and request_id on failure
 */
export async function generateAuditExportV2(
  sections: AuditExportV2Sections,
): Promise<{ ok: true; result: AuditExportV2Result; request_id: string }> {
  const res = await fetch("/api/exports/audit-package-v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      include_statements: sections.includeStatements,
      include_assets: sections.includeAssets,
      include_liabilities: sections.includeLiabilities,
    }),
  });

  const requestId = res.headers.get("x-request-id") || "";
  const json: AuditExportV2GenerateResponse = await res.json();

  if (!json.ok || !res.ok) {
    const error = new Error(json.error || `Failed to generate export (${res.status})`);
    (error as Error & { request_id: string }).request_id = requestId;
    throw error;
  }

  return {
    ok: true,
    result: {
      exportId: json.export_id || "",
      generatedAt: json.generated_at || new Date().toISOString(),
      sections: json.sections || [],
    },
    request_id: requestId,
  };
}

// =============================================================================
// DOWNLOAD EXPORT
// =============================================================================

/**
 * Download an audit export v2 ZIP bundle.
 * Handles streaming response and triggers browser download.
 *
 * @param exportId - The export_id from the generation step
 * @returns Download metadata with ok, filename, and request_id
 * @throws Error with message and request_id on failure
 */
export async function downloadAuditExportV2(
  exportId: string,
): Promise<{ ok: true; filename: string; request_id: string }> {
  const res = await fetch(
    `/api/exports/audit-package-v2/download?export_id=${encodeURIComponent(exportId)}`,
  );

  const requestId = res.headers.get("x-request-id") || "";

  if (!res.ok) {
    let errorMsg = `Download failed (${res.status})`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // Response may not be JSON
    }
    const error = new Error(errorMsg);
    (error as Error & { request_id: string }).request_id = requestId;
    throw error;
  }

  // Extract filename from Content-Disposition header
  const contentDisposition = res.headers.get("content-disposition");
  let filename = `audit-export-v2-${exportId}.zip`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (match) {
      // Sanitize filename to prevent path traversal
      const sanitized = match[1]
        .replace(/[/\\:*?"<>|]/g, "_")
        .replace(/\.\./g, "_")
        .slice(0, 255);
      if (sanitized.length > 0) {
        filename = sanitized;
      }
    }
  }

  // Stream response to blob and trigger download
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  return {
    ok: true,
    filename,
    request_id: requestId,
  };
}
