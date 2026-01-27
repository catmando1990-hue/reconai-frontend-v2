"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { DollarSign } from "lucide-react";

function PayrollCompensationBody() {
  return (
    <RouteShell
      title="Compensation"
      subtitle="Salary, wages, and compensation structures"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Compensation Structures"
            subtitle="Salary bands, wages, and pay grades"
          >
            <EmptyState
              icon={DollarSign}
              title="No compensation data"
              description="Compensation structures, salary bands, and wage records will appear here once configured."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Compensation Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Annual Payroll
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Average Salary
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Compensation Plans
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollCompensationPage() {
  return (
    <TierGate
      tier="payroll"
      title="Compensation"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollCompensationBody />
    </TierGate>
  );
}
