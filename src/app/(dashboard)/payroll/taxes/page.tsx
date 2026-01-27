"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Receipt } from "lucide-react";

function PayrollTaxesBody() {
  return (
    <RouteShell
      title="Taxes & Withholdings"
      subtitle="Tax obligations and withholding records"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Tax Records"
            subtitle="Federal, state, and local tax withholdings"
          >
            <EmptyState
              icon={Receipt}
              title="No tax records"
              description="Tax withholding records and filing status will appear here once payroll processing is active."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Tax Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Federal Liability
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  State Liability
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Local Liability
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

export default function PayrollTaxesPage() {
  return (
    <TierGate
      tier="payroll"
      title="Taxes & Withholdings"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollTaxesBody />
    </TierGate>
  );
}
