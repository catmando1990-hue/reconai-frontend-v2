"use client";

import * as React from "react";

type MlModel = {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  status: string;
  deployed_at: string;
  metrics: Record<string, number>;
};

type Evaluation = {
  id: string;
  model_id: string;
  evaluation_type: string;
  dataset: string;
  results: Record<string, unknown>;
  status: string;
  completed_at: string;
};

type DriftMetric = {
  model_id: string;
  metric: string;
  current_value: number;
  threshold: number;
  status: string;
  last_checked: string;
};

type Prompt = {
  id: string;
  name: string;
  version: string;
  model: string;
  description: string;
  status: string;
  created_at: string;
  hash: string;
  governance: {
    reviewed: boolean;
    reviewer: string;
    safety_checked: boolean;
  };
};

type ModelsResponse = {
  request_id: string;
  models: MlModel[];
  total_count: number;
};

type EvaluationsResponse = {
  request_id: string;
  evaluations: Evaluation[];
  total_count: number;
};

type DriftResponse = {
  request_id: string;
  drift_metrics: DriftMetric[];
  overall_status: string;
  summary: {
    total_checks: number;
    normal: number;
    warning: number;
    alert: number;
  };
};

type PromptsResponse = {
  request_id: string;
  prompts: Prompt[];
  total_count: number;
  governance_summary: { all_reviewed: boolean; all_safety_checked: boolean };
};

