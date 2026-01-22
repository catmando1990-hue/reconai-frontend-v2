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
  CheckCircle2,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
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
  function getIntegrityStatus(): {
    icon: typeof CheckCircle2;
    label: string;
    description: string;
    variant: "ok" | "warn" | "error" | "muted";
  } {
    if (isLoading) {
      return {
        icon: Loader2,
        label: "Checking…",
        description: "Verifying audit trail integrity",
        variant: "muted",
      };
    }
    if (!lifecycle) {
      return {
        icon: AlertCircle,
        label: "Not evaluated",
        description: "No audit data available to verify",
        variant: "muted",
      };
    }
    if (lifecycle === "pending") {
      return {
        icon: Loader2,
        label: "Verifying",
        description: "Integrity check in progress",
        variant: "muted",
      };
    }
    if (lifecycle === "success" && hasEvidence) {
      return {
        icon: CheckCircle2,
        label: "Verified",
        description: "Hash chain integrity confirmed",
        variant: "ok",
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
        description: "Evidence required for DCAA compliance",
        variant: "warn",
      };
    }
    // Failed
    return {
      icon: AlertCircle,
      label: "Failed",
      description: reasonMessage || `Error: ${reasonCode || "unknown"}`,
      variant: "error",
    };
  }

  const integrityStatus = getIntegrityStatus();
  const IntegrityIcon = integrityStatus.icon;

  return (
    <RouteShell
      title="Audit Trail"
      subtitle="Audit log with hash chain integrity for DCAA documentation"
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
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Audit Timeline */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Audit Timeline"
            subtitle="Chronological record of all system events"
            actions={
              <Link
                href="/govcon/audit/verify"
                className="text-sm text-primary hover:underline"
              >
                Verify hash chain
              </Link>
            }
          >
            {/* P0 FIX: Lifecycle-based rendering */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading audit trail…
              </p>
            ) : lifecycle === "failed" ? (
              /* Failed state - show error with reason */
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Audit trail unavailable
                    </p>
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
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
                {/* Lifecycle indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-700 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Verified
                  </span>
                  <span>
                    as of{" "}
                    {data?.snapshot?.as_of
                      ? new Date(data.snapshot.as_of).toLocaleString()
                      : "recently"}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{evidenceCount} evidence files attached</span>
                </div>

                {/* TODO: Render actual audit entries when available */}
                <p className="text-sm text-muted-foreground">
                  {auditEntries} audit entries recorded.
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
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Integrity Status">
            <div className="space-y-4">
              {/* P0 FIX: Show explicit status based on lifecycle */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  integrityStatus.variant === "ok"
                    ? "bg-green-500/10"
                    : integrityStatus.variant === "warn"
                      ? "bg-yellow-500/10"
                      : integrityStatus.variant === "error"
                        ? "bg-red-500/10"
                        : "bg-muted/50"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    integrityStatus.variant === "ok"
                      ? "bg-green-500/20"
                      : integrityStatus.variant === "warn"
                        ? "bg-yellow-500/20"
                        : integrityStatus.variant === "error"
                          ? "bg-red-500/20"
                          : "bg-muted"
                  }`}
                >
                  <IntegrityIcon
                    className={`h-5 w-5 ${
                      integrityStatus.variant === "ok"
                        ? "text-green-600 dark:text-green-400"
                        : integrityStatus.variant === "warn"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : integrityStatus.variant === "error"
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                    } ${integrityStatus.icon === Loader2 ? "animate-spin" : ""}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      integrityStatus.variant === "ok"
                        ? "text-green-700 dark:text-green-300"
                        : integrityStatus.variant === "warn"
                          ? "text-yellow-700 dark:text-yellow-300"
                          : integrityStatus.variant === "error"
                            ? "text-red-700 dark:text-red-300"
                            : "text-muted-foreground"
                    }`}
                  >
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
                  {auditEntries !== null ? (
                    <span className="font-medium">{auditEntries}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCAA Relevant</span>
                  {auditEntries !== null ? (
                    <span className="font-medium">{auditEntries}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Evidence</span>
                  {isSuccess ? (
                    <span className="font-medium">{evidenceCount}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
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
                Verify Hash Chain
              </Link>
            </nav>
          </SecondaryPanel>

          <SecondaryPanel title="Retention Policy" collapsible>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Audit records retained for 6 years per FAR requirements.</p>
              <p>Evidence files stored with cryptographic verification.</p>
              <p>Export available in JSON and PDF formats.</p>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
