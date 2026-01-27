"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import {
  FileArchive,
  RefreshCw,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Wallet,
  Building2,
  Info,
  Copy,
  Check,
} from "lucide-react";
import type {
  AuditExportV2State,
  AuditExportV2Result,
  AuditExportV2GenerateResponse,
} from "@/types/audit";

// =============================================================================
// HELPERS
// =============================================================================

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function sectionLabel(section: string): string {
  switch (section) {
    case "statements":
      return "Statements";
    case "assets":
      return "Assets";
    case "liabilities":
      return "Liabilities";
    default:
      return section;
  }
}

// =============================================================================
// COPYABLE FIELD
// =============================================================================

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Silent failure
    });
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <code className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded max-w-[200px] truncate">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// INTEGRITY METADATA PANEL (Phase 11B)
// =============================================================================

function IntegrityMetadataPanel({
  integrity,
}: {
  integrity: NonNullable<AuditExportV2Result["integrity"]>;
}) {
  const { hash_chain, signature } = integrity;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Integrity Metadata
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Signed
        </span>
      </div>

      <div className="space-y-2">
        {signature && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Algorithm</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {signature.algorithm}
              </span>
            </div>
            <CopyableField label="Key ID" value={signature.key_id} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Signed at (UTC)</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatTimestamp(signature.signed_at)}
              </span>
            </div>
          </>
        )}

        {hash_chain && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Hash algorithm</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {hash_chain.algorithm} (hash chain)
              </span>
            </div>
            <CopyableField label="Chain root" value={hash_chain.root} />
          </>
        )}
      </div>

      {/* Offline verification instructions */}
      <div className="rounded border border-border bg-background/50 p-3 text-[10px] text-muted-foreground leading-relaxed">
        This export includes a cryptographic signature. To verify integrity,
        recompute the SHA-256 hash chain over the exported files in order, then
        verify the Ed25519 signature using the included public key. ReconAI does
        not perform verification on your behalf.
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AuditExportV2Panel — Admin-only audit export v2 generator
 *
 * Phase 9B Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual "Generate Audit Export (v2)" button
 * - Section toggles: Statements, Assets, Liabilities (default: all checked)
 * - Confirmation step before execution
 * - States: idle, building, ready, error
 * - No polling, no auto-download
 * - Manual download action
 * - All errors include request_id
 */
