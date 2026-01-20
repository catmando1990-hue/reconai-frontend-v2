"use client";

import Link from "next/link";
import { ArrowLeftRight, Download, FileText, RefreshCw } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";

const ICS_SCHEDULES = [
  { schedule: "H", name: "Contract Brief" },
  { schedule: "I", name: "Cumulative Allowable Cost Worksheet" },
  { schedule: "J", name: "Subcontract Information" },
  { schedule: "K", name: "Summary of Hours and Amounts" },
  { schedule: "L", name: "Reconciliation of Contract Briefs" },
  { schedule: "M", name: "Indirect Cost Pools" },
  { schedule: "N", name: "Certificate of Indirect Costs" },
  { schedule: "O", name: "Contract Closing" },
];

export default function ReconciliationPage() {
  return (
    <RouteShell
      title="Reconciliation"
      subtitle="DCAA-compliant labor and indirect cost reconciliation with ICS preparation"
      right={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export ICS
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Reconciliation
          </Button>
        </div>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="Reconciliation supports DCAA Incurred Cost Submission (ICS) per FAR 52.216-7. All variances must be resolved with documented evidence before final submission."
        context="govcon"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Reconciliation Runs */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Reconciliation Runs"
            subtitle="Labor and indirect cost reconciliation history"
            actions={
              <Button variant="secondary" size="sm">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                New Run
              </Button>
            }
          >
            <EmptyState
              icon={ArrowLeftRight}
              title="No reconciliation runs"
              description="Run a reconciliation to compare labor, indirect costs, and GL postings for variance detection."
              action={{ label: "Run reconciliation" }}
            />
          </PrimaryPanel>

          {/* Variances Panel */}
          <div className="mt-6">
            <PrimaryPanel
              title="Variances"
              subtitle="Variance analysis and resolution tracking"
            >
              <EmptyState
                icon={FileText}
                title="No variances"
                description="Variances will appear here after a reconciliation run identifies discrepancies."
              />
            </PrimaryPanel>
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Variance Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Runs
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Open Variances
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolved</span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Escalated</span>
                <span className="text-lg font-semibold">0</span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="ICS Schedules">
            <div className="space-y-2">
              {ICS_SCHEDULES.map((schedule) => (
                <div
                  key={schedule.schedule}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <div>
                    <span className="font-mono text-xs font-medium">
                      Schedule {schedule.schedule}
                    </span>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {schedule.name}
                    </p>
                  </div>
                  <StatusChip variant="muted">Pending</StatusChip>
                </div>
              ))}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="SF-1408 Preaward">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">SF-1408 Checklist</p>
                <p className="text-xs text-muted-foreground">
                  Accounting system adequacy for government contracting
                </p>
                <Link
                  href={ROUTES.GOVCON_SF1408}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View checklist →
                </Link>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_INDIRECTS}
                className="block text-primary hover:underline"
              >
                Indirect cost pools
              </Link>
              <Link
                href={ROUTES.GOVCON_TIMEKEEPING}
                className="block text-primary hover:underline"
              >
                Timekeeping
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                View audit trail
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
