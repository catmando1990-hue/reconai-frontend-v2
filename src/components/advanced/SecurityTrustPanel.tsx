"use client";

import * as React from "react";

type Soc2Readiness = {
  overall_score: number;
  total_controls: number;
  compliant: number;
  partial: number;
  non_compliant: number;
  readiness_status: string;
  categories: Record<
    string,
    { total: number; compliant: number; partial: number }
  >;
};

type Soc2Control = {
  id: string;
  category: string;
  name: string;
  description: string;
  status: string;
};

type TrustArtifact = {
  id: string;
  name: string;
  type: string;
  description: string;
  public: boolean;
  last_updated: string;
  requires_nda?: boolean;
};

type EvidenceItem = {
  id: string;
  action: string;
  actor: string;
  metadata: string;
  created_at: string;
};

export function SecurityTrustPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "soc2" | "artifacts" | "vault"
  >("soc2");
  const [readiness, setReadiness] = React.useState<Soc2Readiness | null>(null);
  const [controls, setControls] = React.useState<Soc2Control[]>([]);
  const [artifacts, setArtifacts] = React.useState<TrustArtifact[]>([]);
  const [evidence, setEvidence] = React.useState<EvidenceItem[]>([]);
  const [requestId, setRequestId] = React.useState<string | null>(null);

  // Upload form state
  const [controlId, setControlId] = React.useState("");
  const [evidenceType, setEvidenceType] = React.useState("document");
  const [description, setDescription] = React.useState("");

  const fetchSoc2Status = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/security/soc2/status`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setReadiness(json.soc2_readiness);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load SOC 2 status");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/security/soc2/controls`, {
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

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/security/trust-artifacts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setArtifacts(json.artifacts || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load artifacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/security/evidence-vault?limit=50`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEvidence(json.evidence_items || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load evidence");
    } finally {
      setLoading(false);
    }
  };

  const uploadEvidence = async () => {
    if (!controlId || !description) {
      setErr("Control ID and description are required");
      return;
    }

    setUploading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/security/evidence/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          control_id: controlId,
          evidence_type: evidenceType,
          description,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRequestId(json.request_id);
      alert("Evidence uploaded successfully");
      setControlId("");
      setDescription("");
      await fetchEvidence();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "soc2") {
      await fetchSoc2Status();
      await fetchControls();
    } else if (tab === "artifacts") await fetchArtifacts();
    else if (tab === "vault") await fetchEvidence();
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchSoc2Status();
    fetchControls();
  }, [fetchSoc2Status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
      case "ready":
        return "bg-green-100 text-green-800";
      case "partial":
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "non_compliant":
      case "not_ready":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Security & Trust</div>
          <div className="text-xs opacity-70">
            SOC 2 readiness, evidence vault, and trust artifacts (read-only).
          </div>
        </div>
      </div>

      {/* SOC 2 Readiness Summary */}
      {readiness ? (
        <div className="mt-4 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">SOC 2 Readiness</span>
            <span
              className={`px-2 py-1 rounded text-sm ${getStatusColor(readiness.readiness_status)}`}
            >
              {readiness.overall_score}%
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-green-600">
                {readiness.compliant}
              </div>
              <div className="opacity-70">Compliant</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">
                {readiness.partial}
              </div>
              <div className="opacity-70">Partial</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">
                {readiness.non_compliant}
              </div>
              <div className="opacity-70">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{readiness.total_controls}</div>
              <div className="opacity-70">Total</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b pb-2">
        {(["soc2", "artifacts", "vault"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-lg px-3 py-1 text-sm ${activeTab === tab ? "bg-blue-600 text-white" : "border"}`}
          >
            {tab === "soc2"
              ? "SOC 2 Controls"
              : tab === "artifacts"
                ? "Trust Artifacts"
                : "Evidence Vault"}
          </button>
        ))}
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {loading ? (
        <div className="mt-3 text-sm opacity-70">Loading...</div>
      ) : activeTab === "soc2" ? (
        <div className="mt-3 grid gap-2 max-h-80 overflow-y-auto">
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
      ) : activeTab === "artifacts" ? (
        <div className="mt-3 grid gap-2">
          {artifacts.map((a) => (
            <div key={a.id} className="rounded-lg border p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs opacity-70">{a.description}</div>
                </div>
                <div className="flex gap-1">
                  {a.public ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                      Public
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                      Private
                    </span>
                  )}
                  {a.requires_nda ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                      NDA
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-xs mt-2 opacity-50">
                Updated: {a.last_updated}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          {/* Upload Form */}
          <div className="rounded-lg border p-3 mb-3">
            <div className="text-sm font-medium mb-2">Upload Evidence</div>
            <div className="grid gap-2">
              <input
                type="text"
                value={controlId}
                onChange={(e) => setControlId(e.target.value)}
                placeholder="Control ID (e.g., CC6.1)"
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="document">Document</option>
                <option value="screenshot">Screenshot</option>
                <option value="log">Log</option>
                <option value="configuration">Configuration</option>
              </select>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={uploadEvidence}
                disabled={uploading}
                className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm"
              >
                {uploading ? "Uploading..." : "Upload Evidence"}
              </button>
            </div>
          </div>

          {/* Evidence List */}
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {evidence.length === 0 ? (
              <div className="text-sm opacity-70">No evidence in vault.</div>
            ) : (
              evidence.map((e) => (
                <div key={e.id} className="rounded-lg border p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{e.action}</span>
                    <span className="text-xs opacity-50">{e.created_at}</span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">by {e.actor}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
