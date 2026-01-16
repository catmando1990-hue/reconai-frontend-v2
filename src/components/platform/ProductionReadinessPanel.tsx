'use client';

import * as React from 'react';

type Slo = {
  id: string;
  name: string;
  target: number;
  unit: string;
  description: string;
  measurement_window: string;
  current_value: number;
  status: string;
};

type ErrorBudget = {
  budget_total_minutes: number;
  budget_consumed_minutes: number;
  budget_remaining_minutes: number;
  budget_remaining_percent: number;
  status: string;
};

type Runbook = {
  id: string;
  title: string;
  severity: string;
  category: string;
  symptoms: string[];
  steps: string[];
  escalation: string;
  last_updated: string;
};

type HealthCheck = {
  name: string;
  status: string;
  latency_ms: number;
  last_check: string;
};

type SlosResponse = {
  request_id: string;
  slos: Slo[];
  summary: { total: number; met: number; at_risk: number };
};

type ErrorBudgetResponse = {
  request_id: string;
  error_budget: ErrorBudget;
  slo_reference: Slo;
};

type RunbooksResponse = {
  request_id: string;
  runbooks: Runbook[];
  total_count: number;
  categories: string[];
};

type HealthChecksResponse = {
  request_id: string;
  health_checks: HealthCheck[];
  overall_status: string;
  checked_at: string;
};

