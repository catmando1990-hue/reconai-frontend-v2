"use client";

import Link from "next/link";
import { Layers, Calculator, Download } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";

export default function IndirectsPage() {
  return (
    <RouteShell
      title="Indirect Costs"
      subtitle="DCAA-compliant indirect rate management with FAR 31.201 allowability tracking"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Export coming soon"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Rates
          </Button>
          <Button size="sm" disabled title="Calculate coming soon">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Rates
          </Button>
        </div>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="All indirect costs are reviewed against FAR 31.201-2 through 31.205-52 for allowability determination. Rate changes require evidence and are logged to the audit trail."
        context="govcon"
      />

      {/* TODO: UtilityStrip with search/filters will be enabled when pools exist */}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Pool Management */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Indirect Cost Pools"
            subtitle="FAR 31.201 allowability determination"
            actions={
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="Add pool coming soon"
              >
                <Layers className="mr-2 h-4 w-4" />
                Add Pool
              </Button>
            }
          >
            <EmptyState
              icon={Layers}
              title="No indirect pools"
              description="Indirect cost pool management requires backend integration. This feature is not yet available."
            />
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Rate Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Pools
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Indirect Costs
                </span>
                <span className="text-lg font-semibold">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Allowable</span>
                <span className="text-lg font-semibold">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Unallowable
                </span>
                <span className="text-lg font-semibold">$0</span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Allowability Posture">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Allowability Rate
                </span>
                <StatusChip variant="muted">N/A</StatusChip>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-0 bg-primary rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground">
                Allowability posture will display when pools are added.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="FAR Reference" collapsible>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">FAR 31.205-6</p>
                <p className="text-xs text-muted-foreground">
                  Compensation (subject to reasonableness)
                </p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">FAR 31.205-14</p>
                <p className="text-xs text-muted-foreground">
                  Entertainment (generally unallowable)
                </p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">FAR 31.205-36</p>
                <p className="text-xs text-muted-foreground">
                  Rental costs (allowable if reasonable)
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_RECONCILIATION}
                className="block text-primary hover:underline"
              >
                Run reconciliation
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                View audit trail
              </Link>
              <Link
                href={ROUTES.GOVCON_CONTRACTS}
                className="block text-primary hover:underline"
              >
                View contracts
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
