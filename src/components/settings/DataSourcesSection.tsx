"use client";

import { useState } from "react";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { ManualSyncSection } from "@/components/settings/ManualSyncSection";
import { ReconnectBankSection } from "@/components/settings/ReconnectBankSection";
import { DuplicateItemWarning } from "@/components/settings/DuplicateItemWarning";

/**
 * P1 FIX: Updated PlaidData interface to match new honest status contract.
 * Status is now based on actual backend item data, not fabricated from
 * unrelated hardening config.
 */
interface PlaidData {
  environment?: string | null;
  institutions?: unknown[];
  lastSync?: string | null;
  // P1 FIX: New status values from honest status endpoint
  status?: "active" | "login_required" | "error" | "unknown" | "not_connected";
  // Legacy status values for backwards compatibility
  itemId?: string;
  isDuplicate?: boolean;
  // P1 FIX: New fields from status contract
  items_count?: number | null;
  last_synced_at?: string | null;
  has_items?: boolean;
  source?: "backend_items" | "backend_hardening" | "unknown";
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

  /**
   * P1 FIX: Updated status mapping to handle new honest status values.
   * "unknown" is now an explicit state, not a fallback.
   */
  const getStatusVariant = (status?: string): "ok" | "warn" | "muted" => {
    if (status === "active") return "ok";
    if (status === "login_required" || status === "error") return "warn";
    if (status === "not_connected") return "muted";
    // "unknown" or undefined - be honest about uncertainty
    return "muted";
  };

  /**
   * P1 FIX: Updated status labels to be honest about what we know.
   * "Unknown" is now explicitly displayed when status cannot be determined.
   */
  const getStatusLabel = (status?: string): string => {
    if (status === "active") return "Active";
    if (status === "login_required") return "Needs Re-auth";
    if (status === "error") return "Error";
    if (status === "not_connected") return "Not Connected";
    if (status === "unknown") return "Unknown";
    // Legacy status values for backwards compatibility
    if (status === "healthy") return "Active";
    if (status === "reauth") return "Needs Re-auth";
    if (status === "disconnected") return "Not Connected";
    return "Unknown";
  };

  /**
   * P1 FIX: Format last sync timestamp honestly.
   * Returns "Unknown" if timestamp is null/undefined, never fabricates a time.
   */
  const formatLastSync = (): string => {
    // Check both new and legacy field names
    const timestamp = plaid?.last_synced_at ?? plaid?.lastSync;
    if (!timestamp) return "Unknown";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  /**
   * P1 FIX: Get connected items count honestly.
   * Returns "Unknown" if count is null/undefined.
   */
  const getItemsCount = (): string => {
    if (plaid?.items_count !== null && plaid?.items_count !== undefined) {
      return String(plaid.items_count);
    }
    if (Array.isArray(plaid?.institutions)) {
      return String(plaid.institutions.length);
    }
    return "Unknown";
  };

  return (
    <SecondaryPanel title="Data Sources" className="bg-card">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plaid Environment</span>
          <span className="font-medium">{plaid?.environment ?? "Unknown"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connected Accounts</span>
          <span className="font-medium">{getItemsCount()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Sync</span>
          <span className="font-medium">{formatLastSync()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Connection Status</span>
          <StatusChip variant={getStatusVariant(plaid?.status)}>
            {getStatusLabel(plaid?.status)}
          </StatusChip>
        </div>
        {/* P1 FIX: Show data source indicator when status cannot be fully verified */}
        {plaid?.source === "unknown" && (
          <div className="text-xs text-muted-foreground italic">
            Status could not be verified from backend.
          </div>
        )}
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
            needsReconnect={plaid?.status === "login_required"}
            itemId={plaid?.itemId}
          />
          <ManualSyncSection />
        </div>
      </div>
    </SecondaryPanel>
  );
}
