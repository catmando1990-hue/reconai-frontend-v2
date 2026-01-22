"use client";

import { useState, useCallback } from "react";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { Button } from "@/components/ui/button";
import { Activity, Zap, Shield, Bug } from "lucide-react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

// Types for diagnostics
interface Finding {
  component: string;
  severity: "info" | "warning" | "critical" | "error";
  message: string;
}

interface DiagnosticRunResult {
  request_id: string;
  ok: boolean;
  agent: string;
  started_at: string;
  completed_at: string;
  results_summary: string;
  findings: Finding[];
  severity_counts: Record<string, number>;
}

interface HealthCheck {
  name: string;
  status: "ok" | "warning" | "error" | "checking";
  message: string;
  latency?: number;
}

const CONFIRMATION_PHRASES: Record<string, string> = {
  health: "RUN HEALTH AGENT",
  performance: "RUN PERFORMANCE AGENT",
  security: "RUN SECURITY AGENT",
  bugs: "RUN BUG DETECTION AGENT",
};

type DiagnosticType = "health" | "performance" | "security" | "bugs";

export function DiagnosticsSection() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    avgResponseTime?: number;
    memoryUsage?: string;
  }>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<DiagnosticType | null>(null);
  const [modalStep, setModalStep] = useState<"confirm" | "running" | "results">(
    "confirm",
  );
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticRunResult | null>(null);

  const openModal = (type: DiagnosticType) => {
    setModalType(type);
    setModalStep("confirm");
    setConfirmInput("");
    setConfirmError(null);
    setResult(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  const runDiagnostic = async () => {
    if (!modalType) return;

    const expectedPhrase = CONFIRMATION_PHRASES[modalType];
    if (confirmInput !== expectedPhrase) {
      setConfirmError(`Expected: "${expectedPhrase}"`);
      return;
    }

    setModalStep("running");
    setConfirmError(null);

    const agentMap: Record<string, string> = {
      health: "health",
      performance: "performance",
      security: "security",
      bugs: "bug_detection",
    };

    try {
      const data = await auditedFetch<DiagnosticRunResult>(
        "/api/diagnostics/run",
        {
          method: "POST",
          body: JSON.stringify({
            agent: agentMap[modalType],
            confirm: confirmInput,
          }),
        },
      );

      setResult(data);
      setModalStep("results");
    } catch (err) {
      setResult(null);
      if (err instanceof AuditProvenanceError) {
        setConfirmError(`Provenance error: ${err.message}`);
      } else if (err instanceof HttpError) {
        setConfirmError(`HTTP ${err.status}: ${err.message}`);
      } else {
        setConfirmError(err instanceof Error ? err.message : "Diagnostic failed");
      }
      setModalStep("results");
    }
  };

  const runHealthScan = useCallback(async () => {
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

    // Set memory usage
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
  }, []);

  const getStatusColor = (status: HealthCheck["status"]) => {
    switch (status) {
      case "ok":
        return "bg-primary";
      case "warning":
        return "bg-primary/60";
      case "error":
        return "bg-destructive";
      default:
        return "bg-muted-foreground animate-pulse";
    }
  };

  const diagnosticAgents = [
    {
      type: "health" as const,
      icon: Activity,
      label: "Health Agent",
      desc: "System health analysis",
    },
    {
      type: "performance" as const,
      icon: Zap,
      label: "Performance Agent",
      desc: "Response times & queries",
    },
    {
      type: "security" as const,
      icon: Shield,
      label: "Security Agent",
      desc: "Auth & vulnerabilities",
    },
    {
      type: "bugs" as const,
      icon: Bug,
      label: "Bug Detection Agent",
      desc: "Errors & exceptions",
    },
  ];

  return (
    <>
      {/* AI-Powered Diagnostics */}
      <SecondaryPanel title="AI-Powered Diagnostics" className="bg-card">
        <p className="text-xs text-muted-foreground mb-4">
          Run diagnostic agents. Fixes require admin approval.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {diagnosticAgents.map((agent) => {
            const Icon = agent.icon;
            return (
              <button
                key={agent.type}
                onClick={() => openModal(agent.type)}
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-left hover:bg-accent transition text-sm"
              >
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-xs">{agent.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SecondaryPanel>

      {/* Quick Health Scan */}
      <SecondaryPanel title="Quick Health Scan" className="bg-card">
        <div className="space-y-3">
          <Button size="sm" onClick={runHealthScan} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Run Scan"}
          </Button>
          {healthChecks.length > 0 && (
            <div className="space-y-2">
              {healthChecks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-center justify-between rounded p-2 bg-muted text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(check.status)}`}
                    />
                    <span className="font-medium text-xs">{check.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SecondaryPanel>

      {/* Performance Metrics */}
      {(performanceMetrics.avgResponseTime ||
        performanceMetrics.memoryUsage) && (
        <SecondaryPanel title="Performance Metrics" className="bg-card">
          <div className="grid grid-cols-2 gap-3">
            {performanceMetrics.avgResponseTime && (
              <div className="rounded bg-muted p-3">
                <div className="text-xl font-bold">
                  {performanceMetrics.avgResponseTime}ms
                </div>
                <div className="text-xs text-muted-foreground">
                  Backend Response
                </div>
              </div>
            )}
            {performanceMetrics.memoryUsage && (
              <div className="rounded bg-muted p-3">
                <div className="text-xl font-bold">
                  {performanceMetrics.memoryUsage}
                </div>
                <div className="text-xs text-muted-foreground">
                  Client Memory
                </div>
              </div>
            )}
          </div>
        </SecondaryPanel>
      )}

      {/* Diagnostic Modal */}
      {modalOpen && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold">
                {modalType.charAt(0).toUpperCase() + modalType.slice(1)}{" "}
                Diagnostic
              </h2>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                ✕
              </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-4">
              {modalStep === "confirm" && (
                <div className="space-y-4">
                  {/* BACKGROUND NORMALIZATION: No decorative colors - use border-border bg-muted */}
                  <div className="rounded border-2 border-border bg-muted p-4">
                    <h3 className="font-semibold text-sm">
                      Admin Confirmation Required
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Type the exact phrase to run this diagnostic:
                    </p>
                    <code className="block mt-2 p-2 bg-background rounded text-xs font-mono">
                      {CONFIRMATION_PHRASES[modalType]}
                    </code>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Confirmation Phrase:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => {
                        setConfirmInput(e.target.value);
                        setConfirmError(null);
                      }}
                      placeholder="Type the exact phrase..."
                      className="w-full rounded border border-border bg-background p-2 text-sm"
                    />
                    {confirmError && (
                      <p className="mt-2 text-xs text-destructive">
                        {confirmError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {modalStep === "running" && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  <p className="text-sm text-muted-foreground">
                    Running diagnostic...
                  </p>
                </div>
              )}

              {modalStep === "results" && (
                <div className="space-y-4">
                  {result ? (
                    <>
                      {/* BACKGROUND NORMALIZATION: No decorative colors - use bg-muted */}
                      <div
                        className="rounded p-3 bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              result.ok ? "text-primary" : "text-destructive"
                            }
                          >
                            {result.ok ? "✓" : "✗"}
                          </span>
                          <span className="font-medium text-sm">
                            {result.ok ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.results_summary}
                        </p>
                      </div>
                      {result.findings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold mb-2">
                            Findings:
                          </h4>
                          <div className="space-y-1">
                            {result.findings.map((f, i) => (
                              <div
                                key={i}
                                className="text-xs p-2 rounded bg-muted"
                              >
                                <span className="font-medium">
                                  {f.component}:
                                </span>{" "}
                                {f.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Request ID: <code>{result.request_id}</code>
                      </div>
                    </>
                  ) : (
                    /* BACKGROUND NORMALIZATION: No decorative colors - use bg-muted */
                    <div className="rounded p-3 bg-muted">
                      <p className="text-sm text-muted-foreground">
                        {confirmError || "Diagnostic failed"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button variant="outline" size="sm" onClick={closeModal}>
                {modalStep === "confirm" ? "Cancel" : "Close"}
              </Button>
              {modalStep === "confirm" && (
                <Button
                  size="sm"
                  onClick={runDiagnostic}
                  disabled={!confirmInput}
                >
                  Run Diagnostic
                </Button>
              )}
              {modalStep === "results" && (
                <Button size="sm" onClick={() => openModal(modalType)}>
                  Re-run
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
