"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Play } from "lucide-react";

function PayrollPayRunsBody() {
  return (
    <RouteShell title="Pay Runs" subtitle="Payroll processing cycles">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Pay Run History"
            subtitle="Completed and upcoming payroll cycles"
          >
            <EmptyState
              icon={Play}
              title="No pay runs recorded"
              description="Payroll processing cycles will appear here once pay runs are initiated and completed."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Pay Run Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Next Scheduled
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  Not scheduled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Last Completed
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  None
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Pay Frequency
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  Not configured
                </span>
              </div>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollPayRunsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Pay Runs"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollPayRunsBody />
    </TierGate>
  );
}
