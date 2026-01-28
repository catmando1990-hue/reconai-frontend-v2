"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { BookOpen } from "lucide-react";

function PayrollAccountingBody() {
  return (
    <RouteShell
      title="Payroll Accounting"
      subtitle="Journal entries and GL integration"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Journal Entries"
            subtitle="Payroll-generated accounting entries"
          >
            <EmptyState
              icon={BookOpen}
              title="No journal entries"
              description="Payroll-generated journal entries and GL postings will appear here once pay runs produce accounting records."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Accounting Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Pending Entries
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Posted Entries
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  GL Accounts Mapped
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

export default function PayrollAccountingPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll Accounting"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollAccountingBody />
    </TierGate>
  );
}
