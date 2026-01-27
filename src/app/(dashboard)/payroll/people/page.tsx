"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Users } from "lucide-react";

function PayrollPeopleBody() {
  return (
    <RouteShell title="People" subtitle="Workforce directory">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Workforce Directory"
            subtitle="Employees and contractors"
          >
            <EmptyState
              icon={Users}
              title="No workforce records"
              description="Employee and contractor records will appear here once they are added to the payroll system."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Directory Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Contractors
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Headcount
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

export default function PayrollPeoplePage() {
  return (
    <TierGate
      tier="payroll"
      title="People"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollPeopleBody />
    </TierGate>
  );
}
