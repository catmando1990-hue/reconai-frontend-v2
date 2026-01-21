"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { apiFetch } from "@/lib/api";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
} from "lucide-react";

/**
 * Document type from backend API
 * Matches /api/documents endpoint response
 */
type Document = {
  id: string;
  organization_id: string;
  user_id: string;
  filename: string;
  content_type: string | null;
  file_size_bytes: number | null;
  source: string;
  source_endpoint: string | null;
  status: "uploaded" | "validated" | "processing" | "completed" | "failed";
  failure_reason: string | null;
  created_at: string;
  validated_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
};

type DocumentsResponse = {
  organization_id: string;
  documents: Document[];
  count: number;
};

/**
 * Audit entry from backend API
 * Matches /api/documents/{id}/audit endpoint response
 */
type AuditEntry = {
  id: string;
  document_id: string;
  organization_id: string;
  action: string;
  actor_id: string;
  old_status: string | null;
  new_status: string | null;
  details: Record<string, unknown> | null;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type AuditResponse = {
  document_id: string;
  organization_id: string;
  current_status: string;
  audit_trail: AuditEntry[];
  event_count: number;
};

/**
 * Status badge colors - direct mapping from backend status
 */
function getStatusStyle(status: Document["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "processing":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "validated":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "uploaded":
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function getStatusIcon(status: Document["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "failed":
      return <AlertCircle className="h-3.5 w-3.5" />;
    case "processing":
      return <Clock className="h-3.5 w-3.5 animate-pulse" />;
    case "validated":
    case "uploaded":
    default:
      return <Upload className="h-3.5 w-3.5" />;
  }
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case "upload":
      return "Upload";
    case "receipt":
      return "Receipt";
    case "api":
      return "API";
    case "migration":
      return "Migration";
    default:
      return source;
  }
}

/**
 * Get display label for audit action
 */
function getActionLabel(action: string): string {
  switch (action) {
    case "document_uploaded":
      return "Uploaded";
    case "document_validated":
      return "Validated";
    case "document_processing_started":
      return "Processing Started";
    case "document_completed":
      return "Completed";
    case "document_failed":
      return "Failed";
    case "document_transaction_created":
      return "Transactions Created";
    default:
      return action.replace(/_/g, " ");
  }
}

/**
 * Get color class for audit action
 */
function getActionStyle(action: string): string {
  if (action.includes("failed")) {
    return "text-red-400 bg-red-500/10";
  }
  if (action.includes("completed")) {
    return "text-emerald-400 bg-emerald-500/10";
  }
  if (action.includes("processing")) {
    return "text-blue-400 bg-blue-500/10";
  }
  if (action.includes("validated")) {
    return "text-yellow-400 bg-yellow-500/10";
  }
  return "text-zinc-400 bg-zinc-500/10";
}

/**
 * DocumentAuditTrail - Expandable audit trail for a document
 * Fetches audit data on-demand when expanded (single fetch, no polling)
 */
function DocumentAuditTrail({ documentId }: { documentId: string }) {
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await apiFetch<AuditResponse>(
          `/api/documents/${documentId}/audit`,
        );
        if (alive) {
          setAuditData(data);
        }
      } catch (err) {
        if (alive) {
          const msg =
            err instanceof Error ? err.message : "Failed to load audit trail";
          setError(msg);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="px-4 py-3 bg-card/20">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-card/30 rounded w-1/3" />
          <div className="h-4 bg-card/30 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 bg-card/20">
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!auditData || auditData.audit_trail.length === 0) {
    return (
      <div className="px-4 py-3 bg-card/20">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Shield className="h-3.5 w-3.5" />
          <span>No audit events recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/20 border-t border-border/30">
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border/20">
        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Audit Trail
        </span>
        <span className="text-xs text-muted-foreground/60">
          ({auditData.event_count} events)
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
          Read-Only
        </span>
      </div>
      <div className="divide-y divide-border/20">
        {auditData.audit_trail.map((entry) => (
          <div
            key={entry.id}
            className="px-4 py-2 flex items-start gap-3 text-xs"
          >
            {/* Timestamp */}
            <div className="w-36 flex-shrink-0 text-muted-foreground font-mono">
              {formatTimestamp(entry.created_at)}
            </div>

            {/* Action badge */}
            <div className="w-32 flex-shrink-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getActionStyle(entry.action)}`}
              >
                {getActionLabel(entry.action)}
              </span>
            </div>

            {/* Actor */}
            <div className="w-28 flex-shrink-0 flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">
                {entry.actor_id === "system" ? "System" : entry.actor_id}
              </span>
            </div>

            {/* Status transition */}
            {entry.old_status && entry.new_status && (
              <div className="text-muted-foreground/70">
                {entry.old_status} → {entry.new_status}
              </div>
            )}

            {/* Failure reason (if present) */}
            {entry.failure_reason && (
              <div className="text-red-400 truncate max-w-[200px]">
                {entry.failure_reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DocumentRow - Table row with expandable audit trail
 */
function DocumentRow({ doc }: { doc: Document }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <>
      <tr
        className="border-b border-border/30 hover:bg-card/30 cursor-pointer"
        onClick={toggleExpanded}
      >
        <td className="px-3 py-3 w-8">
          <button
            className="p-1 hover:bg-card/50 rounded transition-colors"
            aria-label={
              expanded ? "Collapse audit trail" : "Expand audit trail"
            }
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate max-w-[200px]">
                {doc.filename}
              </div>
              {doc.content_type && (
                <div className="text-xs text-muted-foreground truncate">
                  {doc.content_type}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border w-fit ${getStatusStyle(doc.status)}`}
            >
              {getStatusIcon(doc.status)}
              {doc.status}
            </span>
            {doc.status === "failed" && doc.failure_reason && (
              <span className="text-xs text-red-400 max-w-[200px] truncate">
                {doc.failure_reason}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          <span className="text-muted-foreground">
            {getSourceLabel(doc.source)}
          </span>
        </td>
        <td className="px-3 py-3">
          <span className="text-muted-foreground font-mono text-xs">
            {formatBytes(doc.file_size_bytes)}
          </span>
        </td>
        <td className="px-3 py-3">
          <span className="text-muted-foreground text-xs">
            {formatDate(doc.created_at)}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <DocumentAuditTrail documentId={doc.id} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await apiFetch<DocumentsResponse>("/api/documents");
        if (alive) {
          setDocuments(data.documents || []);
        }
      } catch (err) {
        if (alive) {
          const msg =
            err instanceof Error ? err.message : "Failed to load documents";
          setError(msg);
          setDocuments([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <RouteShell
      title="Documents"
      subtitle="All uploaded documents and their processing status."
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-card/20 rounded" />
          <div className="h-12 bg-card/20 rounded" />
          <div className="h-12 bg-card/20 rounded" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading documents</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-500/10 mb-4">
            <FileText className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Documents</h3>
          <p className="text-muted-foreground text-sm">
            No documents have been uploaded yet. Upload a CSV, PDF, or receipt
            to see it tracked here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2 font-medium w-8"></th>
                <th className="px-3 py-2 font-medium">Filename</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RouteShell>
  );
}
