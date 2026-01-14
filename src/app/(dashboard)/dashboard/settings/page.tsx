"use client";

import { useState, useEffect } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Types for API responses
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

interface PreferencesData {
  landingPage: string;
  currencyFormat: string;
  dateFormat: string;
  theme: string;
}

/**
 * A simple status label component with semantic colors for success, warning,
 * error and muted states.
 */
function StatusChip({
  label,
  color,
}: {
  label: string;
  color: "success" | "warning" | "error" | "muted";
}) {
  const colorMap: Record<typeof color, string> = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-700 dark:text-yellow-400",
    error: "text-red-600 dark:text-red-400",
    muted: "text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[color]}`}
    >
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plaid, setPlaid] = useState<PlaidData | null>(null);
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [auditAvailable, setAuditAvailable] = useState<boolean | null>(null);

  // Editable preferences state
  const [preferences, setPreferences] = useState<PreferencesData>({
    landingPage: "Overview",
    currencyFormat: "USD",
    dateFormat: "MM/DD/YYYY",
    theme: "System",
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // Editable profile fields
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    timezone: "",
    currency: "",
    fiscalYearStart: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setProfileForm({
            timezone: data.timezone || "",
            currency: data.currency || "",
            fiscalYearStart: data.fiscalYearStart || "",
          });
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
        /* ignore */
      }
      try {
        const res = await fetch("/api/intelligence/status");
        if (res.ok) {
          const data = await res.json();
          setIntel(data);
        }
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch("/api/audit?limit=1");
        if (res.ok) {
          setAuditAvailable(true);
        } else {
          setAuditAvailable(false);
        }
      } catch {
        setAuditAvailable(false);
      }
    }
    load();
  }, []);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    // TODO: Implement backend PATCH /api/me endpoint
    // For now, update local state
    await new Promise((r) => setTimeout(r, 500));
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            timezone: profileForm.timezone || undefined,
            currency: profileForm.currency || undefined,
            fiscalYearStart: profileForm.fiscalYearStart || undefined,
          }
        : null,
    );
    setProfileSaving(false);
    setEditingProfile(false);
  };

  const handlePreferencesSave = async () => {
    setPreferencesSaving(true);
    // TODO: Implement backend POST /api/preferences endpoint
    await new Promise((r) => setTimeout(r, 500));
    setPreferencesSaving(false);
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 2000);
  };

  return (
    <RouteShell
      title="Settings"
      subtitle="Manage your account and preferences."
    >
      {/* Profile Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </div>
          {!editingProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingProfile(true)}
            >
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <p className="font-medium">{profile?.name ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Organization
              </label>
              <p className="font-medium">{profile?.organizationName ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <p className="font-medium">{profile?.role ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">User ID</label>
              <p className="font-mono text-xs">{profile?.id ?? "—"}</p>
            </div>
          </div>

          {editingProfile ? (
            <div className="mt-4 space-y-4 rounded-lg border p-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Timezone
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={profileForm.timezone}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, timezone: e.target.value }))
                  }
                >
                  <option value="">Select timezone...</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Currency
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={profileForm.currency}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, currency: e.target.value }))
                  }
                >
                  <option value="">Select currency...</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Fiscal Year Start
                </label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={profileForm.fiscalYearStart}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      fiscalYearStart: e.target.value,
                    }))
                  }
                >
                  <option value="">Select month...</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="July">July</option>
                  <option value="October">October</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <label className="text-xs text-muted-foreground">
                  Timezone
                </label>
                <p className="font-medium">{profile?.timezone ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Currency
                </label>
                <p className="font-medium">{profile?.currency ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Fiscal Year Start
                </label>
                <p className="font-medium">{profile?.fiscalYearStart ?? "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Access Section */}
      <Card>
        <CardHeader>
          <CardTitle>Security & Access</CardTitle>
          <CardDescription>
            Authentication settings and session status
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>
            Session:{" "}
            {profile ? (
              <StatusChip label="Active" color="success" />
            ) : (
              <StatusChip label="Unknown" color="muted" />
            )}
          </div>
          <div>Last login: {profile?.lastLogin ?? "—"}</div>
          <div>
            MFA Enabled:{" "}
            {profile?.mfaEnabled ? (
              <StatusChip label="Enabled" color="success" />
            ) : (
              <StatusChip label="Disabled" color="warning" />
            )}
          </div>
          <div>Auth Provider: Clerk (headless)</div>
        </CardContent>
      </Card>

      {/* Data Sources (Plaid) Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Bank connections and sync status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>Plaid Environment: {plaid?.environment ?? "—"}</div>
          <div>
            Connected Institutions:{" "}
            {Array.isArray(plaid?.institutions)
              ? plaid.institutions.length
              : "—"}
          </div>
          <div>Last Sync: {plaid?.lastSync ?? "—"}</div>
          <div>
            Connection Health:{" "}
            {plaid?.status ? (
              <StatusChip
                label={
                  plaid.status === "healthy"
                    ? "Healthy"
                    : plaid.status === "reauth"
                      ? "Needs Re‑auth"
                      : plaid.status === "disconnected"
                        ? "Disconnected"
                        : "Unknown"
                }
                color={
                  plaid.status === "healthy"
                    ? "success"
                    : plaid.status === "reauth"
                      ? "warning"
                      : plaid.status === "disconnected"
                        ? "error"
                        : "muted"
                }
              />
            ) : (
              <StatusChip label="—" color="muted" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Intelligence Section */}
      <Card>
        <CardHeader>
          <CardTitle>Intelligence</CardTitle>
          <CardDescription>Advisory insights configuration</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>
            Enabled: <StatusChip label="Yes" color="success" />
          </div>
          <div>Mode: Advisory‑only</div>
          <div>Manual Run: Required</div>
          <div>Confidence Threshold: ≥ 0.85</div>
          <div>Categories Enabled: Categorization, Duplicates, Cashflow</div>
          <div>Last Run: {intel?.lastRun ?? "—"}</div>
          <div>Cache Status: {intel?.cache ?? "—"}</div>
        </CardContent>
      </Card>

      {/* Audit Log Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>System events and activity</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {auditAvailable === null && <div>Loading…</div>}
          {auditAvailable === true && <div>Audit log is available.</div>}
          {auditAvailable === false && (
            <div>Unable to load audit log. Backend may be unavailable.</div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Section - Editable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customise your workspace experience
            </CardDescription>
          </div>
          {preferencesSaved && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Dashboard Landing Page
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={preferences.landingPage}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, landingPage: e.target.value }))
              }
            >
              <option value="Overview">Overview</option>
              <option value="Transactions">Transactions</option>
              <option value="Intelligence">Intelligence</option>
              <option value="CFO Dashboard">CFO Dashboard</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Currency Format
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={preferences.currencyFormat}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  currencyFormat: e.target.value,
                }))
              }
            >
              <option value="USD">USD ($1,234.56)</option>
              <option value="EUR">EUR (€1.234,56)</option>
              <option value="GBP">GBP (£1,234.56)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Date Format
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={preferences.dateFormat}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, dateFormat: e.target.value }))
              }
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Theme
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={preferences.theme}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, theme: e.target.value }))
              }
            >
              <option value="System">System</option>
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
            </select>
          </div>
          <Button
            size="sm"
            onClick={handlePreferencesSave}
            disabled={preferencesSaving}
          >
            {preferencesSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* System & Diagnostics Section */}
      <Card>
        <CardHeader>
          <CardTitle>System & Diagnostics</CardTitle>
          <CardDescription>Version information and health</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>Frontend Version: 1.0.0</div>
          <div>Backend Version: —</div>
          <div>Build Number: 28–30</div>
          <div>API Health: Good</div>
          <div>Feature Flags: None</div>
        </CardContent>
      </Card>
    </RouteShell>
  );
}