export function ProductionReadinessPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [slosData, setSlosData] = React.useState<SlosResponse | null>(null);
  const [errorBudgetData, setErrorBudgetData] = React.useState<ErrorBudgetResponse | null>(null);
  const [runbooksData, setRunbooksData] = React.useState<RunbooksResponse | null>(null);
  const [healthChecksData, setHealthChecksData] = React.useState<HealthChecksResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'slos' | 'budget' | 'runbooks' | 'health'>('slos');
  const [selectedRunbook, setSelectedRunbook] = React.useState<Runbook | null>(null);
  const [loadTestConfirm, setLoadTestConfirm] = React.useState('');
  const [triggering, setTriggering] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [slosRes, budgetRes, runbooksRes, healthRes] = await Promise.all([
        fetch(`${apiBase}/api/production/slos`, { credentials: 'include' }),
        fetch(`${apiBase}/api/production/error-budget`, { credentials: 'include' }),
        fetch(`${apiBase}/api/production/runbooks`, { credentials: 'include' }),
        fetch(`${apiBase}/api/production/health-checks`, { credentials: 'include' }),
      ]);

      if (!slosRes.ok) throw new Error(`SLOs: HTTP ${slosRes.status}`);
      if (!budgetRes.ok) throw new Error(`Budget: HTTP ${budgetRes.status}`);
      if (!runbooksRes.ok) throw new Error(`Runbooks: HTTP ${runbooksRes.status}`);
      if (!healthRes.ok) throw new Error(`Health: HTTP ${healthRes.status}`);

      setSlosData(await slosRes.json());
      setErrorBudgetData(await budgetRes.json());
      setRunbooksData(await runbooksRes.json());
      setHealthChecksData(await healthRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const triggerLoadTest = async () => {
    if (loadTestConfirm !== 'RUN LOAD TEST') {
      setErr("Must type 'RUN LOAD TEST' to confirm");
      return;
    }
    setTriggering(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/production/load-test/trigger`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: 'smoke',
          duration_seconds: 60,
          target_rps: 100,
          confirmation: loadTestConfirm,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      alert(`Load test scheduled! ${json.message}`);
      setLoadTestConfirm('');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to trigger load test');
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
          <div className="text-sm font-medium">Production Readiness</div>
          <div className="text-xs opacity-70">SLOs, error budgets, runbooks, health checks.</div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b overflow-x-auto">
        {(['slos', 'budget', 'runbooks', 'health'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-500 font-medium' : 'opacity-70'}`}
          >
            {tab === 'slos' ? 'SLOs' : tab === 'budget' ? 'Error Budget' : tab}
          </button>
        ))}
      </div>

      {/* SLOs Tab */}
      {activeTab === 'slos' && slosData ? (
        <div className="mt-4">
          <div className="mb-3 flex gap-3 text-xs">
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">{slosData.summary.met} Met</span>
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-700">{slosData.summary.at_risk} At Risk</span>
          </div>
          <div className="space-y-2">
            {slosData.slos.map((slo) => (
              <div key={slo.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{slo.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${slo.status === 'met' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {slo.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-xs opacity-70">{slo.description}</div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Current: {slo.current_value}{slo.unit === 'percent' ? '%' : slo.unit}</span>
                  <span className="opacity-70">Target: {slo.target}{slo.unit === 'percent' ? '%' : slo.unit}</span>
                </div>
                <div className="mt-1">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${slo.status === 'met' ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((slo.current_value / slo.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Error Budget Tab */}
      {activeTab === 'budget' && errorBudgetData ? (
        <div className="mt-4">
          <div className={`rounded-xl border p-4 ${errorBudgetData.error_budget.status === 'healthy' ? 'bg-green-50' : errorBudgetData.error_budget.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {errorBudgetData.error_budget.budget_remaining_percent}%
              </div>
              <div className="text-sm opacity-70">Error Budget Remaining</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <div className="font-medium">{errorBudgetData.error_budget.budget_total_minutes.toFixed(1)}</div>
                <div className="opacity-70">Total (min)</div>
              </div>
              <div>
                <div className="font-medium">{errorBudgetData.error_budget.budget_consumed_minutes.toFixed(1)}</div>
                <div className="opacity-70">Consumed</div>
              </div>
              <div>
                <div className="font-medium">{errorBudgetData.error_budget.budget_remaining_minutes.toFixed(1)}</div>
                <div className="opacity-70">Remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full ${errorBudgetData.error_budget.status === 'healthy' ? 'bg-green-500' : errorBudgetData.error_budget.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${errorBudgetData.error_budget.budget_remaining_percent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs opacity-70">
            Based on {errorBudgetData.slo_reference?.target}% availability SLO over 30 days
          </div>
        </div>
      ) : null}

      {/* Runbooks Tab */}
      {activeTab === 'runbooks' && runbooksData ? (
        <div className="mt-4">
          <div className="mb-3 text-xs opacity-70">{runbooksData.total_count} runbooks available</div>
          <div className="space-y-2">
            {runbooksData.runbooks.map((runbook) => (
              <div
                key={runbook.id}
                className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                onClick={() => setSelectedRunbook(runbook)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{runbook.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${runbook.severity === 'P1' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {runbook.severity}
                  </span>
                </div>
                <div className="mt-1 flex gap-2 text-xs opacity-70">
                  <span className="rounded bg-gray-100 px-1">{runbook.category}</span>
                  <span>Updated: {runbook.last_updated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Health Checks Tab */}
      {activeTab === 'health' && healthChecksData ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${healthChecksData.overall_status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm font-medium capitalize">{healthChecksData.overall_status}</span>
          </div>
          <div className="space-y-2">
            {healthChecksData.health_checks.map((check) => (
              <div key={check.name} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${check.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="font-medium">{check.name}</span>
                </div>
                <div className="text-sm opacity-70">{check.latency_ms}ms</div>
              </div>
            ))}
          </div>

          {/* Load Test Trigger */}
          <div className="mt-4 rounded-xl border p-3">
            <div className="text-sm font-medium">Load Test</div>
            <div className="mt-2 text-xs opacity-70">Trigger a smoke load test (60s, 100 RPS)</div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={loadTestConfirm}
                onChange={(e) => setLoadTestConfirm(e.target.value)}
                placeholder="Type 'RUN LOAD TEST'"
                className="flex-1 rounded-lg border px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={triggerLoadTest}
                disabled={triggering || loadTestConfirm !== 'RUN LOAD TEST'}
                className="rounded-lg bg-orange-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                {triggering ? 'Triggering...' : 'Trigger'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Runbook Detail Modal */}
      {selectedRunbook ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="font-medium">{selectedRunbook.title}</div>
              <button type="button" onClick={() => setSelectedRunbook(null)} className="text-xl">&times;</button>
            </div>
            <div className="mt-2 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${selectedRunbook.severity === 'P1' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {selectedRunbook.severity}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{selectedRunbook.category}</span>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase opacity-70">Symptoms</div>
              <ul className="mt-1 list-inside list-disc text-sm">
                {selectedRunbook.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase opacity-70">Steps</div>
              <ol className="mt-1 list-inside list-decimal text-sm">
                {selectedRunbook.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase opacity-70">Escalation</div>
              <div className="mt-1 text-sm">{selectedRunbook.escalation}</div>
            </div>
          </div>
        </div>
      ) : null}

      {slosData ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {slosData.request_id}</div>
      ) : null}
    </div>
  );
}
