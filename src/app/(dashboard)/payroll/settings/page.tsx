"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { Settings } from "lucide-react";

function PayrollSettingsBody() {
  return (
    <RouteShell
      title="Payroll Settings"
      subtitle="Payroll configuration and preferences"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Configuration"
            subtitle="Payroll system settings and preferences"
          >
            <EmptyState
              icon={Settings}
              title="No settings configured"
              description="Payroll settings including pay schedules, tax jurisdictions, and integration preferences will be configurable here once initial setup is complete."
            />
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Configuration Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Pay Schedule
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  Not configured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Tax Jurisdictions
                </span>
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa] italic">
                  Not configured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  GL Integration
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

export default function PayrollSettingsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll Settings"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollSettingsBody />
    </TierGate>
  );
}
