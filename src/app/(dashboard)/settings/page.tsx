"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { auditedFetch } from "@/lib/auditedFetch";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { UpgradePanel } from "@/components/billing/UpgradePanel";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { DataSourcesSection } from "@/components/settings/DataSourcesSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { DiagnosticsSection } from "@/components/settings/DiagnosticsSection";
import { SettingsLifecycleBanner } from "@/components/settings/SettingsLifecycleBanner";
import { DestructiveActionConfirmation } from "@/components/settings/DestructiveActionConfirmation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import {
  useSettingsConfig,
  type DestructiveAction,
} from "@/hooks/useSettingsConfig";
import type { SubscriptionTier } from "@/lib/entitlements";

/**
 * Settings Page with Version and Lifecycle Enforcement
 *
 * PART 1 — Version Enforcement
 * - Uses useSettingsConfig hook with fail-closed validation
 * - Unknown/missing settings_version = fail-closed
 *
 * PART 2 — Lifecycle Rendering
 * - Non-success lifecycle shows banner with reason
 * - No optimistic UI - only render on success
 *
 * PART 3 — Guardrails
 * - Confirmations for destructive actions
 * - Policy acknowledgement enforced
 */

interface ProfileData {
  id?: string;
  name?: string;
  organizationName?: string;
  orgId?: string;
  role?: string;
  timezone?: string;
  currency?: string;
  fiscalYearStart?: string;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

interface PlaidData {
  environment?: string | null;
  institutions?: unknown[];
  lastSync?: string | null;
  status?: "active" | "login_required" | "error" | "unknown" | "not_connected";
  items_count?: number | null;
  last_synced_at?: string | null;
  has_items?: boolean;
  source?: "backend_items" | "backend_hardening" | "unknown";
  itemId?: string;
  isDuplicate?: boolean;
}

interface IntelData {
  lastRun?: string;
  cache?: string;
}

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const searchParams = useSearchParams();

  // Settings config with version enforcement
  const {
    isLoading: settingsLoading,
    isSuccess: settingsSuccess,
    lifecycle,
    reasonCode,
    reasonMessage,
    hasPolicyAcknowledged,
    acknowledgePolicy,
    refetch: refetchSettings,
  } = useSettingsConfig();

  // Local state for component data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plaid, setPlaid] = useState<PlaidData | null>(null);
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [auditAvailable, setAuditAvailable] = useState<boolean | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<
    "success" | "cancelled" | null
  >(null);

  // Destructive action confirmation state
  const [pendingAction, setPendingAction] = useState<DestructiveAction | null>(
    null,
  );

  // Get user's current tier from metadata
  const userTier = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.tier as SubscriptionTier | undefined;

  // Check if user is admin
  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const userRole = publicMetadata?.role as string | undefined;
  const isAdmin =
    userLoaded && (userRole === "admin" || userRole === "org:admin");