export function AuditExportV2Panel() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();

  // State
  const [exportState, setExportState] = useState<AuditExportV2State>("idle");
  const [exportResult, setExportResult] = useState<AuditExportV2Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Section toggles (default: all checked)
  const [includeStatements, setIncludeStatements] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(true);
  const [includeLiabilities, setIncludeLiabilities] = useState(true);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Download state
  const [downloading, setDownloading] = useState(false);

  // ==========================================================================
  // RBAC CHECK
  // ==========================================================================

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin (no disabled buttons, no hints)
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleGenerateClick = () => {
    // Show confirmation step
    setShowConfirmation(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmation(false);

    if (exportState === "building") return;

    // Validate at least one section selected
    if (!includeStatements && !includeAssets && !includeLiabilities) {
      setError("At least one section must be selected");
      setExportState("error");
      return;
    }

    setExportState("building");
    setError(null);
    setRequestId(null);
    setExportResult(null);

    try {
      const res = await fetch("/api/exports/audit-package-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          include_statements: includeStatements,
          include_assets: includeAssets,
          include_liabilities: includeLiabilities,
        }),
      });

      const reqId = res.headers.get("x-request-id");
      setRequestId(reqId);

      const json: AuditExportV2GenerateResponse = await res.json();

      if (!json.ok || !res.ok) {
        setExportState("error");
        setError(json.error || `Failed to generate export (${res.status})`);
        return;
      }

      // Check for govcon_mapping presence (Phase 10B)
      // Silently suppress if malformed or missing
      const hasGovconMapping = !!(
        json.govcon_mapping &&
        typeof json.govcon_mapping === "object" &&
        json.govcon_mapping.standard
      );

      // Pass through integrity metadata if present (Phase 11B)
      const integrity =
        json.integrity &&
        typeof json.integrity === "object" &&
        (json.integrity.hash_chain || json.integrity.signature)
          ? json.integrity
          : undefined;

      setExportResult({
        exportId: json.export_id || "",
        generatedAt: json.generated_at || new Date().toISOString(),
        sections: json.sections || [],
        hasGovconMapping,
        ...(integrity ? { integrity } : {}),
      });
      setExportState("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setExportState("error");
      setError(message);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleDownload = async () => {
    if (!exportResult?.exportId || downloading) return;

    setDownloading(true);

    try {
      const res = await fetch(
        `/api/exports/audit-package-v2/download?export_id=${encodeURIComponent(exportResult.exportId)}`,
      );

      if (!res.ok) {
        let errorMsg = `Download failed (${res.status})`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
          if (errorData.request_id) {
            setRequestId(errorData.request_id);
          }
        } catch {
          // Keep default error message
        }
        setError(errorMsg);
        return;
      }

      // Trigger file download
      const blob = await res.blob();
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `audit-export-v2-${exportResult.exportId}.zip`;
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setExportState("idle");
    setExportResult(null);
    setError(null);
    setRequestId(null);
    setShowConfirmation(false);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="rounded-lg border border-border bg-card/50 p-6 space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Audit Export v2</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Admin Only
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate and download audit evidence bundles. Manual actions only.
        </p>
      </div>

      {/* Section Toggles (only show in idle state) */}
      {exportState === "idle" && !showConfirmation && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Include Sections:</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStatements}
                onChange={(e) => setIncludeStatements(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Statements</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAssets}
                onChange={(e) => setIncludeAssets(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Assets</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLiabilities}
                onChange={(e) => setIncludeLiabilities(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Liabilities</span>
            </label>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="space-y-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Confirm Export Generation
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This will generate an audit export bundle including:{" "}
              {[
                includeStatements && "Statements",
                includeAssets && "Assets",
                includeLiabilities && "Liabilities",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleConfirmGenerate()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                <FileArchive className="h-4 w-4" />
                Confirm Generate
              </button>
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Building State */}
      {exportState === "building" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Generating Export...</div>
            <p className="text-xs text-muted-foreground">
              Please wait while the audit bundle is being prepared.
            </p>
          </div>
        </div>
      )}

      {/* Ready State */}
      {exportState === "ready" && exportResult && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="font-medium text-emerald-800 dark:text-emerald-200">
                  Export Ready
                </div>

                {/* Generated timestamp */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Clock className="h-3 w-3" />
                  <span>Generated: {formatTimestamp(exportResult.generatedAt)}</span>
                </div>

                {/* Included sections */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <FileArchive className="h-3 w-3" />
                  <span>
                    Includes: {exportResult.sections.map(sectionLabel).join(", ")}
                  </span>
                </div>

                {/* Export ID */}
                <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  Export ID: {exportResult.exportId}
                </div>

                {/* GovCon/DCAA Mapping Badge (Phase 10B) */}
                {exportResult.hasGovconMapping && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      GovCon / DCAA Mapping Included
                      <span
                        className="cursor-help"
                        title="This audit export includes static references to applicable DCAA and FAR sections. ReconAI does not certify compliance."
                      >
                        <Info className="h-3 w-3" />
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Integrity Metadata Panel (Phase 11B) */}
          {exportResult.integrity &&
            (exportResult.integrity.hash_chain || exportResult.integrity.signature) && (
            <IntegrityMetadataPanel integrity={exportResult.integrity} />
          )}

          {/* Advisory copy */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>Advisory:</strong> This export contains historical financial
            evidence. ReconAI does not modify source data.
          </div>

          {/* Download Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Export
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate New Export
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {exportState === "error" && error && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">{error}</p>
                {requestId && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    request_id: {requestId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Generate Button (idle state, not showing confirmation) */}
      {exportState === "idle" && !showConfirmation && (
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={!includeStatements && !includeAssets && !includeLiabilities}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileArchive className="h-4 w-4" />
          Generate Audit Export (v2)
        </button>
      )}

      {/* Footer Advisory */}
      <div className="rounded-lg border p-3 text-[10px] text-muted-foreground">
        Admin only. Manual actions required. No automatic generation or download.
        All operations logged with request_id for audit provenance.
      </div>
    </div>
  );
}

export default AuditExportV2Panel;
