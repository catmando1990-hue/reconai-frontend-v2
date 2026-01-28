"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Camera } from "lucide-react";

function PayrollSnapshotsBody() {
  return (
    <RouteShell
      title="Snapshots"
      subtitle="Point-in-time payroll state captures"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Payroll Snapshots"
            subtitle="Historical payroll state records"
          >
            <EmptyState
              icon={Camera}
              title="No snapshots captured"
              description="Point-in-time payroll snapshots will appear here as they are generated at the end of each pay period or on demand."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Snapshot Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Total Snapshots
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Latest Snapshot
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  None
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Retention Period
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

export default function PayrollSnapshotsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Snapshots"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollSnapshotsBody />
    </TierGate>
  );
}
