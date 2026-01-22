"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Layers,
  ArrowLeftRight,
  Shield,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Loader2,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { EMPTY_STATE, CTA } from "@/lib/dashboardCopy";
import { useGovConSnapshot } from "@/hooks/useGovConSnapshot";
import type { GovConLifecycleStatus, GovConReasonCode } from "@/lib/api/types";

/**
 * GovCon Dashboard Page
 *
 * P0 FIX: Version and Lifecycle Enforcement
 * - Unknown/missing govcon_version = fail-closed (no data rendered)
 * - Non-success lifecycle REQUIRES reason display
 * - Evidence REQUIRED for compliance - fail-closed without it
 */

const MODULES = [
  {
    title: "Contracts",
    href: ROUTES.GOVCON_CONTRACTS,
    icon: FileText,
    description: "DCAA-compliant contract management",
  },
  {
    title: "Timekeeping",
    href: ROUTES.GOVCON_TIMEKEEPING,
    icon: Clock,
    description: "Daily labor tracking",
  },
  {
    title: "Indirect Costs",
    href: ROUTES.GOVCON_INDIRECTS,
    icon: Layers,
    description: "Overhead, G&A, and fringe pools",
  },
  {
    title: "Reconciliation",
    href: ROUTES.GOVCON_RECONCILIATION,
    icon: ArrowLeftRight,
    description: "Labor and cost reconciliation",
  },
  {
    title: "Audit Trail",
    href: ROUTES.GOVCON_AUDIT,
    icon: Shield,
    description: "Immutable audit log",
  },
];

// =============================================================================
// LIFECYCLE STATUS BANNER - Required for non-success states
// =============================================================================

interface LifecycleStatusBannerProps {
  lifecycle: GovConLifecycleStatus;
  reasonCode: GovConReasonCode | null;
  reasonMessage: string | null;
  hasEvidence: boolean;
  onRetry?: () => void;
}

