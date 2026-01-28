"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { ScrollText } from "lucide-react";

function PayrollAuditTrailBody() {
  return (
    <RouteShell
      title="Audit Trail"
      subtitle="Payroll change log and audit history"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Audit Log"
            subtitle="Chronological record of payroll changes"
          >
            <EmptyState
              icon={ScrollText}
              title="No audit entries"
              description="Payroll audit trail entries will appear here as changes are made to payroll data, configurations, and pay runs."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Audit Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Total Entries
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Last Entry
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  None
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Users Active
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

export default function PayrollAuditTrailPage() {
  return (
    <TierGate
      tier="payroll"
      title="Audit Trail"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollAuditTrailBody />
    </TierGate>
  );
}
