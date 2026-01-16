"use client";

import * as React from "react";

type OnboardingStep = {
  id: string;
  name: string;
  description: string;
  order: number;
  required: boolean;
  estimated_time: string;
  completed: boolean;
};

type SampleDataTemplate = {
  id: string;
  name: string;
  description: string;
  transaction_count: number;
  categories: string[];
};

type Insight = {
  id: string;
  type: string;
  title: string;
  message: string;
  action: { label: string; target: string } | null;
};

type StatusResponse = {
  request_id: string;
  org_id: string;
  progress: {
    total_steps: number;
    completed_steps: number;
    required_steps: number;
    required_completed: number;
    completion_percent: number;
    is_complete: boolean;
  };
  completed_step_ids: string[];
  started_at: string | null;
  completed_at: string | null;
};

type ChecklistResponse = {
  request_id: string;
  checklist: OnboardingStep[];
  next_step: OnboardingStep | null;
};

type InsightsResponse = {
  request_id: string;
  is_new_user: boolean;
  insights: Insight[];
  sample_data_templates: SampleDataTemplate[];
};

export function OnboardingPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [statusData, setStatusData] = React.useState<StatusResponse | null>(
    null,
  );
  const [checklistData, setChecklistData] =
    React.useState<ChecklistResponse | null>(null);
  const [insightsData, setInsightsData] =
    React.useState<InsightsResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "progress" | "checklist" | "sample-data"
  >("progress");
  const [completing, setCompleting] = React.useState<string | null>(null);
  const [seeding, setSeeding] = React.useState(false);
  const [seedConfirm, setSeedConfirm] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(
    null,
  );

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [statusRes, checklistRes, insightsRes] = await Promise.all([
        fetch(`${apiBase}/api/onboarding/status`, { credentials: "include" }),
        fetch(`${apiBase}/api/onboarding/checklist`, {
          credentials: "include",
        }),
        fetch(`${apiBase}/api/onboarding/first-run-insights`, {
          credentials: "include",
        }),
      ]);

      if (!statusRes.ok) throw new Error(`Status: HTTP ${statusRes.status}`);
      if (!checklistRes.ok)
        throw new Error(`Checklist: HTTP ${checklistRes.status}`);
      if (!insightsRes.ok)
        throw new Error(`Insights: HTTP ${insightsRes.status}`);

      setStatusData(await statusRes.json());
      setChecklistData(await checklistRes.json());
      setInsightsData(await insightsRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const completeStep = async (stepId: string) => {
    setCompleting(stepId);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/onboarding/step/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_id: stepId }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      fetchData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to complete step");
    } finally {
      setCompleting(null);
    }
  };

  const seedSampleData = async () => {
    if (!selectedTemplate || seedConfirm !== "SEED SAMPLE DATA") {
      setErr("Select a template and type 'SEED SAMPLE DATA' to confirm");
      return;
    }
    setSeeding(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/onboarding/sample-data/seed`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          confirmation: seedConfirm,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      alert(`Sample data seeded! ${json.message}`);
      setSeedConfirm("");
      setSelectedTemplate(null);
      fetchData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to seed sample data");
    } finally {
      setSeeding(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Customer Onboarding</div>
          <div className="text-xs opacity-70">
            Setup progress, checklists, sample data seeding.
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

      {/* First Run Insights */}
      {insightsData?.is_new_user && insightsData.insights.length > 0 ? (
        <div className="mt-4 space-y-2">
          {insightsData.insights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-xl border p-3 ${insight.type === "info" ? "bg-blue-50" : "bg-yellow-50"}`}
            >
              <div className="font-medium">{insight.title}</div>
              <div className="mt-1 text-sm opacity-70">{insight.message}</div>
              {insight.action ? (
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-blue-600 px-3 py-1 text-xs text-white"
                >
                  {insight.action.label}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b">
        {(["progress", "checklist", "sample-data"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize ${activeTab === tab ? "border-b-2 border-blue-500 font-medium" : "opacity-70"}`}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Progress Tab */}
      {activeTab === "progress" && statusData ? (
        <div className="mt-4">
          {/* Progress Ring */}
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    statusData.progress.is_complete ? "#22c55e" : "#3b82f6"
                  }
                  strokeWidth="10"
                  strokeDasharray={`${statusData.progress.completion_percent * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {statusData.progress.completion_percent}%
                </span>
                <span className="text-xs opacity-70">Complete</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xl font-bold">
                {statusData.progress.completed_steps}/
                {statusData.progress.total_steps}
              </div>
              <div className="text-xs opacity-70">Steps Completed</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xl font-bold">
                {statusData.progress.required_completed}/
                {statusData.progress.required_steps}
              </div>
              <div className="text-xs opacity-70">Required Done</div>
            </div>
          </div>

          {statusData.progress.is_complete ? (
            <div className="mt-4 rounded-xl bg-green-50 p-3 text-center text-sm text-green-700">
              Onboarding complete! You&apos;re all set.
            </div>
          ) : null}

          {statusData.started_at ? (
            <div className="mt-3 text-xs opacity-70 text-center">
              Started: {new Date(statusData.started_at).toLocaleDateString()}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Checklist Tab */}
      {activeTab === "checklist" && checklistData ? (
        <div className="mt-4">
          {checklistData.next_step ? (
            <div className="mb-4 rounded-xl border-2 border-blue-500 bg-blue-50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">→</span>
                <span className="font-medium">
                  Next: {checklistData.next_step.name}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-70">
                {checklistData.next_step.description}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs opacity-70">
                  {checklistData.next_step.estimated_time}
                </span>
                <button
                  type="button"
                  onClick={() => completeStep(checklistData.next_step!.id)}
                  disabled={completing === checklistData.next_step.id}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white"
                >
                  {completing === checklistData.next_step.id
                    ? "Completing..."
                    : "Mark Complete"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {checklistData.checklist.map((step) => (
              <div
                key={step.id}
                className={`rounded-lg border p-3 ${step.completed ? "bg-green-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${step.completed ? "text-green-600" : "text-gray-400"}`}
                    >
                      {step.completed ? "✓" : "○"}
                    </span>
                    <span
                      className={`font-medium ${step.completed ? "line-through opacity-70" : ""}`}
                    >
                      {step.name}
                    </span>
                    {step.required ? (
                      <span className="rounded bg-red-100 px-1 text-xs text-red-700">
                        Required
                      </span>
                    ) : null}
                  </div>
                  {!step.completed ? (
                    <button
                      type="button"
                      onClick={() => completeStep(step.id)}
                      disabled={completing === step.id}
                      className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      {completing === step.id ? "..." : "Complete"}
                    </button>
                  ) : null}
                </div>
                <div className="ml-5 mt-1 text-xs opacity-70">
                  {step.description}
                </div>
                <div className="ml-5 mt-1 text-xs opacity-50">
                  {step.estimated_time}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Sample Data Tab */}
      {activeTab === "sample-data" && insightsData ? (
        <div className="mt-4">
          <div className="mb-3 text-sm opacity-70">
            Seed sample data to explore ReconAI&apos;s features without
            connecting a real account.
          </div>

          <div className="space-y-2">
            {insightsData.sample_data_templates.map((template) => (
              <div
                key={template.id}
                className={`cursor-pointer rounded-xl border p-3 ${selectedTemplate === template.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs opacity-70">
                    {template.transaction_count} transactions
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {template.description}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded bg-gray-100 px-1 py-0.5 text-xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate ? (
            <div className="mt-4 rounded-xl border p-3">
              <div className="text-sm font-medium">
                Confirm Sample Data Seed
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={seedConfirm}
                  onChange={(e) => setSeedConfirm(e.target.value)}
                  placeholder="Type 'SEED SAMPLE DATA'"
                  className="flex-1 rounded-lg border px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={seedSampleData}
                  disabled={seeding || seedConfirm !== "SEED SAMPLE DATA"}
                  className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {seeding ? "Seeding..." : "Seed Data"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {statusData ? (
        <div className="mt-3 text-xs opacity-50">
          Request ID: {statusData.request_id}
        </div>
      ) : null}
    </div>
  );
}
