"use client";

import Link from "next/link";
import { FileText, Plus, Download } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { UtilityStrip } from "@/components/dashboard/UtilityStrip";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";

export default function ContractsPage() {
  return (
    <RouteShell
      title="Contracts"
      subtitle="DCAA-compliant contract tracking with CLIN management"
      right={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      }
    >
      <UtilityStrip
        searchPlaceholder="Search contracts..."
        onSearch={() => {}}
        filters={[
          {
            id: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "completed", label: "Completed" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            id: "type",
            label: "Type",
            options: [
              { value: "FFP", label: "FFP" },
              { value: "CPFF", label: "CPFF" },
              { value: "T&M", label: "T&M" },
              { value: "IDIQ", label: "IDIQ" },
            ],
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Contract List */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Contract List"
            subtitle="All government contracts and CLINs"
          >
            <EmptyState
              icon={FileText}
              title="No contracts"
              description="Create your first contract to begin tracking funding, CLINs, and billing status."
              action={{ label: "Add contract" }}
            />
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Contract Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Contracts
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Value
                </span>
                <span className="text-lg font-semibold">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Funded</span>
                <span className="text-lg font-semibold">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Billed to Date
                </span>
                <span className="text-lg font-semibold">$0</span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Funding Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Funding Rate
                </span>
                <StatusChip variant="muted">N/A</StatusChip>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-0 bg-primary rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground">
                Funding status will display when contracts are added.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Actions" collapsible>
            <div className="space-y-2">
              <Link
                href="/govcon/audit"
                className="block text-sm text-primary hover:underline"
              >
                View audit trail
              </Link>
              <Link
                href="/govcon/reconciliation"
                className="block text-sm text-primary hover:underline"
              >
                Run reconciliation
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
