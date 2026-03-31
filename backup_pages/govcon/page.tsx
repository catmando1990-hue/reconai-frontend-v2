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
  Info,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
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
 *
 * HIERARCHY: GovCon is subordinate to CORE, CFO, and Intelligence
 * - Uses text-base font-medium (smaller than Intelligence's text-lg font-medium)
 * - No green/pass styling - uses neutral blue advisory styling
 * - SF-1408 control references shown inline
 */

const MODULES = [
  {
    title: "Contracts",
    href: ROUTES.GOVCON_CONTRACTS,
    icon: FileText,
    description: "Contract tracking workspace",
  },
  {
    title: "Timekeeping",
    href: ROUTES.GOVCON_TIMEKEEPING,
    icon: Clock,
    description: "Labor hour documentation",
  },
  {
    title: "Indirect Costs",
    href: ROUTES.GOVCON_INDIRECTS,
    icon: Layers,
    description: "Cost pool mapping",
  },
  {
    title: "Reconciliation",
    href: ROUTES.GOVCON_RECONCILIATION,
    icon: ArrowLeftRight,
    description: "Cross-reference workspace",
  },
  {
    title: "Audit Trail",
    href: ROUTES.GOVCON_AUDIT,
    icon: Shield,
    description: "Event documentation",
  },
];

// =============================================================================
// SF-1408 CONTROL AREA MAPPING
// Maps DCAA readiness categories to SF-1408 sections
// =============================================================================

const SF1408_MAPPINGS: Record<
  string,
  { section: string; controls: string; href: string }
> = {
  timekeeping: {
    section: "Labor Charging & Timekeeping",
    controls: "§ labor-1 through labor-4",
    href: `${ROUTES.GOVCON_SF1408}?section=labor`,
  },
  job_cost: {
    section: "Direct / Indirect Costs",
    controls: "§ cost-1 through cost-5",
    href: `${ROUTES.GOVCON_SF1408}?section=costs`,
  },
  audit_trail: {
    section: "Reporting & Audit Trail",
    controls: "§ rep-1 through rep-3",
    href: `${ROUTES.GOVCON_SF1408}?section=reporting`,
  },
  ics_schedules: {
    section: "General Accounting System",
    controls: "§ gen-1 through gen-4",
    href: `${ROUTES.GOVCON_SF1408}?section=general`,
  },
};

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
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  if (
    lifecycle === "no_evidence" ||
    (lifecycle === "success" && !hasEvidence)
  ) {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="no_evidence"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Evidence required for documentation
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reasonMessage || "Attach supporting documentation to proceed."}
            </p>
            <Link
              href={ROUTES.GOVCON_EVIDENCE}
              className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
            >
              Go to Evidence Viewer →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending state - show loading indicator
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Loading documentation status…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-muted-foreground">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="govcon-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Documentation may be outdated
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
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
  // BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted
  return (
    <div
      data-testid="govcon-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-border bg-muted p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Documentation unavailable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
// DCAA READINESS STATUS HELPER - Advisory language only
// =============================================================================

function getDcaaStatusVariant(
  lifecycle: GovConLifecycleStatus | null,
  hasEvidence: boolean,
): "unknown" | "muted" {
  // HIERARCHY: GovCon never shows "ok" (green) - only muted/unknown
  if (!lifecycle) return "unknown";
  if (lifecycle === "pending") return "muted";
  if (lifecycle === "success" && hasEvidence) return "muted"; // Documented, not "compliant"
  return "unknown";
}

function getDcaaStatusLabel(
  lifecycle: GovConLifecycleStatus | null,
  reasonCode: GovConReasonCode | null,
  hasEvidence: boolean,
): string {
  // HIERARCHY: No pass/fail language - advisory only
  if (!lifecycle) return "Not evaluated";
  if (lifecycle === "pending") return "Checking…";
  if (lifecycle === "success" && hasEvidence) return "Documented"; // NOT "Compliant"
  if (lifecycle === "stale") return "Stale";
  if (lifecycle === "no_evidence" || !hasEvidence) return "No evidence";
  if (lifecycle === "failed") {
    if (reasonCode === "configuration_required") return "Setup required";
    if (reasonCode === "no_contracts") return "No contracts";
    if (reasonCode === "dcaa_validation_failed") return "Needs review";
    return "Unavailable";
  }
  return "Not evaluated";
}

// =============================================================================
// SF-1408 READINESS ITEM COMPONENT
// =============================================================================

interface DcaaReadinessItemProps {
  label: string;
  mappingKey: string;
  lifecycle: GovConLifecycleStatus | null;
  reasonCode: GovConReasonCode | null;
  hasEvidence: boolean;
  evidenceCount: number;
}

function DcaaReadinessItem({
  label,
  mappingKey,
  lifecycle,
  reasonCode,
  hasEvidence,
  evidenceCount,
}: DcaaReadinessItemProps) {
  const mapping = SF1408_MAPPINGS[mappingKey];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        {/* HIERARCHY: text-sm (smaller than Intelligence) */}
        <span className="text-sm text-muted-foreground">{label}</span>
        <StatusChip variant={getDcaaStatusVariant(lifecycle, hasEvidence)}>
          {getDcaaStatusLabel(lifecycle, reasonCode, hasEvidence)}
        </StatusChip>
      </div>
      {/* SF-1408 control reference */}
      {mapping && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
          <span>SF-1408 {mapping.controls}</span>
          <span className="text-muted-foreground/40">•</span>
          {/* HIERARCHY: text-base font-medium for metric values */}
          <span className="text-base font-medium text-foreground">
            {hasEvidence ? evidenceCount : 0}
          </span>
          <span>evidence files</span>
        </div>
      )}
    </div>
  );
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

  const evidenceCount = data?.snapshot?.evidence_attached?.length ?? 0;

  return (
    <RouteShell
      title="GovCon"
      subtitle="Government contracting documentation workspace"
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

      {/* ADVISORY DISCLAIMER - Required for UI clarity */}
      {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
      <div className="rounded-lg border border-border bg-muted p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Advisory only.</span>{" "}
            This workspace assists with documentation collection and
            organization. It does not certify DCAA compliance or replace
            professional accounting review. See{" "}
            <Link
              href={ROUTES.GOVCON_SF1408}
              className="text-primary underline hover:no-underline"
            >
              SF-1408 reference
            </Link>{" "}
            for control area details.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Documentation Queue</h2>
                <p className="text-sm text-muted-foreground">
                  Items requiring attention
                </p>
              </div>
              <Link
                href={ROUTES.GOVCON_RECONCILIATION}
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {/* P0 FIX: Lifecycle-based rendering */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading documentation status…
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
                reasonMessage="Evidence required for documentation readiness"
                hasEvidence={hasEvidence}
                onRetry={() => void refetch()}
              />
            ) : isSuccess && data?.snapshot ? (
              /* SUCCESS with evidence: Render documentation queue */
              <div
                className="space-y-4"
                data-testid="govcon-compliance-content"
              >
                {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Documented
                  </span>
                  <span>
                    as of{" "}
                    {data.snapshot.as_of
                      ? new Date(data.snapshot.as_of).toLocaleString()
                      : "recently"}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{evidenceCount} evidence files</span>
                </div>

                {/* TODO: Render actual documentation queue items when available */}
                <EmptyState
                  icon={ClipboardList}
                  title="No items in queue"
                  description="All documentation items have been addressed."
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
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="SF-1408 Control Areas">
            <div className="space-y-4">
              <DcaaReadinessItem
                label="Timekeeping"
                mappingKey="timekeeping"
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                hasEvidence={hasEvidence}
                evidenceCount={evidenceCount}
              />
              <DcaaReadinessItem
                label="Job Cost Accounting"
                mappingKey="job_cost"
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                hasEvidence={hasEvidence}
                evidenceCount={evidenceCount}
              />
              <DcaaReadinessItem
                label="Audit Trail"
                mappingKey="audit_trail"
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                hasEvidence={hasEvidence}
                evidenceCount={evidenceCount}
              />
              <DcaaReadinessItem
                label="ICS Schedules"
                mappingKey="ics_schedules"
                lifecycle={lifecycle}
                reasonCode={reasonCode}
                hasEvidence={hasEvidence}
                evidenceCount={evidenceCount}
              />

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
              {/* BACKGROUND NORMALIZATION: No decorative colors */}
              {lifecycle === "success" && !hasEvidence && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Evidence required for documentation
                  </p>
                </div>
              )}

              {/* Link to full SF-1408 reference */}
              <div className="pt-2 border-t">
                <Link
                  href={ROUTES.GOVCON_SF1408}
                  className="text-xs text-primary hover:underline"
                >
                  View full SF-1408 checklist →
                </Link>
              </div>
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
                      {/* HIERARCHY: font-medium, not font-semibold */}
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