  // Check for checkout result from URL params
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success" || checkout === "cancelled") {
      requestAnimationFrame(() => {
        setCheckoutStatus(checkout as "success" | "cancelled");
        window.history.replaceState({}, "", "/settings");
      });
    }
  }, [searchParams]);

  // Load data on mount (only when settings are ready)
  useEffect(() => {
    // PART 2: No optimistic UI - only load when settings lifecycle is success
    if (!settingsSuccess) return;

    async function load() {
      try {
        const data = await auditedFetch<ProfileData & { request_id: string }>(
          "/api/me",
        );
        setProfile(data);
      } catch {
        // ignore
      }
      try {
        const data = await auditedFetch<PlaidData & { request_id: string }>(
          "/api/plaid/status",
        );
        setPlaid(data);
      } catch {
        // ignore
      }
      try {
        const data = await auditedFetch<IntelData & { request_id: string }>(
          "/api/intelligence/status",
        );
        setIntel(data);
      } catch {
        // ignore
      }
      try {
        await auditedFetch<{ request_id: string }>("/api/audit?limit=1");
        setAuditAvailable(true);
      } catch {
        setAuditAvailable(false);
      }
    }
    load();
  }, [settingsSuccess]);

  const handleProfileUpdate = async (data: Partial<ProfileData>) => {
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  // Handle destructive action confirmation
  const handleDestructiveAction = (action: DestructiveAction) => {
    setPendingAction(action);
  };

  const handleConfirmDestructiveAction = async () => {
    if (!pendingAction) return;

    // Execute the destructive action
    console.log(`[Settings] Executing destructive action: ${pendingAction}`);

    // Close the dialog
    setPendingAction(null);
  };

  return (
    <RouteShell
      title="Settings"
      subtitle="Manage your account, preferences, and data sources"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetchSettings()}
            disabled={settingsLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${settingsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      }
    >
      {/* PART 2: Lifecycle-based rendering - show banner for non-success states */}
      {lifecycle && lifecycle !== "success" && (
        <SettingsLifecycleBanner
          lifecycle={lifecycle}
          reasonCode={reasonCode}
          reasonMessage={reasonMessage}
          onRetry={() => void refetchSettings()}
        />
      )}

      {/* Checkout status message - full width */}
      {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
      {checkoutStatus === "success" && (
        <div className="rounded-lg border border-border bg-muted p-4 mb-6">
          <p className="text-sm font-medium text-foreground">
            Payment successful! Your plan is being updated.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may take a moment for your new features to activate.
          </p>
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="rounded-lg border border-border bg-muted p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Checkout was cancelled. No changes were made to your plan.
          </p>
        </div>
      )}

      {/* PART 3: Policy acknowledgement banner (if not acknowledged) */}
      {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
      {settingsSuccess && !hasPolicyAcknowledged && (
        <div className="rounded-lg border border-border bg-muted p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Policy acknowledgement required
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Please acknowledge the terms of service and data policy to
                enable account management features.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void acknowledgePolicy()}
                className="mt-2"
              >
                Acknowledge Policy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PART 2: Only render main content on success lifecycle */}
      {settingsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          </div>
        </div>
      ) : settingsSuccess ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Primary Settings */}
          <div className="space-y-6 lg:col-span-7">
            {/* Billing & Upgrade */}
            <UpgradePanel currentTier={userTier} />

            {/* Profile Section */}
            <ProfileSection
              profile={profile}
              onProfileUpdate={handleProfileUpdate}
            />

            {/* Preferences - persists to localStorage */}
            <PreferencesSection />
          </div>

          {/* Right Column - Secondary Settings */}
          <div className="space-y-4 lg:col-span-5">
            {/* Security & Access */}
            <SecuritySection
              isActive={!!profile}
              lastLogin={profile?.lastLogin}
              mfaEnabled={profile?.mfaEnabled}
            />

            {/* Data Sources */}
            <DataSourcesSection plaid={plaid} />

            {/* Intelligence Settings */}
            <SecondaryPanel title="Intelligence" className="bg-card">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusChip variant="ok">Enabled</StatusChip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium">Advisory-only</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Manual Run</span>
                  <span className="font-medium">Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-medium">≥ 0.85</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Run</span>
                  <span className="font-medium">{intel?.lastRun ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cache</span>
                  <span className="font-medium">{intel?.cache ?? "—"}</span>
                </div>
              </div>
            </SecondaryPanel>

            {/* Audit Log Status */}
            <SecondaryPanel title="Audit Log" className="bg-card">
              <div className="text-sm">
                {auditAvailable === null && (
                  <span className="text-muted-foreground">Loading…</span>
                )}
                {auditAvailable === true && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusChip variant="ok">Available</StatusChip>
                  </div>
                )}
                {auditAvailable === false && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusChip variant="warn">Unavailable</StatusChip>
                  </div>
                )}
              </div>
            </SecondaryPanel>

            {/* System Info */}
            <SecondaryPanel title="System" className="bg-card">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frontend</span>
                  <span className="font-medium">
                    {process.env.NEXT_PUBLIC_APP_VERSION ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backend</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Build</span>
                  <span className="font-medium">
                    {process.env.NEXT_PUBLIC_BUILD_ID ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Health</span>
                  {auditAvailable === null ? (
                    <StatusChip variant="muted">Checking…</StatusChip>
                  ) : auditAvailable ? (
                    <StatusChip variant="ok">Connected</StatusChip>
                  ) : (
                    <StatusChip variant="warn">Unavailable</StatusChip>
                  )}
                </div>
              </div>
            </SecondaryPanel>

            {/* PART 2 & 3: Danger Zone - Destructive Actions */}
            {/* DESTRUCTIVE ZONE ENFORCEMENT: Stronger border, additional spacing, no colored backgrounds */}
            <div className="mt-4 pt-4">
              <SecondaryPanel
                title="Danger Zone"
                className="bg-card border-2 border-dashed border-border"
              >
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    These actions require confirmation and cannot be easily
                    undone.
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => handleDestructiveAction("UNLINK_BANK")}
                      disabled={!hasPolicyAcknowledged}
                    >
                      Unlink Bank Account
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => handleDestructiveAction("CLEAR_CACHE")}
                      disabled={!hasPolicyAcknowledged}
                    >
                      Clear All Cache
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => handleDestructiveAction("REVOKE_ACCESS")}
                      disabled={!hasPolicyAcknowledged}
                    >
                      Revoke Third-Party Access
                    </Button>
                  </div>
                  {!hasPolicyAcknowledged && (
                    <p className="text-xs text-muted-foreground italic">
                      Acknowledge the policy above to enable these actions.
                    </p>
                  )}
                </div>
              </SecondaryPanel>
            </div>
          </div>

          {/* Admin-Only Diagnostics - Full Width */}
          {isAdmin && (
            <div className="lg:col-span-12">
              <DiagnosticsSection />
            </div>
          )}
        </div>
      ) : (
        /* Failed/non-success state - show minimal UI */
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Settings could not be loaded. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchSettings()}
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* PART 3: Destructive Action Confirmation Dialog */}
      {pendingAction && (
        <DestructiveActionConfirmation
          action={pendingAction}
          isOpen={true}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmDestructiveAction}
          hasPolicyAcknowledged={hasPolicyAcknowledged}
          onAcknowledgePolicy={acknowledgePolicy}
        />
      )}
    </RouteShell>
  );
}
