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
  Info,
} from "lucide-react";
import type {
  AuditExportV2State,
  GovConPreset,
  GovConPresetOption,
  GovConPresetResult,
  GovConPresetGenerateResponse,
} from "@/types/audit";

// =============================================================================
// CONSTANTS
// =============================================================================

const PRESET_OPTIONS: GovConPresetOption[] = [
  {
    id: "sf1408_pre_award",
    label: "SF 1408 — Pre-Award",
    description:
      "Generates a pre-award evidence bundle aligned to SF 1408. ReconAI does not certify compliance.",
  },
];

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

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
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
// COMPONENT
// =============================================================================

/**
 * GovConPresetPanel — Admin-only GovCon packet preset generator
 *
 * Phase 12B Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual "Generate Packet" button
 * - Preset selector (currently SF 1408 only)
 * - Confirmation step before execution
 * - States: idle → building → ready | error
 * - No polling, no auto-download
 * - Manual download action
 * - All errors include request_id
 */
export function GovConPresetPanel() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();

  // State
  const [panelState, setPanelState] = useState<AuditExportV2State>("idle");
  const [result, setResult] = useState<GovConPresetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Preset selection
  const [selectedPreset, setSelectedPreset] = useState<GovConPreset>("sf1408_pre_award");

  // SF 1408 options
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [periodFrom, setPeriodFrom] = useState(formatDateInput(oneYearAgo));
  const [periodTo, setPeriodTo] = useState(formatDateInput(today));
  const [assetSnapshot, setAssetSnapshot] = useState<"latest" | string>("latest");

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

  if (!userLoaded || !orgLoaded) return null;
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleGenerateClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmation(false);

    if (panelState === "building") return;

    setPanelState("building");
    setError(null);
    setRequestId(null);
    setResult(null);

    try {
      const res = await fetch("/api/exports/audit-package-v2/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: selectedPreset,
          options: {
            statement_period: {
              from: periodFrom,
              to: periodTo,
            },
            ...(assetSnapshot !== "latest"
              ? { asset_snapshot_id: assetSnapshot }
              : {}),
          },
        }),
      });

      const reqId = res.headers.get("x-request-id");
      setRequestId(reqId);

      const json: GovConPresetGenerateResponse = await res.json();

      if (!json.ok || !res.ok) {
        setPanelState("error");
        setError(json.error || `Failed to generate packet (${res.status})`);
        return;
      }

      // Check for govcon_mapping presence
      const hasGovconMapping = !!(
        json.govcon_mapping &&
        typeof json.govcon_mapping === "object" &&
        json.govcon_mapping.standard
      );

      // Check for integrity metadata
      const integrity =
        json.integrity &&
        typeof json.integrity === "object" &&
        (json.integrity.hash_chain || json.integrity.signature)
          ? json.integrity
          : undefined;

      setResult({
        exportId: json.export_id || "",
        generatedAt: json.generated_at || new Date().toISOString(),
        preset: json.preset || selectedPreset,
        sections: json.sections || [],
        hasGovconMapping,
        ...(integrity ? { integrity } : {}),
      });
      setPanelState("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setPanelState("error");
      setError(message);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleDownload = async () => {
    if (!result?.exportId || downloading) return;

    setDownloading(true);

    try {
      const res = await fetch(
        `/api/exports/audit-package-v2/download?export_id=${encodeURIComponent(result.exportId)}`,
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
      let filename = `govcon-preset-${result.exportId}.zip`;
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
    setPanelState("idle");
    setResult(null);
    setError(null);
    setRequestId(null);
    setShowConfirmation(false);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const selectedPresetOption = PRESET_OPTIONS.find((p) => p.id === selectedPreset);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-6 space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">GovCon Packet Presets</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Admin Only
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate evidence bundles using predefined GovCon packet templates.
          Manual actions only.
        </p>
      </div>

      {/* Preset Selection + Options (idle state) */}
      {panelState === "idle" && !showConfirmation && (
        <div className="space-y-4">
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="preset-select">
              Preset
            </label>
            <select
              id="preset-select"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value as GovConPreset)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {PRESET_OPTIONS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            {selectedPresetOption && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                {selectedPresetOption.description}
              </p>
            )}
          </div>

          {/* SF 1408 Options */}
          {selectedPreset === "sf1408_pre_award" && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-sm font-medium">SF 1408 Options</div>

              {/* Statement Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor="period-from">
                    Statement period from
                  </label>
                  <input
                    id="period-from"
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor="period-to">
                    Statement period to
                  </label>
                  <input
                    id="period-to"
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Asset Snapshot */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="asset-snapshot">
                  Asset snapshot
                </label>
                <select
                  id="asset-snapshot"
                  value={assetSnapshot}
                  onChange={(e) => setAssetSnapshot(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="latest">Use latest available</option>
                </select>
              </div>

              {/* Liabilities note */}
              <p className="text-[10px] text-muted-foreground">
                Liabilities are auto-included in SF 1408 pre-award packets.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="space-y-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Confirm Packet Generation
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This will generate a <strong>{selectedPresetOption?.label}</strong> evidence
              bundle for the period {periodFrom} to {periodTo}.
              {assetSnapshot === "latest"
                ? " Using latest available asset snapshot."
                : ` Using asset snapshot: ${assetSnapshot}.`}
              {" "}Liabilities auto-included.
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
      {panelState === "building" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">Generating Packet...</div>
            <p className="text-xs text-muted-foreground">
              Please wait while the {selectedPresetOption?.label} packet is being prepared.
            </p>
          </div>
        </div>
      )}

      {/* Ready State */}
      {panelState === "ready" && result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="font-medium text-emerald-800 dark:text-emerald-200">
                  Packet Ready
                </div>

                {/* Preset name */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <FileArchive className="h-3 w-3" />
                  <span>Preset: {selectedPresetOption?.label || result.preset}</span>
                </div>

                {/* Generated timestamp */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Clock className="h-3 w-3" />
                  <span>Generated: {formatTimestamp(result.generatedAt)}</span>
                </div>

                {/* Included sections */}
                {result.sections.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <FileArchive className="h-3 w-3" />
                    <span>
                      Includes: {result.sections.map(sectionLabel).join(", ")}
                    </span>
                  </div>
                )}

                {/* Export ID */}
                <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  Export ID: {result.exportId}
                </div>

                {/* GovCon/DCAA Mapping Badge */}
                {result.hasGovconMapping && (
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

          {/* Advisory copy */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>Advisory:</strong> This packet bundles historical financial
            evidence. ReconAI does not interpret or certify compliance.
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
                  Download Packet
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate New Packet
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {panelState === "error" && error && (
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
      {panelState === "idle" && !showConfirmation && (
        <button
          type="button"
          onClick={handleGenerateClick}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <FileArchive className="h-4 w-4" />
          Generate Packet
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

export default GovConPresetPanel;
