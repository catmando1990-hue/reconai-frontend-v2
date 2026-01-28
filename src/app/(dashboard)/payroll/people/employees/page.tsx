"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { UserCheck } from "lucide-react";

function PayrollEmployeesBody() {
  return (
    <RouteShell title="Employees" subtitle="W-2 employee records">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Employee Records"
            subtitle="W-2 employee directory"
          >
            <EmptyState
              icon={UserCheck}
              title="No employee records"
              description="W-2 employee records will appear here once employees are onboarded into the payroll system."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Employee Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">Active</span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">On Leave</span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Terminated
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

export default function PayrollEmployeesPage() {
  return (
    <TierGate
      tier="payroll"
      title="Employees"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollEmployeesBody />
    </TierGate>
  );
}
