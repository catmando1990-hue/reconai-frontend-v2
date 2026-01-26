"use client";

import { useEffect, useState, useCallback } from "react";

interface HealthCheck {
  name: string;
  status: "ok" | "warning" | "error" | "checking";
  message: string;
  latency?: number;
  details?: string;
}

interface ErrorLog {
  timestamp: string;
  type: string;
  message: string;
  source: string;
}

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

interface DialogState {
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

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  // Health & Performance
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    memoryUsage?: string;
    connectionCount?: number;
    avgResponseTime?: number;
  }>({});

  // Dialog state
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    content: "",
    isLoading: false,
    type: null,
    diagnosticResult: null,
  });

  // Fix approval dialog
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>({
    isOpen: false,
    fix: null,
    confirmationInput: "",
    adminNotes: "",
    isApproving: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/admin/maintenance", {
          cache: "no-store",
        });
        if (cancelled) return;

        if (res.status === 401) {
          setError("Not authenticated. Please sign in.");
          return;
        }
        if (res.status === 403) {
          setError("Access denied. Admin only.");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || `Error: ${res.status}`);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setMaintenance(Boolean(data.maintenance));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `Failed to fetch: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const closeDialog = useCallback(() => {
    setDialog((d) => ({ ...d, isOpen: false }));
  }, []);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !maintenance }),
    });
    if (res.ok) {
      const data = await res.json();
      setMaintenance(Boolean(data.maintenance));
    }
    setLoading(false);
  }

  async function handleKillSwitch() {
    setLoading(true);
    setShowKillConfirm(false);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setMaintenance(Boolean(data.maintenance));
    }
    setLoading(false);
  }

  // Run real backend diagnostic
  async function runBackendDiagnostic(
    type: "health" | "performance" | "security" | "bugs",
  ): Promise<DiagnosticResult | null> {
    try {
      const res = await fetch(`/api/admin/diagnose/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          depth: "standard",
          include_fixes: true,
        }),
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
  }

  // Format diagnostic result for display
  function formatDiagnosticResult(result: DiagnosticResult): string {
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
  }

  async function openAnalysisDialog(
    type: "health" | "performance" | "security" | "bugs",
  ) {
    const titles: Record<string, string> = {
      health: "System Health Diagnostic",
      performance: "Performance Diagnostic",
      security: "Security Diagnostic",
      bugs: "Bug Detection Diagnostic",
    };

    setDialog({
      isOpen: true,
      title: titles[type],
      content: "",
      isLoading: true,
      type,
      diagnosticResult: null,
    });

    // Run health scan first if doing health diagnostic
    if (type === "health" && healthChecks.length === 0) {
      await runHealthScan();
    }

    // Try backend diagnostic first
    const backendResult = await runBackendDiagnostic(type);

    if (backendResult) {
      setDialog((d) => ({
        ...d,
        content: formatDiagnosticResult(backendResult),
        isLoading: false,
        diagnosticResult: backendResult,
      }));
    } else {
      // Fallback to simulated analysis if backend unavailable
      const analysis = await runSimulatedAnalysis(type);
      setDialog((d) => ({
        ...d,
        content: analysis,
        isLoading: false,
        diagnosticResult: null,
      }));
    }
  }

  // Simulated analysis fallback
  async function runSimulatedAnalysis(
    type: "health" | "performance" | "security" | "bugs",
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 1000));

    const analyses: Record<string, string> = {
      health: `## Health Analysis Report (Simulated)

**Note:** Backend diagnostic unavailable. Using client-side analysis.

### Summary
${healthChecks.filter((c) => c.status === "ok").length}/${healthChecks.length} services are healthy.

### Recommendations
${healthChecks.some((c) => c.status === "error") ? "- **Critical:** Some services are down. Immediate attention required." : "- All critical services are operational."}
${healthChecks.some((c) => c.status === "warning") ? "- **Warning:** Some services need attention." : ""}`,

      performance: `## Performance Analysis Report (Simulated)

**Note:** Backend diagnostic unavailable.

### Current Metrics
- Backend Response Time: ${performanceMetrics.avgResponseTime || "N/A"}ms
- Client Memory: ${performanceMetrics.memoryUsage || "N/A"}`,

      security: `## Security Scan Report (Simulated)

**Note:** Backend diagnostic unavailable.

### Authentication Status
- Clerk session: ${healthChecks.find((c) => c.name === "Authentication")?.status === "ok" ? "Active" : "Unknown"}
- Admin role: Verified (client-side)`,

      bugs: `## Bug Detection Report (Simulated)

**Note:** Backend diagnostic unavailable.

### Detected Issues
${errorLogs.length > 0 ? errorLogs.map((e) => `- **${e.type}** in ${e.source}: ${e.message}`).join("\n") : "No client-side bugs detected."}`,
    };

    return analyses[type] || "Analysis unavailable.";
  }

  // Open fix approval dialog
  function openApprovalDialog(fix: PendingFix) {
    setApprovalDialog({
      isOpen: true,
      fix,
      confirmationInput: "",
      adminNotes: "",
      isApproving: false,
      error: null,
    });
  }

  // Approve and execute fix
  async function approveFix() {
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

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Failed to approve fix");
      }

      if (data.success) {
        // Success - close dialog and show success
        setApprovalDialog((d) => ({ ...d, isOpen: false }));
        // Update the diagnostic dialog content
        setDialog((d) => ({
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
  }

  async function runHealthScan() {
    setIsScanning(true);
    setErrorLogs([]);

    const checks: HealthCheck[] = [
      { name: "Frontend API", status: "checking", message: "Checking..." },
      { name: "Backend API", status: "checking", message: "Checking..." },
      { name: "Database", status: "checking", message: "Checking..." },
      { name: "Authentication", status: "checking", message: "Checking..." },
      { name: "Plaid Integration", status: "checking", message: "Checking..." },
      {
        name: "Intelligence Service",
        status: "checking",
        message: "Checking...",
      },
    ];
    setHealthChecks([...checks]);

    const errors: ErrorLog[] = [];

    // Check Frontend API (/api/me)
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
      if (!res.ok) {
        errors.push({
          timestamp: new Date().toISOString(),
          type: "API Error",
          message: `Frontend API returned ${res.status}`,
          source: "/api/me",
        });
      }
    } catch (e) {
      checks[0] = {
        name: "Frontend API",
        status: "error",
        message: e instanceof Error ? e.message : "Connection failed",
      };
      errors.push({
        timestamp: new Date().toISOString(),
        type: "Connection Error",
        message: e instanceof Error ? e.message : "Unknown error",
        source: "/api/me",
      });
    }
    setHealthChecks([...checks]);

    // Check Backend API
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
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
    } catch (e) {
      checks[1] = {
        name: "Backend API",
        status: "error",
        message: e instanceof Error ? e.message : "Connection failed",
      };
      errors.push({
        timestamp: new Date().toISOString(),
        type: "Backend Error",
        message: e instanceof Error ? e.message : "Unknown error",
        source: "Backend /health",
      });
    }
    setHealthChecks([...checks]);

    // Check Database (via backend)
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://reconai-backend.onrender.com";
      const res = await fetch(`${backendUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        checks[2] = {
          name: "Database",
          status: data.database === "ok" ? "ok" : "warning",
          message: data.database === "ok" ? "Connected" : "Check backend logs",
        };
      } else {
        checks[2] = {
          name: "Database",
          status: "warning",
          message: "Unable to verify",
        };
      }
    } catch {
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

    // Check Plaid
    try {
      const res = await fetch("/api/plaid/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        checks[4] = {
          name: "Plaid Integration",
          status: data.status === "healthy" ? "ok" : "warning",
          message:
            data.status === "healthy"
              ? `Connected (${data.environment})`
              : data.status || "Unknown status",
        };
      } else {
        checks[4] = {
          name: "Plaid Integration",
          status: "warning",
          message: `Status ${res.status}`,
        };
      }
    } catch (e) {
      checks[4] = {
        name: "Plaid Integration",
        status: "error",
        message: e instanceof Error ? e.message : "Check failed",
      };
      errors.push({
        timestamp: new Date().toISOString(),
        type: "Integration Error",
        message: e instanceof Error ? e.message : "Unknown error",
        source: "Plaid Status",
      });
    }
    setHealthChecks([...checks]);

    // Check Intelligence Service
    try {
      const res = await fetch("/api/intelligence/status", {
        cache: "no-store",
      });
      if (res.ok) {
        checks[5] = {
          name: "Intelligence Service",
          status: "ok",
          message: "Advisory mode active",
        };
      } else {
        checks[5] = {
          name: "Intelligence Service",
          status: "warning",
          message: `Status ${res.status}`,
        };
      }
    } catch (e) {
      checks[5] = {
        name: "Intelligence Service",
        status: "error",
        message: e instanceof Error ? e.message : "Check failed",
      };
    }
    setHealthChecks([...checks]);

    // Set memory usage (client-side only)
    if (typeof window !== "undefined" && "memory" in performance) {
      const mem = (performance as { memory?: { usedJSHeapSize: number } })
        .memory;
      if (mem) {
        setPerformanceMetrics((p) => ({
          ...p,
          memoryUsage: `${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB`,
        }));
      }
    }

    setErrorLogs(errors);
    setIsScanning(false);
  }

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

  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (maintenance === null) return <div className="p-6">Loading...</div>;

  return (
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
              <button
                onClick={() =>
                  setApprovalDialog((d) => ({ ...d, isOpen: false }))
                }
                disabled={approvalDialog.isApproving}
                className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={approveFix}
                disabled={
                  approvalDialog.isApproving ||
                  approvalDialog.confirmationInput.toUpperCase() !==
                    approvalDialog.fix.confirmation_code
                }
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approvalDialog.isApproving
                  ? "Approving..."
                  : "Approve & Execute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Dialog Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold">{dialog.title}</h2>
              </div>
              <button
                onClick={closeDialog}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {dialog.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  <p className="text-muted-foreground">
                    Running diagnostic analysis...
                  </p>
                </div>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {dialog.content.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={i} className="mt-4 text-lg font-bold">
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={i} className="mt-3 font-semibold">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("#### ")) {
                        return (
                          <h4 key={i} className="mt-2 font-medium">
                            {line.replace("#### ", "")}
                          </h4>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={i} className="ml-4">
                            {line.replace("- ", "")}
                          </li>
                        );
                      }
                      if (line.match(/^\d+\./)) {
                        return (
                          <li key={i} className="ml-4 list-decimal">
                            {line.replace(/^\d+\.\s*/, "")}
                          </li>
                        );
                      }
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return (
                          <p key={i} className="my-1 font-bold">
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      }
                      if (line.trim() === "") {
                        return <br key={i} />;
                      }
                      if (line.trim() === "---") {
                        return <hr key={i} className="my-4" />;
                      }
                      return (
                        <p key={i} className="my-1">
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Pending Fixes Actions */}
                  {dialog.diagnosticResult &&
                    dialog.diagnosticResult.pending_fixes.length > 0 && (
                      <div className="mt-6 rounded border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                          Pending Fixes - Admin Approval Required
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                          AI agents cannot execute fixes automatically. Click a
                          fix to approve and execute it.
                        </p>
                        <div className="space-y-2">
                          {dialog.diagnosticResult.pending_fixes.map((fix) => (
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
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t p-4 dark:border-gray-700">
              <button
                onClick={closeDialog}
                className="rounded border px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
              {!dialog.isLoading && dialog.type && (
                <button
                  onClick={() => openAnalysisDialog(dialog.type!)}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Re-run Diagnostic
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl space-y-6 p-6">
        <h1 className="text-xl font-semibold">Admin Settings</h1>

        {/* Site Kill Switch */}
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-semibold text-red-700 dark:text-red-400">
              Site Kill Switch
            </span>
          </div>
          <p className="mb-4 text-sm text-red-600 dark:text-red-300">
            Immediately take the entire site offline. All users will be
            redirected to the maintenance page. Only admins can access the site.
          </p>

          {!showKillConfirm ? (
            <button
              onClick={() => setShowKillConfirm(true)}
              disabled={loading || maintenance}
              className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {maintenance ? "Site is Offline" : "Kill Site Now"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleKillSwitch}
                disabled={loading}
                className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Killing..." : "Confirm Kill"}
              </button>
              <button
                onClick={() => setShowKillConfirm(false)}
                disabled={loading}
                className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Current Status */}
        <div className="rounded border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">Current Status</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                maintenance
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {maintenance ? "Offline" : "Online"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {maintenance
              ? "Site is in maintenance mode. Only admins can access."
              : "Site is live and accessible to all users."}
          </p>
        </div>

        {/* Maintenance Mode Toggle */}
        <div className="flex items-center justify-between rounded border p-4">
          <div>
            <span className="font-medium">Maintenance Mode</span>
            <p className="text-sm text-muted-foreground">
              Toggle maintenance mode on/off
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`rounded px-4 py-2 font-medium disabled:opacity-50 ${
              maintenance
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-yellow-600 text-white hover:bg-yellow-700"
            }`}
          >
            {loading
              ? "Updating..."
              : maintenance
                ? "Bring Online"
                : "Enable Maintenance"}
          </button>
        </div>

        {/* AI-Powered Diagnostics */}
        <div className="rounded border p-4">
          <div className="mb-4">
            <span className="font-medium">AI-Powered Diagnostics</span>
            <p className="text-sm text-muted-foreground">
              Run sophisticated diagnostic agents. Fixes require admin approval.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openAnalysisDialog("health")}
              className="flex items-center gap-3 rounded border p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Health Agent</div>
                <div className="text-xs text-muted-foreground">
                  System health analysis
                </div>
              </div>
            </button>

            <button
              onClick={() => openAnalysisDialog("performance")}
              className="flex items-center gap-3 rounded border p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Performance Agent</div>
                <div className="text-xs text-muted-foreground">
                  Response times & queries
                </div>
              </div>
            </button>

            <button
              onClick={() => openAnalysisDialog("security")}
              className="flex items-center gap-3 rounded border p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Security Agent</div>
                <div className="text-xs text-muted-foreground">
                  Auth & vulnerabilities
                </div>
              </div>
            </button>

            <button
              onClick={() => openAnalysisDialog("bugs")}
              className="flex items-center gap-3 rounded border p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Bug Detection Agent</div>
                <div className="text-xs text-muted-foreground">
                  Errors & exceptions
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* System Health Scanner */}
        <div className="rounded border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-medium">Quick Health Scan</span>
              <p className="text-sm text-muted-foreground">
                Check all services, APIs, and integrations
              </p>
            </div>
            <button
              onClick={runHealthScan}
              disabled={isScanning}
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isScanning ? "Scanning..." : "Run Scan"}
            </button>
          </div>

          {healthChecks.length > 0 && (
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
          )}
        </div>

        {/* Performance Metrics */}
        {(performanceMetrics.avgResponseTime ||
          performanceMetrics.memoryUsage) && (
          <div className="rounded border p-4">
            <span className="mb-3 block font-medium">Performance Metrics</span>
            <div className="grid grid-cols-2 gap-4">
              {performanceMetrics.avgResponseTime && (
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="text-2xl font-bold">
                    {performanceMetrics.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Backend Response Time
                  </div>
                </div>
              )}
              {performanceMetrics.memoryUsage && (
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="text-2xl font-bold">
                    {performanceMetrics.memoryUsage}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Client Memory Usage
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Detector */}
        {errorLogs.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <span className="mb-3 block font-medium text-red-700 dark:text-red-400">
              Detected Issues ({errorLogs.length})
            </span>
            <div className="space-y-2">
              {errorLogs.map((log, i) => (
                <div
                  key={i}
                  className="rounded bg-white p-3 text-sm dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-600">{log.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.source}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="rounded border p-4">
          <span className="mb-3 block font-medium">Quick Actions</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (window.location.href = "/admin/exports")}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Exports & Provenance
            </button>
            <button
              onClick={() => window.open("/api/admin/debug-claims", "_blank")}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              View Session Claims
            </button>
            <button
              onClick={() =>
                window.open("https://dashboard.clerk.com", "_blank")
              }
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Clerk Dashboard
            </button>
            <button
              onClick={() =>
                window.open("https://vercel.com/dashboard", "_blank")
              }
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Vercel Dashboard
            </button>
            <button
              onClick={() =>
                window.open("https://dashboard.render.com", "_blank")
              }
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Render Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
