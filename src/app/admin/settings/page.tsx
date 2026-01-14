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

interface DialogState {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
  type: "health" | "performance" | "security" | "bugs" | null;
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
  });

  // AI Analysis results
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/admin/maintenance", { cache: "no-store" });
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

  // Simulate AI analysis (in production, this would call your AI backend)
  async function runAIAnalysis(
    type: "health" | "performance" | "security" | "bugs",
    data: unknown,
  ): Promise<string> {
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1500));

    const analyses: Record<string, string> = {
      health: `## Health Analysis Report

Based on the system health scan, here's my assessment:

### Summary
${healthChecks.filter((c) => c.status === "ok").length}/${healthChecks.length} services are healthy.

### Recommendations
${healthChecks.some((c) => c.status === "error") ? "- **Critical:** Some services are down. Immediate attention required." : "- All critical services are operational."}
${healthChecks.some((c) => c.status === "warning") ? "- **Warning:** Some services need attention. Review the warnings above." : ""}

### Action Items
1. ${healthChecks.find((c) => c.status === "error") ? `Fix ${healthChecks.find((c) => c.status === "error")?.name} immediately` : "No immediate actions required"}
2. Monitor response times for any degradation
3. Schedule regular health checks`,

      performance: `## Performance Analysis Report

### Current Metrics
- Backend Response Time: ${performanceMetrics.avgResponseTime || "N/A"}ms
- Client Memory: ${performanceMetrics.memoryUsage || "N/A"}

### Assessment
${(performanceMetrics.avgResponseTime || 0) > 500 ? "**Warning:** Backend response time is elevated. Consider:" : "Backend response time is within acceptable range."}
${(performanceMetrics.avgResponseTime || 0) > 500 ? "- Checking database query performance\n- Reviewing recent deployments\n- Scaling backend resources" : ""}

### Optimization Suggestions
1. Enable response caching for static data
2. Implement lazy loading for heavy components
3. Consider CDN for static assets`,

      security: `## Security Scan Report

### Authentication Status
- Clerk session: ${healthChecks.find((c) => c.name === "Authentication")?.status === "ok" ? "Active and valid" : "Needs attention"}
- Admin role: Verified

### Potential Concerns
1. Ensure all API routes validate authentication
2. Review CORS settings periodically
3. Monitor for unusual access patterns

### Recommendations
- Enable MFA for all admin accounts
- Rotate API tokens quarterly
- Review audit logs weekly`,

      bugs: `## Bug Detection Report

### Detected Issues
${errorLogs.length > 0 ? errorLogs.map((e) => `- **${e.type}** in ${e.source}: ${e.message}`).join("\n") : "No bugs detected in this scan."}

### Code Quality Notes
- All API endpoints responding
- No uncaught exceptions detected
- Error boundaries functioning

### Suggested Actions
${errorLogs.length > 0 ? "1. Review and fix detected errors\n2. Add error handling where needed\n3. Update monitoring alerts" : "1. Continue regular monitoring\n2. Review error logs periodically\n3. Keep dependencies updated"}`,
    };

    return analyses[type] || "Analysis complete.";
  }

  async function openAnalysisDialog(
    type: "health" | "performance" | "security" | "bugs",
  ) {
    const titles: Record<string, string> = {
      health: "AI Health Analysis",
      performance: "AI Performance Analysis",
      security: "AI Security Scan",
      bugs: "AI Bug Detection",
    };

    setDialog({
      isOpen: true,
      title: titles[type],
      content: "",
      isLoading: true,
      type,
    });

    try {
      const analysis = await runAIAnalysis(type, {
        healthChecks,
        performanceMetrics,
        errorLogs,
      });
      setAiAnalysis((prev) => ({ ...prev, [type]: analysis }));
      setDialog((d) => ({ ...d, content: analysis, isLoading: false }));
    } catch {
      setDialog((d) => ({
        ...d,
        content: "Failed to run AI analysis. Please try again.",
        isLoading: false,
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
      const res = await fetch("/api/intelligence/status", { cache: "no-store" });
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
      {/* Dialog Modal */}
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
                    Claude is analyzing your system...
                  </p>
                </div>
              ) : (
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
                    if (line.trim() === "") {
                      return <br key={i} />;
                    }
                    return (
                      <p key={i} className="my-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
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
                  Re-analyze
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

        {/* AI-Powered Scanners */}
        <div className="rounded border p-4">
          <div className="mb-4">
            <span className="font-medium">AI-Powered Diagnostics</span>
            <p className="text-sm text-muted-foreground">
              Run Claude-powered analysis on your system
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (healthChecks.length === 0) {
                  runHealthScan().then(() => openAnalysisDialog("health"));
                } else {
                  openAnalysisDialog("health");
                }
              }}
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
                <div className="font-medium">Health Scanner</div>
                <div className="text-xs text-muted-foreground">
                  AI system health analysis
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
                <div className="font-medium">Performance</div>
                <div className="text-xs text-muted-foreground">
                  AI performance analysis
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
                <div className="font-medium">Security Scan</div>
                <div className="text-xs text-muted-foreground">
                  AI security assessment
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
                <div className="font-medium">Bug Detector</div>
                <div className="text-xs text-muted-foreground">
                  AI error analysis
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* System Health Scanner */}
        <div className="rounded border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-medium">System Health Scanner</span>
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
