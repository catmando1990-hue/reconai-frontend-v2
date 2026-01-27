/**
 * Audit Export Presets API Wrapper
 *
 * Phase 12B: Thin API wrapper for GovCon packet preset functionality.
 * - POST /api/exports/audit-package-v2/presets (generate)
 * - Downloads reuse existing /api/exports/audit-package-v2/download
 *
 * Requirements:
 * - Handles streaming response
 * - Extracts deterministic filename from headers
 * - Returns { ok, request_id, filename }
 * - No retries
 * - No caching
 */

import type {
  GovConPresetRequest,
  GovConPresetGenerateResponse,
  GovConPresetResult,
} from "@/types/audit";

// =============================================================================
// GENERATE PRESET PACKET
// =============================================================================

/**
 * Generate a GovCon preset packet.
 *
 * @param request - Preset identifier and options
 * @returns Generation result with export_id, generated_at, preset, and sections
 * @throws Error with message and request_id on failure
 */
export async function generatePresetPacket(
  request: GovConPresetRequest,
): Promise<{ ok: true; result: GovConPresetResult; request_id: string }> {
  const res = await fetch("/api/exports/audit-package-v2/presets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preset: request.preset,
      options: request.options,
    }),
  });

  const requestId = res.headers.get("x-request-id") || "";
  const json: GovConPresetGenerateResponse = await res.json();

  if (!json.ok || !res.ok) {
    const error = new Error(json.error || `Failed to generate packet (${res.status})`);
    (error as Error & { request_id: string }).request_id = requestId;
    throw error;
  }

  // Check for govcon_mapping presence
  const hasGovconMapping = !!(
    json.govcon_mapping &&
    typeof json.govcon_mapping === "object" &&
    json.govcon_mapping.standard
  );

  // Pass through integrity metadata if present
  const integrity =
    json.integrity &&
    typeof json.integrity === "object" &&
    (json.integrity.hash_chain || json.integrity.signature)
      ? json.integrity
      : undefined;

  return {
    ok: true,
    result: {
      exportId: json.export_id || "",
      generatedAt: json.generated_at || new Date().toISOString(),
      preset: json.preset || request.preset,
      sections: json.sections || [],
      hasGovconMapping,
      ...(integrity ? { integrity } : {}),
    },
    request_id: requestId,
  };
}

// =============================================================================
// DOWNLOAD PRESET PACKET
// =============================================================================

/**
 * Download a generated preset packet ZIP bundle.
 * Handles streaming response and triggers browser download.
 *
 * Reuses the existing audit-package-v2 download endpoint.
 *
 * @param exportId - The export_id from the generation step
 * @returns Download metadata with ok, filename, and request_id
 * @throws Error with message and request_id on failure
 */
export async function downloadPresetPacket(
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
  let filename = `govcon-preset-${exportId}.zip`;
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
