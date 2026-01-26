/**
 * Admin Exports API Contract Types
 *
 * Types for the internal admin export visibility and provenance UI.
 * These endpoints are admin-only and read-only.
 */

/**
 * Export record from s3_exports table
 */
export interface ExportRecord {
  export_id: string;
  organization_id: string;
  export_type: string;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  file_size_bytes: number | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  created_by_user_id: string | null;
  error_message: string | null;
}

/**
 * Response from GET /internal/exports/stats
 */
export interface ExportsListResponse {
  request_id: string;
  exports: ExportRecord[];
  total_count: number;
  page: number;
  page_size: number;
}

/**
 * Evidence link record from export_evidence_links table
 */
export interface EvidenceLink {
  evidence_id: string;
  evidence_type: string;
  linked_at: string;
  audit_event_id: string | null;
}

/**
 * Response from GET /internal/exports/{export_id}/provenance
 */
export interface ExportProvenanceResponse {
  request_id: string;
  export_id: string;
  export_type: string;
  status: string;
  created_at: string;
  evidence_links: EvidenceLink[];
  total_evidence_count: number;
}

/**
 * Status variant mapping for exports
 */
export type ExportStatusVariant = "ok" | "warn" | "muted" | "unknown";
