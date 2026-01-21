"use client";

import { useState } from "react";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { ManualSyncSection } from "@/components/settings/ManualSyncSection";
import { ReconnectBankSection } from "@/components/settings/ReconnectBankSection";
import { DuplicateItemWarning } from "@/components/settings/DuplicateItemWarning";

interface PlaidData {
  environment?: string;
  institutions?: unknown[];
  lastSync?: string;
  status?: "healthy" | "reauth" | "disconnected";
  itemId?: string;
  isDuplicate?: boolean;
}

interface DataSourcesSectionProps {
  plaid: PlaidData | null;
}

export function DataSourcesSection({ plaid }: DataSourcesSectionProps) {
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [duplicateCancelled, setDuplicateCancelled] = useState(false);

  const showDuplicateWarning =
    plaid?.isDuplicate === true &&
    !duplicateAcknowledged &&
    !duplicateCancelled;

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
        <div className="pt-3 border-t space-y-3">
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              ReconAI connects to your financial institution via Plaid to
              retrieve account, balance, and transaction data. ReconAI does not
              store your bank credentials. Access can be revoked at any time.
            </p>
            <p>
              Transaction data is stored securely for financial reporting and
              compliance purposes. Data retention follows ReconAI&apos;s audit
              and compliance policies. You may disconnect your bank at any time
              from Settings.
            </p>
            <p>
              Bank data is not synced automatically. You must manually initiate
              a sync to retrieve new transactions.
            </p>
          </div>
          <DuplicateItemWarning
            isDuplicate={showDuplicateWarning}
            onContinue={() => setDuplicateAcknowledged(true)}
            onCancel={() => setDuplicateCancelled(true)}
          />
          {!duplicateCancelled && (
            <PlaidLinkButton
              onSuccess={(itemId) => {
                // Bank linked - data sync handled by backend
                console.log("Bank linked:", itemId);
              }}
              className="w-full inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Link Bank Account
            </PlaidLinkButton>
          )}
          <ReconnectBankSection
            needsReconnect={plaid?.status === "reauth"}
            itemId={plaid?.itemId}
          />
          <ManualSyncSection />
        </div>
      </div>
    </SecondaryPanel>
  );
}
