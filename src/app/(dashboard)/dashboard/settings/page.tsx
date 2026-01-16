"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { RouteShell } from "@/components/dashboard/RouteShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradePanel } from "@/components/billing/UpgradePanel";
import type { SubscriptionTier } from "@/lib/entitlements";

// Types for diagnostics
interface Finding {
  component: string;
  severity: "info" | "warning" | "critical" | "error";
  message: string;
  details?: Record<string, unknown>;
}

interface PendingFix {
  fix_id: string;
  action: string;
  description: string;
  risk: string;
  downtime: string;
  confirmation_code: string;
  expires_at: string;
}

interface DiagnosticResult {
  type: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  findings: Finding[];
  recommended_fixes: Array<{
    action: string;
    description: string;
    risk: string;
    downtime: string;
  }>;
  pending_fixes: PendingFix[];
  timestamp: string;
}

interface HealthCheck {
  name: string;
  status: "ok" | "warning" | "error" | "checking";
  message: string;
  latency?: number;
}

interface DiagnosticDialogState {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
  type: "health" | "performance" | "security" | "bugs" | null;
  diagnosticResult: DiagnosticResult | null;
}

interface ApprovalDialogState {
  isOpen: boolean;
  fix: PendingFix | null;
  confirmationInput: string;
  adminNotes: string;
  isApproving: boolean;
  error: string | null;
}

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

  // Check for checkout result from URL params
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setCheckoutStatus("success");
      // Clear URL param after showing message
      window.history.replaceState({}, "", "/dashboard/settings");
    } else if (checkout === "cancelled") {
      setCheckoutStatus("cancelled");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [searchParams]);

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

  // Admin-only state
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    avgResponseTime?: number;
    memoryUsage?: string;
  }>({});
  const [diagnosticDialog, setDiagnosticDialog] =
    useState<DiagnosticDialogState>({
      isOpen: false,
      title: "",
      content: "",
      isLoading: false,
      type: null,
      diagnosticResult: null,
    });
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>({
    isOpen: false,
    fix: null,
    confirmationInput: "",
    adminNotes: "",
    isApproving: false,
    error: null,
  });

  // Check if user is admin
  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const userRole = publicMetadata?.role as string | undefined;
  const isAdmin =
    userLoaded && (userRole === "admin" || userRole === "org:admin");

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

  // Admin diagnostic functions
  const closeDiagnosticDialog = useCallback(() => {
    setDiagnosticDialog((d) => ({ ...d, isOpen: false }));
  }, []);

  const runBackendDiagnostic = async (
    type: "health" | "performance" | "security" | "bugs",
  ): Promise<DiagnosticResult | null> => {
    try {
      const res = await fetch(`/api/admin/diagnose/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, depth: "standard", include_fixes: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Diagnostic failed: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error("Backend diagnostic error:", err);
      return null;
    }
  };

  const formatDiagnosticResult = (result: DiagnosticResult): string => {
    const statusEmoji =
      result.status === "healthy"
        ? "✓"
        : result.status === "warning"
          ? "⚠"
          : "✗";
    const lines: string[] = [];
    lines.push(
      `## ${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Diagnostic Report`,
    );
    lines.push("");
    lines.push(
      `### Overall Status: ${statusEmoji} ${result.status.toUpperCase()}`,
    );
    lines.push(`**Score:** ${result.score}/100`);
    lines.push("");
    if (result.findings.length > 0) {
      lines.push("### Findings");
      for (const finding of result.findings) {
        const severityIcon =
          finding.severity === "critical"
            ? "🔴"
            : finding.severity === "warning" || finding.severity === "error"
              ? "🟡"
              : "🔵";
        lines.push(
          `- ${severityIcon} **${finding.component}**: ${finding.message}`,
        );
      }
      lines.push("");
    } else {
      lines.push("### Findings");
      lines.push("- No issues detected");
      lines.push("");
    }
    if (result.pending_fixes.length > 0) {
      lines.push("### Available Fixes (Require Admin Approval)");
      lines.push("");
      lines.push(
        "**Important:** AI agents cannot execute fixes automatically. You must approve each fix by entering the confirmation code.",
      );
      lines.push("");
      for (const fix of result.pending_fixes) {
        lines.push(`#### ${fix.action}`);
        lines.push(`- **Description:** ${fix.description}`);
        lines.push(`- **Risk Level:** ${fix.risk}`);
        lines.push(`- **Downtime:** ${fix.downtime}`);
        lines.push(`- **Confirmation Code:** \`${fix.confirmation_code}\``);
        lines.push(
          `- **Expires:** ${new Date(fix.expires_at).toLocaleTimeString()}`,
        );
        lines.push("");
      }
    }
    lines.push(`---`);
    lines.push(`*Generated at ${new Date(result.timestamp).toLocaleString()}*`);
    return lines.join("\n");
  };

  const openDiagnosticDialog = async (
    type: "health" | "performance" | "security" | "bugs",
  ) => {
    const titles: Record<string, string> = {
      health: "System Health Diagnostic",
      performance: "Performance Diagnostic",
      security: "Security Diagnostic",
      bugs: "Bug Detection Diagnostic",
    };
    setDiagnosticDialog({
      isOpen: true,
      title: titles[type],
      content: "",
      isLoading: true,
      type,
      diagnosticResult: null,
    });
    const backendResult = await runBackendDiagnostic(type);
    if (backendResult) {
      setDiagnosticDialog((d) => ({
        ...d,
        content: formatDiagnosticResult(backendResult),
        isLoading: false,
        diagnosticResult: backendResult,
      }));
    } else {
      setDiagnosticDialog((d) => ({
        ...d,
        content: `## ${type.charAt(0).toUpperCase() + type.slice(1)} Diagnostic\n\n**Note:** Backend diagnostic unavailable. Please check that the backend is running.`,
        isLoading: false,
        diagnosticResult: null,
      }));
    }
  };

  const openApprovalDialog = (fix: PendingFix) => {
    setApprovalDialog({
      isOpen: true,
      fix,
      confirmationInput: "",
      adminNotes: "",
      isApproving: false,
      error: null,
    });
  };

  const approveFix = async () => {
    if (!approvalDialog.fix) return;
    setApprovalDialog((d) => ({ ...d, isApproving: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/fixes/${approvalDialog.fix.fix_id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: approvalDialog.fix.action,
            confirmation_code: approvalDialog.confirmationInput,
            admin_notes: approvalDialog.adminNotes || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.detail || "Failed to approve fix");
      if (data.success) {
        setApprovalDialog((d) => ({ ...d, isOpen: false }));
        setDiagnosticDialog((d) => ({
          ...d,
          content:
            d.content +
            `\n\n---\n### Fix Executed Successfully\n**${approvalDialog.fix?.action}**: ${data.message}`,
        }));
      } else {
        setApprovalDialog((d) => ({
          ...d,
          error: data.message || "Fix execution failed",
          isApproving: false,
        }));
      }
    } catch (err) {
      setApprovalDialog((d) => ({
        ...d,
        error: err instanceof Error ? err.message : "Unknown error",
        isApproving: false,
      }));
    }
  };

  const runHealthScan = async () => {
    setIsScanning(true);
    const checks: HealthCheck[] = [
      { name: "Frontend API", status: "checking", message: "Checking..." },
      { name: "Backend API", status: "checking", message: "Checking..." },
      { name: "Database", status: "checking", message: "Checking..." },
      { name: "Authentication", status: "checking", message: "Checking..." },
    ];
    setHealthChecks([...checks]);

    // Check Frontend API
    try {
      const start = performance.now();
      const res = await fetch("/api/me", { cache: "no-store" });
      const latency = Math.round(performance.now() - start);
      checks[0] = {
        name: "Frontend API",
        status: res.ok ? "ok" : "warning",
        message: res.ok ? `Responding (${latency}ms)` : `Status ${res.status}`,
        latency,
      };
    } catch (e) {
      checks[0] = {
        name: "Frontend API",
        status: "error",
        message: e instanceof Error ? e.message : "Connection failed",
      };
    }
    setHealthChecks([...checks]);

    // Check Backend API
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://reconai-backend.onrender.com";
      const start = performance.now();
      const res = await fetch(`${backendUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      const latency = Math.round(performance.now() - start);
      checks[1] = {
        name: "Backend API",
        status: res.ok ? "ok" : "warning",
        message: res.ok ? `Healthy (${latency}ms)` : `Status ${res.status}`,
        latency,
      };
      setPerformanceMetrics((p) => ({ ...p, avgResponseTime: latency }));
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        checks[2] = {
          name: "Database",
          status: data.database === "connected" ? "ok" : "warning",
          message:
            data.database === "connected" ? "Connected" : "Check backend logs",
        };
      }
    } catch (e) {
      checks[1] = {
        name: "Backend API",
        status: "error",
        message: e instanceof Error ? e.message : "Connection failed",
      };
      checks[2] = {
        name: "Database",
        status: "warning",
        message: "Unable to check (backend offline)",
      };
    }
    setHealthChecks([...checks]);

    // Check Authentication
    try {
      const res = await fetch("/api/admin/debug-claims", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        checks[3] = {
          name: "Authentication",
          status: data.userId ? "ok" : "warning",
          message: data.userId ? "Clerk session active" : "No session",
        };
      } else {
        checks[3] = {
          name: "Authentication",
          status: "warning",
          message: `Status ${res.status}`,
        };
      }
    } catch (e) {
      checks[3] = {
        name: "Authentication",
        status: "error",
        message: e instanceof Error ? e.message : "Check failed",
      };
    }
    setHealthChecks([...checks]);

    // Set memory usage (client-side only)
    if (typeof window !== "undefined" && "memory" in performance) {
      const mem = (performance as { memory?: { usedJSHeapSize: number } })
        .memory;
      if (mem)
        setPerformanceMetrics((p) => ({
          ...p,
          memoryUsage: `${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB`,
        }));
    }
    setIsScanning(false);
  };

  const getStatusColor = (status: HealthCheck["status"]) => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400 animate-pulse";
    }
  };

  const getStatusBg = (status: HealthCheck["status"]) => {
    switch (status) {
      case "ok":
        return "bg-green-50 dark:bg-green-900/20";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "error":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-800";
    }
  };

  return (
    <RouteShell
      title="Settings"
      subtitle="Manage your account and preferences."
    >
      {/* Checkout status message */}
      {checkoutStatus === "success" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Payment successful! Your plan is being updated.
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            It may take a moment for your new features to activate.
          </p>
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Checkout was cancelled. No changes were made to your plan.
          </p>
        </div>
      )}

      {/* Billing & Upgrade Section */}
      <UpgradePanel currentTier={userTier} />

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

      {/* Admin-Only Diagnostic Tools */}
      {isAdmin && (
        <>
          {/* Fix Approval Dialog */}
          {approvalDialog.isOpen && approvalDialog.fix && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-900">
                <div className="border-b p-4 dark:border-gray-700">
                  <h2 className="text-lg font-semibold">Approve Fix Action</h2>
                  <p className="text-sm text-muted-foreground">
                    Admin approval required to execute this fix
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="rounded bg-yellow-50 p-3 dark:bg-yellow-900/20">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      {approvalDialog.fix.action}
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {approvalDialog.fix.description}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs">
                      <span>Risk: {approvalDialog.fix.risk}</span>
                      <span>Downtime: {approvalDialog.fix.downtime}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Enter Confirmation Code
                    </label>
                    <input
                      type="text"
                      value={approvalDialog.confirmationInput}
                      onChange={(e) =>
                        setApprovalDialog((d) => ({
                          ...d,
                          confirmationInput: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder={approvalDialog.fix.confirmation_code}
                      className="w-full rounded border p-2 font-mono text-lg tracking-wider uppercase dark:bg-gray-800 dark:border-gray-700"
                      maxLength={6}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Code:{" "}
                      <code className="font-bold">
                        {approvalDialog.fix.confirmation_code}
                      </code>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={approvalDialog.adminNotes}
                      onChange={(e) =>
                        setApprovalDialog((d) => ({
                          ...d,
                          adminNotes: e.target.value,
                        }))
                      }
                      placeholder="Reason for approval..."
                      className="w-full rounded border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                      rows={2}
                    />
                  </div>
                  {approvalDialog.error && (
                    <div className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      {approvalDialog.error}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 border-t p-4 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setApprovalDialog((d) => ({ ...d, isOpen: false }))
                    }
                    disabled={approvalDialog.isApproving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={approveFix}
                    disabled={
                      approvalDialog.isApproving ||
                      approvalDialog.confirmationInput.toUpperCase() !==
                        approvalDialog.fix.confirmation_code
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approvalDialog.isApproving
                      ? "Approving..."
                      : "Approve & Execute"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Dialog Modal */}
          {diagnosticDialog.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
                  <h2 className="text-lg font-semibold">
                    {diagnosticDialog.title}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeDiagnosticDialog}
                  >
                    ✕
                  </Button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-4">
                  {diagnosticDialog.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                      <p className="text-muted-foreground">
                        Running diagnostic analysis...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {diagnosticDialog.content}
                      </div>
                      {diagnosticDialog.diagnosticResult &&
                        diagnosticDialog.diagnosticResult.pending_fixes.length >
                          0 && (
                          <div className="mt-6 rounded border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Pending Fixes - Admin Approval Required
                            </h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                              AI agents cannot execute fixes automatically.
                              Click a fix to approve and execute it.
                            </p>
                            <div className="space-y-2">
                              {diagnosticDialog.diagnosticResult.pending_fixes.map(
                                (fix) => (
                                  <button
                                    key={fix.fix_id}
                                    onClick={() => openApprovalDialog(fix)}
                                    className="w-full text-left rounded border border-yellow-400 bg-white p-3 hover:bg-yellow-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        {fix.action}
                                      </span>
                                      <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
                                        {fix.risk} risk
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {fix.description}
                                    </p>
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2 border-t p-4 dark:border-gray-700">
                  <Button variant="outline" onClick={closeDiagnosticDialog}>
                    Close
                  </Button>
                  {!diagnosticDialog.isLoading && diagnosticDialog.type && (
                    <Button
                      onClick={() =>
                        openDiagnosticDialog(diagnosticDialog.type!)
                      }
                    >
                      Re-run Diagnostic
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI-Powered Diagnostics Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Diagnostics</CardTitle>
              <CardDescription>
                Run sophisticated diagnostic agents. Fixes require admin
                approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openDiagnosticDialog("health")}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="text-green-600">✓</span>
                  </div>
                  <div>
                    <div className="font-medium">Health Agent</div>
                    <div className="text-xs text-muted-foreground">
                      System health analysis
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => openDiagnosticDialog("performance")}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-blue-600">⚡</span>
                  </div>
                  <div>
                    <div className="font-medium">Performance Agent</div>
                    <div className="text-xs text-muted-foreground">
                      Response times & queries
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => openDiagnosticDialog("security")}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <span className="text-purple-600">🛡</span>
                  </div>
                  <div>
                    <div className="font-medium">Security Agent</div>
                    <div className="text-xs text-muted-foreground">
                      Auth & vulnerabilities
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => openDiagnosticDialog("bugs")}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <span className="text-red-600">🐛</span>
                  </div>
                  <div>
                    <div className="font-medium">Bug Detection Agent</div>
                    <div className="text-xs text-muted-foreground">
                      Errors & exceptions
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Health Scan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quick Health Scan</CardTitle>
                <CardDescription>
                  Check all services, APIs, and integrations
                </CardDescription>
              </div>
              <Button onClick={runHealthScan} disabled={isScanning}>
                {isScanning ? "Scanning..." : "Run Scan"}
              </Button>
            </CardHeader>
            {healthChecks.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {healthChecks.map((check) => (
                    <div
                      key={check.name}
                      className={`flex items-center justify-between rounded p-3 ${getStatusBg(check.status)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${getStatusColor(check.status)}`}
                        />
                        <span className="font-medium">{check.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {check.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Performance Metrics */}
          {(performanceMetrics.avgResponseTime ||
            performanceMetrics.memoryUsage) && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {performanceMetrics.avgResponseTime && (
                    <div className="rounded bg-muted p-3">
                      <div className="text-2xl font-bold">
                        {performanceMetrics.avgResponseTime}ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Backend Response Time
                      </div>
                    </div>
                  )}
                  {performanceMetrics.memoryUsage && (
                    <div className="rounded bg-muted p-3">
                      <div className="text-2xl font-bold">
                        {performanceMetrics.memoryUsage}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client Memory Usage
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </RouteShell>
  );
}
