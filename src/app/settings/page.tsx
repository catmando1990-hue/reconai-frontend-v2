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

/**
 * A simple status label component with semantic colors for success, warning,
 * error and muted states. This avoids pulling in additional dependencies
 * while maintaining semantic-token driven color mapping for both light and
 * dark themes. You can replace this with an existing StatusChip if one
 * becomes available in the codebase.
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
  // Basic state for various settings data. These values are fetched once
  // on mount to avoid polling, in accordance with the performance laws.
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plaid, setPlaid] = useState<PlaidData | null>(null);
  const [intel, setIntel] = useState<IntelData | null>(null);
  const [auditAvailable, setAuditAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch profile information
    async function load() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // ignore errors silently – UI will show placeholders
      }
      // Fetch Plaid status
      try {
        const res = await fetch("/api/plaid/status");
        if (res.ok) {
          const data = await res.json();
          setPlaid(data);
        }
      } catch {
        /* ignore */
      }
      // Fetch Intelligence status
      try {
        const res = await fetch("/api/intelligence/status");
        if (res.ok) {
          const data = await res.json();
          setIntel(data);
        }
      } catch {
        /* ignore */
      }
      // Attempt to detect whether audit log is available
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

  return (
    <RouteShell
      title="Settings"
      subtitle="Manage your account and preferences."
    >
      {/* Account & Identity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>Name: {profile?.name ?? "—"}</div>
          <div>Organization: {profile?.organizationName ?? "—"}</div>
          <div>Role: {profile?.role ?? "—"}</div>
          <div>Timezone: {profile?.timezone ?? "—"}</div>
          <div>Currency: {profile?.currency ?? "—"}</div>
          <div>Fiscal Year Start: {profile?.fiscalYearStart ?? "—"}</div>
          <div>User ID: {profile?.id ?? "—"}</div>
          <div>Org ID: {profile?.orgId ?? "—"}</div>
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

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customise your workspace experience (read‑only)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>Dashboard Landing Page: Overview</div>
          <div>Currency Format: USD</div>
          <div>Date Format: MM/DD/YYYY</div>
          <div>Theme: System</div>
        </CardContent>
      </Card>

      {/* Diagnostics & System Section */}
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
