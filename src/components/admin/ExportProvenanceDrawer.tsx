"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Copy, Link2, FileText, Info, Clock, Hash } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";
import type {
  ExportProvenanceResponse,
  EvidenceLink,
} from "@/types/admin-exports";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

interface ExportProvenanceDrawerProps {
  open: boolean;
  onClose: () => void;
  exportId: string | null;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date string for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * ExportProvenanceDrawer — Read-only drawer displaying provenance
 * (evidence links) for a specific export. No mutation actions.
 */
export function ExportProvenanceDrawer({
  open,
  onClose,
  exportId,
}: ExportProvenanceDrawerProps) {
  const [provenance, setProvenance] = useState<ExportProvenanceResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch provenance data when drawer opens
  useEffect(() => {
    if (!open || !exportId) {
      setProvenance(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchProvenance() {
      setLoading(true);
      setError(null);

      try {
        const data = await auditedFetch<ExportProvenanceResponse>(
          `/api/admin/exports/${exportId}/provenance`,
          { skipBodyValidation: true },
        );

        if (!cancelled) {
          setProvenance(data);
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof HttpError) {
          if (err.status === 401) {
            setError("Not authenticated. Please sign in.");
          } else if (err.status === 403) {
            setError("Access denied. Admin only.");
          } else if (err.status === 404) {
            setError("Export not found.");
          } else {
            const body = err.body as { error?: string } | undefined;
            setError(body?.error || `Error: ${err.status}`);
          }
        } else {
          setError(
            `Failed to fetch: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProvenance();

    return () => {
      cancelled = true;
    };
  }, [open, exportId]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleCopyId = useCallback(async (id: string) => {
    const success = await copyToClipboard(id);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close provenance drawer"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Export Provenance</h2>
            {exportId && (
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                  {exportId.slice(0, 12)}...
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyId(exportId)}
                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy full ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {copiedId === exportId && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Copied
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">
                Loading provenance data...
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <Info className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && provenance && (
            <div className="space-y-6">
              {/* Export Summary */}
              <div className="rounded-lg border border-border bg-card/30 p-4">
                <h3 className="text-sm font-medium mb-3">Export Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">
                      {provenance.export_type || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2">
                      <StatusChip
                        variant={
                          provenance.status === "completed"
                            ? "ok"
                            : provenance.status === "failed"
                              ? "warn"
                              : "muted"
                        }
                      >
                        {provenance.status?.toUpperCase() || "UNKNOWN"}
                      </StatusChip>
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">
                      {formatDate(provenance.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Evidence:
                    </span>
                    <span className="ml-2 font-medium">
                      {provenance.total_evidence_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence Links */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Evidence Links ({provenance.evidence_links.length})
                </h3>

                {provenance.evidence_links.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 p-4">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No evidence links found for this export.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {provenance.evidence_links.map((link, idx) => (
                      <EvidenceLinkCard
                        key={link.evidence_id}
                        link={link}
                        index={idx}
                        onCopy={handleCopyId}
                        copiedId={copiedId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <p>
            Provenance data is read-only. Evidence links show the audit trail
            for this export.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Evidence link card component
 */
function EvidenceLinkCard({
  link,
  index,
  onCopy,
  copiedId,
}: {
  link: EvidenceLink;
  index: number;
  onCopy: (id: string) => void;
  copiedId: string | null;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Evidence #{index + 1}
            </span>
            {link.evidence_type && (
              <StatusChip variant="muted">{link.evidence_type}</StatusChip>
            )}
          </div>

          {/* Evidence ID */}
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <code className="text-xs font-mono bg-muted/30 rounded px-1.5 py-0.5">
              {link.evidence_id.slice(0, 16)}...
            </code>
            <button
              type="button"
              onClick={() => onCopy(link.evidence_id)}
              className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy evidence ID"
            >
              <Copy className="h-3 w-3" />
            </button>
            {copiedId === link.evidence_id && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Copied
              </span>
            )}
          </div>

          {/* Linked At */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Linked: {formatDate(link.linked_at)}</span>
          </div>

          {/* Audit Event ID */}
          {link.audit_event_id && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Audit Event:
              </span>
              <code className="text-xs font-mono bg-muted/30 rounded px-1.5 py-0.5">
                {link.audit_event_id.slice(0, 12)}...
              </code>
              <button
                type="button"
                onClick={() => onCopy(link.audit_event_id!)}
                className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy audit event ID"
              >
                <Copy className="h-3 w-3" />
              </button>
              {copiedId === link.audit_event_id && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Copied
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
