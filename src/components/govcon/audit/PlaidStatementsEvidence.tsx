"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import { useFinancialEvidence } from "@/lib/financial-evidence-context";
import {
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Building2,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type PlaidStatement = {
  statement_id: string;
  institution_name: string;
  institution_id: string;
  account_id: string;
  account_name: string;
  account_mask: string;
  period_start: string;
  period_end: string;
};

type ListResponse = {
  ok: boolean;
  statements: PlaidStatement[];
  error?: string;
  request_id: string;
};

type DownloadState = {
  status: "idle" | "downloading" | "success" | "error";
  hash?: string;
  error?: string;
  requestId?: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PlaidStatementsEvidence — Audit-grade Plaid statement viewer
 *
 * Phase 8A Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual "Load Statements" action only (NO auto-fetch, NO polling)
 * - Manual download action with SHA-256 hash display
 * - Source label: "Source: Plaid"
 * - Evidence disclaimer
 * - All errors include request_id
 */
export function PlaidStatementsEvidence() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();
  const evidenceContext = useFinancialEvidence();

  // List state
  const [statements, setStatements] = useState<PlaidStatement[]>([]);
  const [listStatus, setListStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [listRequestId, setListRequestId] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Download state per statement
  const [downloadStates, setDownloadStates] = useState<
    Record<string, DownloadState>
  >({});

  // Clipboard state for hash copy
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // ==========================================================================
  // RBAC CHECK
  // ==========================================================================

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // ==========================================================================
  // REPORT TO CONSISTENCY CONTEXT (Phase 8D)
  // ==========================================================================

  useEffect(() => {
    if (!evidenceContext) return;
    if (listStatus !== "success") return;

    evidenceContext.updateStatements({
      loaded: true,
      count: statements.length,
      periods: statements.map((s) => ({
        start: s.period_start,
        end: s.period_end,
      })),
      fetchedAt,
    });
  }, [evidenceContext, listStatus, statements, fetchedAt]);

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin (no disabled buttons, no hints)
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLoadStatements = async () => {
    if (listStatus === "loading") return;

    setListStatus("loading");
    setListError(null);
    setListRequestId(null);
    setStatements([]);
    setDownloadStates({});

    try {
      const res = await fetch("/api/plaid/statements/list", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const requestId = res.headers.get("x-request-id");
      setListRequestId(requestId);

      const data: ListResponse = await res.json();

      if (!data.ok || !res.ok) {
        setListStatus("error");
        setListError(
          data.error || `Failed to load statements (${res.status})`,
        );
        return;
      }

      setStatements(data.statements || []);
      setFetchedAt(new Date().toISOString());
      setListStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setListStatus("error");
      setListError(message);
    }
  };

  const handleDownload = async (statementId: string) => {
    const currentState = downloadStates[statementId];
    if (currentState?.status === "downloading") return;

    setDownloadStates((prev) => ({
      ...prev,
      [statementId]: { status: "downloading" },
    }));

    try {
      const res = await fetch(
        `/api/plaid/statements/download?statement_id=${encodeURIComponent(statementId)}`,
      );

      const requestId = res.headers.get("x-request-id");
      const contentHash = res.headers.get("x-content-hash");

      if (!res.ok) {
        let errorMsg = `Download failed (${res.status})`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Keep default error message
        }

        setDownloadStates((prev) => ({
          ...prev,
          [statementId]: {
            status: "error",
            error: errorMsg,
            requestId: requestId || undefined,
          },
        }));
        return;
      }

      // Trigger file download
      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `statement_${statementId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (match) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadStates((prev) => ({
        ...prev,
        [statementId]: {
          status: "success",
          hash: contentHash || undefined,
          requestId: requestId || undefined,
        },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setDownloadStates((prev) => ({
        ...prev,
        [statementId]: { status: "error", error: message },
      }));
    }
  };

  const handleCopyHash = useCallback((hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Bank Statements</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Source: Plaid
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Read-only bank statement evidence. Manual actions only.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Evidence Disclaimer:</strong> This document is provided as
        financial evidence. It is not modified or interpreted by ReconAI.
      </div>

      {/* Load Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleLoadStatements()}
          disabled={listStatus === "loading"}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {listStatus === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Load Statements
            </>
          )}
        </button>

        {listStatus === "success" && (
          <span className="text-xs text-muted-foreground">
            {statements.length} statement{statements.length !== 1 ? "s" : ""}{" "}
            found
          </span>
        )}
      </div>

      {/* Error State */}
      {listStatus === "error" && listError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{listError}</p>
              {listRequestId && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  request_id: {listRequestId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {listStatus === "success" && statements.length === 0 && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No statements available. Connect a bank account with statement access
          enabled.
        </div>
      )}

      {/* Statements Table */}
      {listStatus === "success" && statements.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left">
                <th className="p-3 font-medium">Institution</th>
                <th className="p-3 font-medium">Account</th>
                <th className="p-3 font-medium">Period</th>
                <th className="p-3 font-medium">Statement ID</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((stmt) => {
                const dlState = downloadStates[stmt.statement_id] || {
                  status: "idle",
                };

                return (
                  <tr
                    key={stmt.statement_id}
                    className="border-b last:border-b-0"
                  >
                    <td className="p-3">
                      <div className="font-medium">{stmt.institution_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stmt.institution_id}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{stmt.account_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ****{stmt.account_mask}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div>{stmt.period_start}</div>
                      <div className="text-xs text-muted-foreground">
                        to {stmt.period_end}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {stmt.statement_id.slice(0, 16)}...
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDownload(stmt.statement_id)}
                          disabled={dlState.status === "downloading"}
                          className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                          {dlState.status === "downloading" ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3" />
                              Download
                            </>
                          )}
                        </button>

                        {/* Hash Display on Success */}
                        {dlState.status === "success" && dlState.hash && (
                          <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1">
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                              SHA-256: {dlState.hash.slice(0, 16)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(dlState.hash!)}
                              className="ml-1 rounded p-0.5 hover:bg-emerald-500/20"
                              title="Copy full hash"
                            >
                              {copiedHash === dlState.hash ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-emerald-600" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Error Display */}
                        {dlState.status === "error" && (
                          <div className="text-right">
                            <p className="text-[10px] text-destructive">
                              {dlState.error}
                            </p>
                            {dlState.requestId && (
                              <p className="font-mono text-[10px] text-muted-foreground">
                                request_id: {dlState.requestId.slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Advisory */}
      <div className="rounded-lg border p-3 text-[10px] text-muted-foreground">
        Admin only. Manual actions required. No automatic downloads. No file
        caching. All operations logged with request_id for audit provenance.
      </div>
    </div>
  );
}

export default PlaidStatementsEvidence;
