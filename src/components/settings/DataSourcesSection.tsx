"use client";

import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";

interface PlaidData {
  environment?: string;
  institutions?: unknown[];
  lastSync?: string;
  status?: "healthy" | "reauth" | "disconnected";
}

interface DataSourcesSectionProps {
  plaid: PlaidData | null;
}

export function DataSourcesSection({ plaid }: DataSourcesSectionProps) {
  const getStatusVariant = (status?: string): "ok" | "warn" | "muted" => {
    if (status === "healthy") return "ok";
    if (status === "reauth" || status === "disconnected") return "warn";
    return "muted";
  };

  const getStatusLabel = (status?: string): string => {
    if (status === "healthy") return "Healthy";
    if (status === "reauth") return "Needs Re-auth";
    if (status === "disconnected") return "Disconnected";
    return "—";
  };

  return (
    <SecondaryPanel title="Data Sources" className="bg-card">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plaid Environment</span>
          <span className="font-medium">{plaid?.environment ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connected Institutions</span>
          <span className="font-medium">
            {Array.isArray(plaid?.institutions)
              ? plaid.institutions.length
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Sync</span>
          <span className="font-medium">{plaid?.lastSync ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connection Health</span>
          <StatusChip variant={getStatusVariant(plaid?.status)}>
            {getStatusLabel(plaid?.status)}
          </StatusChip>
        </div>
      </div>
    </SecondaryPanel>
  );
}
