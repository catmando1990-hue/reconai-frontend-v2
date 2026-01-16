"use client";

import * as React from "react";

type ComplianceFramework = {
  id: string;
  name: string;
  full_name: string;
  description: string;
  controls_count: number;
};

type ComplianceControl = {
  id: string;
  name: string;
  category: string;
  status: "compliant" | "partial" | "non_compliant" | "not_applicable";
};

type ComplianceGap = {
  control_id: string;
  control_name: string;
  category: string;
  current_status: string;
  severity: string;
  remediation: string;
  estimated_effort: string;
};

type ComplianceStatus = {
  overall_status: string;
  compliance_score: number;
  sf1408_compliance: {
    total_controls: number;
    compliant: number;
    partial: number;
    non_compliant: number;
  };
};

export function ComplianceAutomationPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [collecting, setCollecting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "frameworks" | "controls" | "gaps"
  >("frameworks");
  const [frameworks, setFrameworks] = React.useState<ComplianceFramework[]>([]);
  const [controls, setControls] = React.useState<ComplianceControl[]>([]);
  const [gaps, setGaps] = React.useState<ComplianceGap[]>([]);
  const [dcaaStatus, setDcaaStatus] = React.useState<ComplianceStatus | null>(
    null,
  );
  const [requestId, setRequestId] = React.useState<string | null>(null);

  const fetchFrameworks = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/compliance/frameworks`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFrameworks(json.frameworks || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load frameworks");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/compliance/sf1408/mappings`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setControls(json.controls || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load controls");
    } finally {
      setLoading(false);
    }
  };

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/compliance/gaps?framework=sf1408`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setGaps(json.gaps || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load gaps");
    } finally {
      setLoading(false);
    }
  };

  const fetchDcaaStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/api/compliance/dcaa/status`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      setDcaaStatus(json.dcaa_status);
    } catch {
      // Ignore
    }
  };

  const collectEvidence = async () => {
    setCollecting(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/compliance/evidence/collect`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: "sf1408",
          collection_type: "manual",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRequestId(json.request_id);
      alert(`Evidence collected: ${json.total_items} items`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to collect evidence");
    } finally {
      setCollecting(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "frameworks") await fetchFrameworks();
    else if (tab === "controls") await fetchControls();
    else if (tab === "gaps") await fetchGaps();
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchFrameworks();
    fetchDcaaStatus();
  }, [fetchFrameworks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "non_compliant":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Compliance Automation</div>
          <div className="text-xs opacity-70">
            DCAA/SF-1408 compliance tracking and gap analysis (read-only).
          </div>
        </div>
        <button
          type="button"
          onClick={collectEvidence}
          disabled={collecting}
          className="rounded-xl border bg-blue-600 text-white px-3 py-2 text-sm"
        >
          {collecting ? "Collecting..." : "Collect Evidence"}
        </button>
      </div>

      {/* DCAA Status Summary */}
      {dcaaStatus ? (
        <div className="mt-4 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">DCAA Compliance Score</span>
            <span
              className={`px-2 py-1 rounded text-sm ${getStatusColor(dcaaStatus.overall_status)}`}
            >
              {dcaaStatus.compliance_score}%
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">
                {dcaaStatus.sf1408_compliance.compliant}
              </div>
              <div className="opacity-70">Compliant</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">
                {dcaaStatus.sf1408_compliance.partial}
              </div>
              <div className="opacity-70">Partial</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">
                {dcaaStatus.sf1408_compliance.non_compliant}
              </div>
              <div className="opacity-70">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="font-bold">
                {dcaaStatus.sf1408_compliance.total_controls}
              </div>
              <div className="opacity-70">Total</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b pb-2">
        {(["frameworks", "controls", "gaps"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-lg px-3 py-1 text-sm ${activeTab === tab ? "bg-blue-600 text-white" : "border"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {loading ? (
        <div className="mt-3 text-sm opacity-70">Loading...</div>
      ) : activeTab === "frameworks" ? (
        <div className="mt-3 grid gap-2">
          {frameworks.map((f) => (
            <div key={f.id} className="rounded-lg border p-3">
              <div className="font-medium text-sm">{f.name}</div>
              <div className="text-xs opacity-70">{f.full_name}</div>
              <div className="text-xs mt-1">{f.description}</div>
              <div className="text-xs mt-1 opacity-50">
                {f.controls_count} controls
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "controls" ? (
        <div className="mt-3 grid gap-2">
          {controls.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-2 flex justify-between items-center"
            >
              <div>
                <span className="font-mono text-xs opacity-50">{c.id}</span>
                <span className="ml-2 text-sm">{c.name}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs ${getStatusColor(c.status)}`}
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {gaps.length === 0 ? (
            <div className="text-sm opacity-70">
              No compliance gaps identified.
            </div>
          ) : (
            gaps.map((g) => (
              <div
                key={g.control_id}
                className="rounded-lg border border-yellow-200 p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs opacity-50">
                      {g.control_id}
                    </span>
                    <span className="ml-2 text-sm font-medium">
                      {g.control_name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${g.severity === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {g.severity}
                  </span>
                </div>
                <div className="text-xs mt-2 opacity-70">{g.remediation}</div>
                <div className="text-xs mt-1 opacity-50">
                  Effort: {g.estimated_effort}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
