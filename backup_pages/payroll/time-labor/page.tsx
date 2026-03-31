"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Clock } from "lucide-react";

function PayrollTimeLaborBody() {
  return (
    <RouteShell
      title="Time & Labor"
      subtitle="Hours tracked and labor allocation"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Time Records"
            subtitle="Time tracking and labor distribution"
          >
            <EmptyState
              icon={Clock}
              title="No time records"
              description="Time tracking entries and labor allocation data will appear here once time reporting is active."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Time Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Hours This Period
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Overtime Hours
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  PTO Balances
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

export default function PayrollTimeLaborPage() {
  return (
    <TierGate
      tier="payroll"
      title="Time & Labor"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollTimeLaborBody />
    </TierGate>
  );
}
