"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Hash,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileWarning,
  FileText,
  Info,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import ExportForDCAAButton from "@/components/govcon/ExportForDCAAButton";
import ExportForDCAAPDFButton from "@/components/govcon/ExportForDCAAPDFButton";
import { useGovConSnapshot } from "@/hooks/useGovConSnapshot";
import { ROUTES } from "@/lib/routes";

/**
 * GovCon Audit Trail Page
 *
 * P0 FIX: Version and Lifecycle Enforcement
 * - Unknown/missing govcon_version = fail-closed
 * - Non-success lifecycle REQUIRES reason display
 * - Evidence status shown explicitly
 *
 * HIERARCHY: GovCon is subordinate to CORE, CFO, and Intelligence
 * - No green/pass styling - uses neutral blue advisory styling
 * - No "Verified" or certification language
 */

export default function AuditPage() {
  const {
    data,
    isLoading,
    isSuccess,
    lifecycle,
    reasonCode,
    reasonMessage,
    hasEvidence,
    refetch,
  } = useGovConSnapshot();

  // Derive audit stats from snapshot
  const auditEntries = data?.snapshot?.audit_entries ?? null;
  const evidenceCount = data?.snapshot?.evidence_attached?.length ?? 0;

  // Get integrity status based on lifecycle and evidence
  // HIERARCHY: No "ok" (green) variant - only muted/warn/error
  function getIntegrityStatus(): {
    icon: typeof FileText;
    label: string;
    description: string;
    variant: "documented" | "warn" | "error" | "muted";
  } {
    if (isLoading) {
      return {
        icon: Loader2,
        label: "Checking…",
        description: "Loading audit trail status",
        variant: "muted",
      };
    }
    if (!lifecycle) {
      return {
        icon: AlertCircle,
        label: "Not evaluated",
        description: "No audit data available",
        variant: "muted",
      };
    }
    if (lifecycle === "pending") {
      return {
        icon: Loader2,
        label: "Loading",
        description: "Audit trail loading",
        variant: "muted",
      };
    }
    if (lifecycle === "success" && hasEvidence) {
      // HIERARCHY: "Recorded" not "Verified" - no certification language
      return {
        icon: FileText,
        label: "Recorded",
        description: "Hash chain documented with evidence",
        variant: "documented",
      };
    }
    if (lifecycle === "success" && !hasEvidence) {
      return {
        icon: FileWarning,
        label: "No evidence",
        description: "Audit trail exists but lacks evidence attachments",
        variant: "warn",
      };
    }
    if (lifecycle === "stale") {
      return {
        icon: AlertTriangle,
        label: "Stale",
        description: reasonMessage || "Audit data may be outdated",
        variant: "warn",
      };
    }
    if (lifecycle === "no_evidence") {
      return {
        icon: FileWarning,
        label: "No evidence",
        description: "Evidence required for documentation",
        variant: "warn",
      };
    }
    // Failed
    return {
      icon: AlertCircle,
      label: "Unavailable",
      description: reasonMessage || `Error: ${reasonCode || "unknown"}`,
      variant: "error",
    };
  }

  const integrityStatus = getIntegrityStatus();
  const IntegrityIcon = integrityStatus.icon;

  return (
    <RouteShell
      title="Audit Trail"
      subtitle="Event documentation with hash chain integrity"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <ExportForDCAAButton className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm" />
          <ExportForDCAAPDFButton className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm" />
        </div>
      }
    >
      {/* ADVISORY DISCLAIMER */}
      {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
      <div className="rounded-lg border border-border bg-muted p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Advisory only.</span> This audit trail
            documents system events for reference purposes. It does not certify
            DCAA compliance or replace professional audit review.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Audit Timeline</h2>
                <p className="text-sm text-muted-foreground">
                  Chronological record of system events
                </p>
              </div>
              <Link
                href="/govcon/audit/verify"
                className="text-sm text-primary hover:underline"
              >
                View hash chain
              </Link>
            </div>
            {/* P0 FIX: Lifecycle-based rendering */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading audit trail…
              </p>
            ) : lifecycle === "failed" ? (
              /* Failed state - show error with reason */
              /* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Audit trail unavailable
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reasonMessage || `Error: ${reasonCode || "unknown"}`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refetch()}
                      className="mt-2"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : isSuccess && auditEntries !== null && auditEntries > 0 ? (
              /* SUCCESS: Render audit entries */
              <div className="space-y-4" data-testid="audit-timeline-content">
                {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Recorded
                  </span>
                  <span>
                    as of{" "}
                    {data?.snapshot?.as_of
                      ? new Date(data.snapshot.as_of).toLocaleString()
                      : "recently"}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{evidenceCount} evidence files</span>
                </div>

                {/* TODO: Render actual audit entries when available */}
                {/* HIERARCHY: text-base font-medium for metrics */}
                <p className="text-sm text-muted-foreground">
                  <span className="text-base font-medium text-foreground">
                    {auditEntries}
                  </span>{" "}
                  audit entries documented.
                </p>
              </div>
            ) : (
              /* EMPTY STATE */
              <EmptyState
                icon={Shield}
                title="No audit entries"
                description="Audit entries will appear here as system events occur. All modifications are automatically logged."
              />
            )}
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Documentation Status">
            <div className="space-y-4">
              {/* P0 FIX: Show explicit status based on lifecycle */}
              {/* BACKGROUND NORMALIZATION: No decorative colors - use bg-muted */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border bg-card">
                  <IntegrityIcon
                    className={`h-5 w-5 text-muted-foreground ${integrityStatus.icon === Loader2 ? "animate-spin" : ""}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {integrityStatus.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {integrityStatus.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Entries</span>
                  {/* P0 FIX: Show explicit reason for missing data */}
                  {/* HIERARCHY: text-base font-medium for values */}
                  {auditEntries !== null ? (
                    <span className="text-base font-medium">{auditEntries}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Evidence</span>
                  {isSuccess ? (
                    <span className="text-base font-medium">{evidenceCount}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
              </div>
              {/* SF-1408 reference */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  SF-1408 § rep-1 through rep-3 (Reporting & Audit Trail)
                </p>
              </div>
              {/* Show lifecycle context when non-success */}
              {lifecycle && lifecycle !== "success" && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Status:{" "}
                    <span className="capitalize font-medium">{lifecycle}</span>
                    {reasonCode && ` (${reasonCode.replace(/_/g, " ")})`}
                  </p>
                </div>
              )}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links">
            <nav className="space-y-2">
              <Link
                href={ROUTES.GOVCON_EVIDENCE}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Eye className="h-4 w-4" />
                Evidence Viewer
              </Link>
              <Link
                href="/govcon/audit/verify"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Hash className="h-4 w-4" />
                View Hash Chain
              </Link>
            </nav>
          </SecondaryPanel>

          <SecondaryPanel title="Retention Policy" collapsible>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Audit records retained for 6 years per FAR requirements.</p>
              <p>Evidence files stored with cryptographic hashing.</p>
              <p>Export available in JSON and PDF formats.</p>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