function LifecycleStatusBanner({
  lifecycle,
  reasonCode,
  reasonMessage,
  hasEvidence,
  onRetry,
}: LifecycleStatusBannerProps) {
  // Success state with evidence - no banner needed
  if (lifecycle === "success" && hasEvidence) {
    return null;
  }

  // No evidence state - CRITICAL for DCAA compliance
  if (lifecycle === "no_evidence" || (lifecycle === "success" && !hasEvidence)) {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="no_evidence"
        className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Evidence required for DCAA compliance
            </p>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              {reasonMessage || "Attach supporting documentation to proceed."}
            </p>
            <Link
              href={ROUTES.GOVCON_EVIDENCE}
              className="inline-block mt-2 text-xs font-medium text-orange-700 dark:text-orange-300 hover:underline"
            >
              Go to Evidence Viewer →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - show loading indicator
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Running compliance check…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Compliance data is stale
            </p>
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
              {reasonMessage || `Reason: ${reasonCode || "unknown"}`}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failed state - show error with reason (REQUIRED)
  return (
    <div
      data-testid="govcon-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Compliance data unavailable
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {reasonMessage || `Error: ${reasonCode || "unknown"}`}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DCAA READINESS STATUS HELPER
// =============================================================================

function getDcaaStatusVariant(
  lifecycle: GovConLifecycleStatus | null,
  hasEvidence: boolean
): "unknown" | "muted" | "ok" | "warn" {
  if (!lifecycle) return "unknown";
  if (lifecycle === "pending") return "muted";
  if (lifecycle === "success" && hasEvidence) return "ok";
  if (lifecycle === "stale") return "warn";
  if (lifecycle === "no_evidence" || !hasEvidence) return "warn";
  return "unknown";
}

function getDcaaStatusLabel(
  lifecycle: GovConLifecycleStatus | null,
  reasonCode: GovConReasonCode | null,
  hasEvidence: boolean
): string {
  if (!lifecycle) return "Not evaluated";
  if (lifecycle === "pending") return "Checking…";
  if (lifecycle === "success" && hasEvidence) return "Compliant";
  if (lifecycle === "stale") return "Stale";
  if (lifecycle === "no_evidence" || !hasEvidence) return "No evidence";
  if (lifecycle === "failed") {
    if (reasonCode === "configuration_required") return "Setup required";
    if (reasonCode === "no_contracts") return "No contracts";
    if (reasonCode === "dcaa_validation_failed") return "Non-compliant";
    return "Failed";
  }
  return "Not evaluated";
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function GovConDashboardPage() {
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

  return (
    <RouteShell
      title="GovCon"
      subtitle="DCAA-compliant government contracting workspace"
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
          <Link
            href={ROUTES.GOVCON_AUDIT}
            className="text-sm text-primary hover:underline"
          >
            View audit trail
          </Link>
        </div>
      }
    >
      <PolicyBanner
        policy="legal"
        message="All GovCon operations enforce: Advisory-only behavior, manual-run only, read-only execution, evidence required for modifications."
        context="govcon"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Compliance Queue */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Compliance Queue"
            subtitle="Items requiring attention"
            actions={
              <Link
                href={ROUTES.GOVCON_RECONCILIATION}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            }
          >
            {/* P0 FIX: Lifecycle-based rendering */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading compliance data…
              </p>
            ) : lifecycle && lifecycle !== "success" ? (
              /* Non-success lifecycle shows banner with reason */
              <LifecycleStatusBanner
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                reasonMessage={reasonMessage}
                hasEvidence={hasEvidence}
                onRetry={() => void refetch()}
              />
            ) : lifecycle === "success" && !hasEvidence ? (
              /* Success but no evidence - CANNOT proceed */
              <LifecycleStatusBanner
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                reasonMessage="Evidence required for DCAA compliance readiness"
                hasEvidence={hasEvidence}
                onRetry={() => void refetch()}
              />
            ) : isSuccess && data?.snapshot ? (
              /* SUCCESS with evidence: Render compliance queue */
              <div className="space-y-4" data-testid="govcon-compliance-content">
                {/* Lifecycle indicator - inline with content */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-700 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Compliant
                  </span>
                  <span>
                    as of{" "}
                    {data.snapshot.as_of
                      ? new Date(data.snapshot.as_of).toLocaleString()
                      : "recently"}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>
                    {data.snapshot.evidence_attached?.length ?? 0} evidence files
                  </span>
                </div>

                {/* TODO: Render actual compliance queue items when available */}
                <EmptyState
                  icon={ClipboardList}
                  title="No items in queue"
                  description="All compliance items have been addressed."
                />
              </div>
            ) : (
              /* EMPTY STATE: No data available */
              <EmptyState
                icon={ClipboardList}
                title={EMPTY_STATE.govcon.title}
                description={EMPTY_STATE.govcon.description}
                action={{
                  label: CTA.CONFIGURE,
                  href: ROUTES.GOVCON_CONTRACTS,
                }}
              />
            )}
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="DCAA Readiness">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Timekeeping
                </span>
                {/* P0 FIX: Show explicit status based on lifecycle */}
                <StatusChip variant={getDcaaStatusVariant(lifecycle, hasEvidence)}>
                  {getDcaaStatusLabel(lifecycle, reasonCode, hasEvidence)}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Job Cost Accounting
                </span>
                <StatusChip variant={getDcaaStatusVariant(lifecycle, hasEvidence)}>
                  {getDcaaStatusLabel(lifecycle, reasonCode, hasEvidence)}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Audit Trail
                </span>
                <StatusChip variant={getDcaaStatusVariant(lifecycle, hasEvidence)}>
                  {getDcaaStatusLabel(lifecycle, reasonCode, hasEvidence)}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  ICS Schedules
                </span>
                <StatusChip variant={getDcaaStatusVariant(lifecycle, hasEvidence)}>
                  {getDcaaStatusLabel(lifecycle, reasonCode, hasEvidence)}
                </StatusChip>
              </div>
              {/* Show lifecycle context */}
              {lifecycle && lifecycle !== "success" && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Status:{" "}
                    <span className="capitalize font-medium">{lifecycle}</span>
                    {reasonCode && ` (${reasonCode.replace(/_/g, " ")})`}
                  </p>
                </div>
              )}
              {lifecycle === "success" && !hasEvidence && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Evidence required for compliance verification
                  </p>
                </div>
              )}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Modules">
            <nav className="space-y-1">
              {MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-foreground">
                        {module.title}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                );
              })}
            </nav>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_SF1408}
                className="block text-primary hover:underline"
              >
                SF-1408 Checklist
              </Link>
              <Link
                href={ROUTES.GOVCON_EVIDENCE}
                className="block text-primary hover:underline"
              >
                Evidence Viewer
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                Export Center
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
