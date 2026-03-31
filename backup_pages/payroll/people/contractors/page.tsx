"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { UserCog } from "lucide-react";

function PayrollContractorsBody() {
  return (
    <RouteShell title="Contractors" subtitle="1099 contractor records">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Contractor Records"
            subtitle="1099 contractor directory"
          >
            <EmptyState
              icon={UserCog}
              title="No contractor records"
              description="1099 contractor records will appear here once contractors are registered in the payroll system."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Contractor Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
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

export default function PayrollContractorsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Contractors"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollContractorsBody />
    </TierGate>
  );
}
