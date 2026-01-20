"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { UpgradePanel } from "@/components/billing/UpgradePanel";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { DataSourcesSection } from "@/components/settings/DataSourcesSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { DiagnosticsSection } from "@/components/settings/DiagnosticsSection";
import type { SubscriptionTier } from "@/lib/entitlements";

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
  environment?: string;
  institutions?: unknown[];
  lastSync?: string;
  status?: "healthy" | "reauth" | "disconnected";
}

interface IntelData {
  lastRun?: string;
  cache?: string;
}

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plaid, setPlaid] = useState<PlaidData | null>(null);
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [auditAvailable, setAuditAvailable] = useState<boolean | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<
    "success" | "cancelled" | null
  >(null);

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
      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        setCheckoutStatus(checkout as "success" | "cancelled");
        window.history.replaceState({}, "", "/settings");
      });
    }
  }, [searchParams]);

  // Load data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // ignore
      }
      try {
        const res = await fetch("/api/plaid/status");
        if (res.ok) {
          const data = await res.json();
          setPlaid(data);
        }
      } catch {
        // ignore
      }
      try {
        const res = await fetch("/api/intelligence/status");
        if (res.ok) {
          const data = await res.json();
          setIntel(data);
        }
      } catch {
        // ignore
      }
      try {
        const res = await fetch("/api/audit?limit=1");
        setAuditAvailable(res.ok);
      } catch {
        setAuditAvailable(false);
      }
    }
    load();
  }, []);

  const handleProfileUpdate = async (data: Partial<ProfileData>) => {
    // TODO: Implement backend PATCH /api/me endpoint
    await new Promise((r) => setTimeout(r, 500));
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const handlePreferencesSave = async () => {
    // TODO: Implement backend POST /api/preferences endpoint
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <RouteShell
      title="Settings"
      subtitle="Manage your account, preferences, and data sources"
    >
      {/* Checkout status message - full width */}
      {checkoutStatus === "success" && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 mb-6">
          <p className="text-sm font-medium">
            Payment successful! Your plan is being updated.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may take a moment for your new features to activate.
          </p>
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Checkout was cancelled. No changes were made to your plan.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - Primary Settings */}
        <div className="space-y-6 lg:col-span-8">
          {/* Billing & Upgrade */}
          <UpgradePanel currentTier={userTier} />

          {/* Profile Section */}
          <ProfileSection
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />

          {/* Preferences */}
          <PreferencesSection onSave={handlePreferencesSave} />
        </div>

        {/* Right Column - Secondary Settings */}
        <div className="space-y-4 lg:col-span-4">
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
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Backend</span>
                <span className="font-medium">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Build</span>
                <span className="font-medium">28–30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Health</span>
                <StatusChip variant="ok">Good</StatusChip>
              </div>
            </div>
          </SecondaryPanel>
        </div>

        {/* Admin-Only Diagnostics - Full Width */}
        {isAdmin && (
          <div className="lg:col-span-12">
            <DiagnosticsSection />
          </div>
        )}
      </div>
    </RouteShell>
  );
}
