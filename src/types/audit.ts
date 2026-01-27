/**
 * Audit Export Types
 *
 * Phase 9B: Audit Export v2 UI types
 * Centralized type definitions for audit export functionality.
 */

// =============================================================================
// SECTION TOGGLES
// =============================================================================

/**
 * Section toggle configuration for audit export v2.
 * Controls which data sections to include in the export bundle.
 */
export interface AuditExportV2Sections {
  /** Include bank statements in the export */
  includeStatements: boolean;
  /** Include asset snapshots in the export */
  includeAssets: boolean;
  /** Include liabilities data in the export */
  includeLiabilities: boolean;
}

// =============================================================================
// UI STATE
// =============================================================================

/**
 * UI state enum for the audit export v2 panel.
 * Follows Phase 9B requirements: idle → building → ready | error
 */
export type AuditExportV2State = "idle" | "building" | "ready" | "error";

// =============================================================================
// API RESPONSES
// =============================================================================

/**
 * Response from POST /api/exports/audit-package-v2
 * Generation endpoint response.
 */
export interface AuditExportV2GenerateResponse {
  ok: boolean;
  export_id?: string;
  generated_at?: string;
  sections?: string[];
  download_url?: string;
  error?: string;
  request_id: string;
}

/**
 * Metadata returned after successful export generation.
 */
export interface AuditExportV2Result {
  exportId: string;
  generatedAt: string;
  sections: string[];
}

/**
 * Download result metadata.
 */
export interface AuditExportV2DownloadResult {
  ok: boolean;
  filename: string;
  request_id: string;
}
