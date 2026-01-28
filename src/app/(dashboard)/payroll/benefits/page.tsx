"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Heart } from "lucide-react";

function PayrollBenefitsBody() {
  return (
    <RouteShell
      title="Benefits & Deductions"
      subtitle="Employee benefits and payroll deductions"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Benefits Administration"
            subtitle="Active benefit plans and deduction schedules"
          >
            <EmptyState
              icon={Heart}
              title="No benefits configured"
              description="Benefit plans and deduction schedules will appear here once benefits administration is set up."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Benefits Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Active Plans
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Enrolled Employees
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Monthly Cost
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

export default function PayrollBenefitsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Benefits & Deductions"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollBenefitsBody />
    </TierGate>
  );
}