export function MlGovernancePanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [modelsData, setModelsData] = React.useState<ModelsResponse | null>(
    null,
  );
  const [evaluationsData, setEvaluationsData] =
    React.useState<EvaluationsResponse | null>(null);
  const [driftData, setDriftData] = React.useState<DriftResponse | null>(null);
  const [promptsData, setPromptsData] = React.useState<PromptsResponse | null>(
    null,
  );
  const [activeTab, setActiveTab] = React.useState<
    "models" | "evaluations" | "drift" | "prompts"
  >("models");
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [evalType, setEvalType] = React.useState<
    "accuracy" | "bias" | "safety" | "performance"
  >("accuracy");
  const [triggering, setTriggering] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [modelsRes, evalsRes, driftRes, promptsRes] = await Promise.all([
        fetch(`${apiBase}/api/ml/models`, { credentials: "include" }),
        fetch(`${apiBase}/api/ml/evaluations`, { credentials: "include" }),
        fetch(`${apiBase}/api/ml/drift`, { credentials: "include" }),
        fetch(`${apiBase}/api/ml/prompts`, { credentials: "include" }),
      ]);

      if (!modelsRes.ok) throw new Error(`Models: HTTP ${modelsRes.status}`);
      if (!evalsRes.ok) throw new Error(`Evaluations: HTTP ${evalsRes.status}`);
      if (!driftRes.ok) throw new Error(`Drift: HTTP ${driftRes.status}`);
      if (!promptsRes.ok) throw new Error(`Prompts: HTTP ${promptsRes.status}`);

      setModelsData(await modelsRes.json());
      setEvaluationsData(await evalsRes.json());
      setDriftData(await driftRes.json());
      setPromptsData(await promptsRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load ML data");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const triggerEvaluation = async () => {
    if (!selectedModel) {
      setErr("Please select a model");
      return;
    }
    setTriggering(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/ml/evaluation/trigger`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: selectedModel,
          evaluation_type: evalType,
          dataset: "holdout",
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      alert(`Evaluation scheduled! ${json.message}`);
      setSelectedModel(null);
      fetchData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to trigger evaluation");
    } finally {
      setTriggering(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">ML Governance</div>
          <div className="text-xs opacity-70">
            Model tracking, evaluations, drift checks, prompt governance.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b overflow-x-auto">
        {(["models", "evaluations", "drift", "prompts"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap ${activeTab === tab ? "border-b-2 border-blue-500 font-medium" : "opacity-70"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Models Tab */}
      {activeTab === "models" && modelsData ? (
        <div className="mt-4">
          <div className="mb-3 text-xs opacity-70">
            {modelsData.total_count} models registered
          </div>
          <div className="space-y-2">
            {modelsData.models.map((model) => (
              <div key={model.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{model.name}</span>
                    <span className="ml-2 text-xs opacity-70">
                      v{model.version}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${model.status === "production" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {model.status}
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {model.description}
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="rounded bg-gray-100 px-1">{model.type}</span>
                  <span className="opacity-70">
                    Deployed: {model.deployed_at}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(model.metrics).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs"
                    >
                      {key}:{" "}
                      {typeof value === "number"
                        ? value < 1
                          ? `${(value * 100).toFixed(1)}%`
                          : value.toFixed(2)
                        : value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Evaluation Trigger */}
          <div className="mt-4 rounded-xl border p-3">
            <div className="text-sm font-medium">Trigger Evaluation</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={selectedModel ?? ""}
                onChange={(e) => setSelectedModel(e.target.value || null)}
                className="rounded-lg border px-2 py-1 text-sm"
              >
                <option value="">Select model...</option>
                {modelsData.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={evalType}
                onChange={(e) => setEvalType(e.target.value as typeof evalType)}
                className="rounded-lg border px-2 py-1 text-sm"
              >
                <option value="accuracy">Accuracy</option>
                <option value="bias">Bias</option>
                <option value="safety">Safety</option>
                <option value="performance">Performance</option>
              </select>
              <button
                type="button"
                onClick={triggerEvaluation}
                disabled={triggering || !selectedModel}
                className="rounded-lg bg-purple-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                {triggering ? "Scheduling..." : "Run Evaluation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Evaluations Tab */}
      {activeTab === "evaluations" && evaluationsData ? (
        <div className="mt-4">
          <div className="mb-3 text-xs opacity-70">
            {evaluationsData.total_count} evaluations
          </div>
          <div className="space-y-2">
            {evaluationsData.evaluations.map((ev) => (
              <div key={ev.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{ev.model_id}</span>
                    <span className="ml-2 text-xs opacity-70">
                      {ev.evaluation_type}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${ev.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {ev.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {Object.entries(ev.results).map(([key, value]) => (
                    <span key={key} className="rounded bg-gray-100 px-2 py-0.5">
                      {key}: {JSON.stringify(value)}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Dataset: {ev.dataset} | Completed:{" "}
                  {new Date(ev.completed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Drift Tab */}
      {activeTab === "drift" && driftData ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${driftData.overall_status === "normal" ? "bg-green-100 text-green-700" : driftData.overall_status === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${driftData.overall_status === "normal" ? "bg-green-500" : driftData.overall_status === "warning" ? "bg-yellow-500" : "bg-red-500"}`}
              />
              {driftData.overall_status.toUpperCase()}
            </span>
            <span className="text-xs opacity-70">
              {driftData.summary.normal} normal, {driftData.summary.warning}{" "}
              warning, {driftData.summary.alert} alert
            </span>
          </div>
          <div className="space-y-2">
            {driftData.drift_metrics.map((dm, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dm.model_id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${dm.status === "normal" ? "bg-green-100 text-green-700" : dm.status === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                  >
                    {dm.status}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  {dm.metric.replace(/_/g, " ")}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span>Current: {(dm.current_value * 100).toFixed(1)}%</span>
                  <span className="opacity-70">
                    Threshold: {(dm.threshold * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${dm.status === "normal" ? "bg-green-500" : dm.status === "warning" ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{
                        width: `${Math.min((dm.current_value / dm.threshold) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Prompts Tab */}
      {activeTab === "prompts" && promptsData ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3 text-xs">
            <span
              className={`rounded-full px-2 py-1 ${promptsData.governance_summary.all_reviewed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
            >
              {promptsData.governance_summary.all_reviewed
                ? "All Reviewed"
                : "Review Pending"}
            </span>
            <span
              className={`rounded-full px-2 py-1 ${promptsData.governance_summary.all_safety_checked ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
            >
              {promptsData.governance_summary.all_safety_checked
                ? "Safety Checked"
                : "Safety Check Pending"}
            </span>
          </div>
          <div className="space-y-2">
            {promptsData.prompts.map((prompt) => (
              <div key={prompt.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{prompt.name}</span>
                    <span className="ml-2 text-xs opacity-70">
                      v{prompt.version}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${prompt.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                  >
                    {prompt.status}
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {prompt.description}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-purple-50 px-2 py-0.5">
                    {prompt.model}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">
                    Hash: {prompt.hash}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 ${prompt.governance.reviewed ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                  >
                    {prompt.governance.reviewed ? "Reviewed" : "Pending Review"}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 ${prompt.governance.safety_checked ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                  >
                    {prompt.governance.safety_checked
                      ? "Safe"
                      : "Safety Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {modelsData ? (
        <div className="mt-3 text-xs opacity-50">
          Request ID: {modelsData.request_id}
        </div>
      ) : null}
    </div>
  );
}
