"use client";

import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";

interface SecuritySectionProps {
  isActive: boolean;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export function SecuritySection({
  isActive,
  lastLogin,
  mfaEnabled,
}: SecuritySectionProps) {
  return (
    <SecondaryPanel title="Security & Access" className="bg-card">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Session</span>
          <StatusChip variant={isActive ? "ok" : "muted"}>
            {isActive ? "Active" : "Unknown"}
          </StatusChip>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Login</span>
          <span className="font-medium">{lastLogin ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">MFA Status</span>
          <StatusChip variant={mfaEnabled ? "ok" : "warn"}>
            {mfaEnabled ? "Enabled" : "Disabled"}
          </StatusChip>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Auth Provider</span>
          <span className="font-medium">Clerk (headless)</span>
        </div>
      </div>
    </SecondaryPanel>
  );
}
