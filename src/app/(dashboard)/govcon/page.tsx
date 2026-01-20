"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  Layers,
  ArrowLeftRight,
  Shield,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { STATUS, EMPTY_STATE, CTA } from "@/lib/dashboardCopy";

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

export default function GovConDashboardPage() {
  return (
    <RouteShell
      title="GovCon"
      subtitle="DCAA-compliant government contracting workspace"
      right={
        <Link
          href={ROUTES.GOVCON_AUDIT}
          className="text-sm text-primary hover:underline"
        >
          View audit trail
        </Link>
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
            <EmptyState
              icon={ClipboardList}
              title={EMPTY_STATE.govcon.title}
              description={EMPTY_STATE.govcon.description}
              action={{
                label: CTA.CONFIGURE,
                href: ROUTES.GOVCON_CONTRACTS,
              }}
            />
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
                <StatusChip variant="unknown">
                  {STATUS.NOT_CONFIGURED}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Job Cost Accounting
                </span>
                <StatusChip variant="unknown">
                  {STATUS.NOT_CONFIGURED}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Audit Trail
                </span>
                <StatusChip variant="muted">{STATUS.REQUIRES_SETUP}</StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  ICS Schedules
                </span>
                <StatusChip variant="unknown">
                  {STATUS.NOT_EVALUATED}
                </StatusChip>
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
