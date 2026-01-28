"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { BarChart3 } from "lucide-react";

function PayrollReportsBody() {
  return (
    <RouteShell title="Reports" subtitle="Payroll reports and exports">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Payroll Reports"
            subtitle="Generated reports and export history"
          >
            <EmptyState
              icon={BarChart3}
              title="No reports generated"
              description="Payroll reports will appear here once payroll data is available. Reports include payroll summaries, tax filings, and labor cost breakdowns."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Report Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Available Reports
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Last Generated
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  None
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Pending Exports
                </span>
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

export default function PayrollReportsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Reports"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollReportsBody />
    </TierGate>
  );
}
