"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { LayoutDashboard } from "lucide-react";

function PayrollOverviewBody() {
  return (
    <RouteShell
      title="Payroll Overview"
      subtitle="Payroll status and key metrics"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Payroll Summary"
            subtitle="Current payroll state across all dimensions"
          >
            <EmptyState
              icon={LayoutDashboard}
              title="No payroll data available"
              description="Payroll overview will display aggregate metrics once employees, compensation, and pay runs are configured."
            />
          </PrimaryPanel>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Key Figures">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">Headcount</span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Monthly Payroll
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">YTD Total</span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
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

export default function PayrollOverviewPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll Overview"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollOverviewBody />
    </TierGate>
  );
}
