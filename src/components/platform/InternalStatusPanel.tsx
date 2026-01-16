'use client';

import * as React from 'react';

type Slo = {
  id: string;
  name: string;
  target: number;
  unit: string;
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

type MlModel = {
  id: string;
  name: string;
  version: string;
  status: string;
  metrics: Record<string, number>;
};

type ActivationMetric = {
  seconds: number | null;
  formatted: string | null;
  achieved_at: string | null;
  achieved: boolean;
};

type SlosResponse = {
  request_id: string;
  slos: Slo[];
  summary: { total: number; met: number; at_risk: number };
};

type ErrorBudgetResponse = {
  request_id: string;
  error_budget: ErrorBudget;
};

type MlModelsResponse = {
  request_id: string;
  models: MlModel[];
};

type ActivationResponse = {
  request_id: string;
  metrics: {
    time_to_first_bank: ActivationMetric;
    time_to_first_classification: ActivationMetric;
    time_to_first_insight: ActivationMetric;
  };
  activation_progress: {
    completed: number;
    total: number;
    percent: number;
  };
};

type CapabilitiesResponse = {
  request_id: string;
  tier: string;
  tier_name: string;
  limits: {
    transactions_per_month: number;
    exports_per_day: number;
    signals_depth: number;
  };
  features: {
    enabled: string[];
    disabled: string[];
  };
};

export function InternalStatusPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [slosData, setSlosData] = React.useState<SlosResponse | null>(null);
  const [errorBudgetData, setErrorBudgetData] = React.useState<ErrorBudgetResponse | null>(null);
  const [mlModelsData, setMlModelsData] = React.useState<MlModelsResponse | null>(null);
  const [activationData, setActivationData] = React.useState<ActivationResponse | null>(null);
  const [capabilitiesData, setCapabilitiesData] = React.useState<CapabilitiesResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'slos' | 'ml' | 'activation' | 'capabilities'>('slos');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [slosRes, budgetRes, mlRes, activationRes, capabilitiesRes] = await Promise.all([
        fetch(`${apiBase}/api/production/slos`, { credentials: 'include' }),
        fetch(`${apiBase}/api/production/error-budget`, { credentials: 'include' }),
        fetch(`${apiBase}/api/ml/models`, { credentials: 'include' }),
        fetch(`${apiBase}/api/metrics/activation`, { credentials: 'include' }),
        fetch(`${apiBase}/api/entitlements/capabilities`, { credentials: 'include' }),
      ]);

      if (!slosRes.ok) throw new Error(`SLOs: HTTP ${slosRes.status}`);
      if (!budgetRes.ok) throw new Error(`Budget: HTTP ${budgetRes.status}`);
      if (!mlRes.ok) throw new Error(`ML: HTTP ${mlRes.status}`);
      if (!activationRes.ok) throw new Error(`Activation: HTTP ${activationRes.status}`);
      if (!capabilitiesRes.ok) throw new Error(`Capabilities: HTTP ${capabilitiesRes.status}`);

      setSlosData(await slosRes.json());
      setErrorBudgetData(await budgetRes.json());
      setMlModelsData(await mlRes.json());
      setActivationData(await activationRes.json());
      setCapabilitiesData(await capabilitiesRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load internal status data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate ML confidence distribution
  const getConfidenceDistribution = () => {
    if (!mlModelsData?.models) return null;

    const confidences = mlModelsData.models
      .map((m) => {
        const accuracy = m.metrics.accuracy ?? m.metrics.precision ?? m.metrics.relevance_score;
        return accuracy ? accuracy * 100 : null;
      })
      .filter((c): c is number => c !== null);

    if (confidences.length === 0) return null;

    const high = confidences.filter((c) => c >= 85).length;
    const medium = confidences.filter((c) => c >= 70 && c < 85).length;
    const low = confidences.filter((c) => c < 70).length;

    return { high, medium, low, total: confidences.length };
  };

  const confidenceDistribution = getConfidenceDistribution();

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Internal Status (Advisory)</div>
          <div className="text-xs opacity-70">SLOs, error budget, ML confidence, activation metrics. Read-only.</div>
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

      {/* Quick Status Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* SLO Status */}
        <div className="rounded-xl border p-3 text-center">
          <div className={`text-2xl font-bold ${slosData?.summary.met === slosData?.summary.total ? 'text-green-600' : 'text-yellow-600'}`}>
            {slosData ? `${slosData.summary.met}/${slosData.summary.total}` : '-'}
          </div>
          <div className="text-xs opacity-70">SLOs Met</div>
        </div>

        {/* Error Budget */}
        <div className="rounded-xl border p-3 text-center">
          <div className={`text-2xl font-bold ${errorBudgetData?.error_budget.status === 'healthy' ? 'text-green-600' : errorBudgetData?.error_budget.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
            {errorBudgetData ? `${errorBudgetData.error_budget.budget_remaining_percent}%` : '-'}
          </div>
          <div className="text-xs opacity-70">Budget Left</div>
        </div>

        {/* ML High Confidence */}
        <div className="rounded-xl border p-3 text-center">
          <div className={`text-2xl font-bold ${confidenceDistribution && confidenceDistribution.high === confidenceDistribution.total ? 'text-green-600' : 'text-blue-600'}`}>
            {confidenceDistribution ? `${confidenceDistribution.high}/${confidenceDistribution.total}` : '-'}
          </div>
          <div className="text-xs opacity-70">ML High Conf</div>
        </div>

        {/* Activation Progress */}
        <div className="rounded-xl border p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {activationData ? `${activationData.activation_progress.percent}%` : '-'}
          </div>
          <div className="text-xs opacity-70">Activated</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b overflow-x-auto">
        {(['slos', 'ml', 'activation', 'capabilities'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-500 font-medium' : 'opacity-70'}`}
          >
            {tab === 'slos' ? 'SLOs & Budget' : tab === 'ml' ? 'ML Confidence' : tab}
          </button>
        ))}
      </div>

      {/* SLOs & Error Budget Tab */}
      {activeTab === 'slos' ? (
        <div className="mt-4">
          {/* Error Budget Burn */}
          {errorBudgetData ? (
            <div className={`rounded-xl border p-4 ${errorBudgetData.error_budget.status === 'healthy' ? 'bg-green-50' : errorBudgetData.error_budget.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Error Budget Burn</span>
                <span className={`text-sm font-medium ${errorBudgetData.error_budget.status === 'healthy' ? 'text-green-700' : errorBudgetData.error_budget.status === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
                  {errorBudgetData.error_budget.status.toUpperCase()}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full ${errorBudgetData.error_budget.status === 'healthy' ? 'bg-green-500' : errorBudgetData.error_budget.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${errorBudgetData.error_budget.budget_remaining_percent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs opacity-70">
                <span>Consumed: {errorBudgetData.error_budget.budget_consumed_minutes.toFixed(1)} min</span>
                <span>Remaining: {errorBudgetData.error_budget.budget_remaining_minutes.toFixed(1)} min</span>
              </div>
            </div>
          ) : null}

          {/* SLOs List */}
          {slosData ? (
            <div className="mt-4 space-y-2">
              {slosData.slos.map((slo) => (
                <div key={slo.id} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${slo.status === 'met' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm">{slo.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{slo.current_value}</span>
                    <span className="opacity-70">/{slo.target}{slo.unit === 'percent' ? '%' : slo.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ML Confidence Tab */}
      {activeTab === 'ml' ? (
        <div className="mt-4">
          {/* Confidence Distribution */}
          {confidenceDistribution ? (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3">ML Confidence Distribution</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs">High (&ge;85%)</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(confidenceDistribution.high / confidenceDistribution.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8">{confidenceDistribution.high}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs">Med (70-84%)</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${(confidenceDistribution.medium / confidenceDistribution.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8">{confidenceDistribution.medium}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-xs">Low (&lt;70%)</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(confidenceDistribution.low / confidenceDistribution.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8">{confidenceDistribution.low}</span>
                </div>
              </div>
              <div className="mt-3 text-xs opacity-70">
                Advisory: Models with confidence &lt; 85% require user confirmation before applying.
              </div>
            </div>
          ) : null}

          {/* Models List */}
          {mlModelsData ? (
            <div className="mt-4 space-y-2">
              {mlModelsData.models.map((model) => {
                const confidence = model.metrics.accuracy ?? model.metrics.precision ?? model.metrics.relevance_score ?? 0;
                const confidencePercent = confidence * 100;
                const confidenceLevel = confidencePercent >= 85 ? 'high' : confidencePercent >= 70 ? 'medium' : 'low';
                return (
                  <div key={model.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{model.name}</span>
                        <span className="ml-2 text-xs opacity-70">v{model.version}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${confidenceLevel === 'high' ? 'bg-green-100 text-green-700' : confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {confidencePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 text-xs opacity-70">{model.status}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Activation Tab */}
      {activeTab === 'activation' ? (
        <div className="mt-4">
          {activationData ? (
            <div className="space-y-3">
              {/* Progress Ring */}
              <div className="flex items-center justify-center">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      strokeDasharray={`${activationData.activation_progress.percent * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold">{activationData.activation_progress.completed}/{activationData.activation_progress.total}</span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className={`flex items-center justify-between rounded-lg border p-3 ${activationData.metrics.time_to_first_bank.achieved ? 'bg-green-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${activationData.metrics.time_to_first_bank.achieved ? 'text-green-600' : 'text-gray-400'}`}>
                      {activationData.metrics.time_to_first_bank.achieved ? '✓' : '○'}
                    </span>
                    <span className="text-sm">First Bank Connection</span>
                  </div>
                  <span className="text-xs opacity-70">
                    {activationData.metrics.time_to_first_bank.formatted ?? 'Pending'}
                  </span>
                </div>

                <div className={`flex items-center justify-between rounded-lg border p-3 ${activationData.metrics.time_to_first_classification.achieved ? 'bg-green-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${activationData.metrics.time_to_first_classification.achieved ? 'text-green-600' : 'text-gray-400'}`}>
                      {activationData.metrics.time_to_first_classification.achieved ? '✓' : '○'}
                    </span>
                    <span className="text-sm">First Classification</span>
                  </div>
                  <span className="text-xs opacity-70">
                    {activationData.metrics.time_to_first_classification.formatted ?? 'Pending'}
                  </span>
                </div>

                <div className={`flex items-center justify-between rounded-lg border p-3 ${activationData.metrics.time_to_first_insight.achieved ? 'bg-green-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${activationData.metrics.time_to_first_insight.achieved ? 'text-green-600' : 'text-gray-400'}`}>
                      {activationData.metrics.time_to_first_insight.achieved ? '✓' : '○'}
                    </span>
                    <span className="text-sm">First AI Insight</span>
                  </div>
                  <span className="text-xs opacity-70">
                    {activationData.metrics.time_to_first_insight.formatted ?? 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Capabilities Tab */}
      {activeTab === 'capabilities' ? (
        <div className="mt-4">
          {capabilitiesData ? (
            <div className="space-y-4">
              {/* Tier Info */}
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{capabilitiesData.tier_name}</div>
                    <div className="text-xs opacity-70">Current tier</div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    {capabilitiesData.tier.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Limits */}
              <div className="rounded-xl border p-4">
                <div className="font-medium mb-3">Tier Limits</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold">{capabilitiesData.limits.transactions_per_month === -1 ? '∞' : capabilitiesData.limits.transactions_per_month}</div>
                    <div className="text-xs opacity-70">Txns/mo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{capabilitiesData.limits.exports_per_day}</div>
                    <div className="text-xs opacity-70">Exports/day</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{capabilitiesData.limits.signals_depth}</div>
                    <div className="text-xs opacity-70">Signals depth</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="rounded-xl border p-4">
                <div className="font-medium mb-3">Features ({capabilitiesData.features.enabled.length} enabled)</div>
                <div className="flex flex-wrap gap-1">
                  {capabilitiesData.features.enabled.slice(0, 10).map((f) => (
                    <span key={f} className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {capabilitiesData.features.enabled.length > 10 ? (
                    <span className="text-xs opacity-70">+{capabilitiesData.features.enabled.length - 10} more</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {slosData ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {slosData.request_id}</div>
      ) : null}
    </div>
  );
}
