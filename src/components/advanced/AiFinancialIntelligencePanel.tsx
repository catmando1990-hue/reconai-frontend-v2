'use client';

import * as React from 'react';

type AiInsight = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  action_suggested: string | null;
};

type ForecastPoint = {
  month: number;
  projected_mrr: number;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
};

type QueryResult = {
  request_id: string;
  query: string;
  answer: string;
  classification: {
    type: string;
    confidence: number;
  };
  data: Record<string, unknown>;
  explainability: {
    query_type: string;
    read_only: boolean;
  };
};

type Explainability = {
  model_version: string;
  capabilities: string[];
  safety_features: string[];
  limitations: string[];
};

export function AiFinancialIntelligencePanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [querying, setQuerying] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'query' | 'insights' | 'forecast' | 'explain'>('query');
  const [insights, setInsights] = React.useState<AiInsight[]>([]);
  const [forecasts, setForecasts] = React.useState<ForecastPoint[]>([]);
  const [queryInput, setQueryInput] = React.useState('');
  const [queryResult, setQueryResult] = React.useState<QueryResult | null>(null);
  const [explainability, setExplainability] = React.useState<Explainability | null>(null);
  const [currentMrr, setCurrentMrr] = React.useState(0);
  const [requestId, setRequestId] = React.useState<string | null>(null);

  const fetchInsights = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/ai/insights`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setInsights(json.insights || []);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/forecast?months=12`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setForecasts(json.forecasts || []);
      setCurrentMrr(json.current_mrr || 0);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const fetchExplainability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/explainability`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setExplainability(json.explainability);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load explainability');
    } finally {
      setLoading(false);
    }
  };

  const submitQuery = async () => {
    if (!queryInput.trim()) {
      setErr('Please enter a query');
      return;
    }

    setQuerying(true);
    setErr(null);
    setQueryResult(null);
    try {
      const res = await fetch(`${apiBase}/api/ai/query`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryInput }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setQueryResult(json);
      setRequestId(json.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to process query');
    } finally {
      setQuerying(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'insights') await fetchInsights();
    else if (tab === 'forecast') await fetchForecast();
    else if (tab === 'explain') await fetchExplainability();
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchInsights();
  }, [fetchInsights]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">AI Financial Intelligence</div>
          <div className="text-xs opacity-70">Natural language queries, insights, and forecasting (read-only).</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b pb-2">
        {(['query', 'insights', 'forecast', 'explain'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`rounded-lg px-3 py-1 text-sm ${activeTab === tab ? 'bg-blue-600 text-white' : 'border'}`}
          >
            {tab === 'query' ? 'Ask AI' : tab === 'explain' ? 'Explainability' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {loading ? (
        <div className="mt-3 text-sm opacity-70">Loading...</div>
      ) : activeTab === 'query' ? (
        <div className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitQuery()}
              placeholder="Ask about revenue, subscriptions, forecasts..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitQuery}
              disabled={querying}
              className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm"
            >
              {querying ? 'Asking...' : 'Ask'}
            </button>
          </div>

          <div className="mt-2 text-xs opacity-50">
            Try: "What is my MRR?", "Show revenue forecast", "How many active users?"
          </div>

          {queryResult ? (
            <div className="mt-4 rounded-xl border p-4">
              <div className="text-sm font-medium mb-2">Answer</div>
              <div className="text-sm">{queryResult.answer}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-70">Query Type:</span>{' '}
                  <span className="font-medium">{queryResult.classification.type}</span>
                </div>
                <div>
                  <span className="opacity-70">Confidence:</span>{' '}
                  <span className="font-medium">{(queryResult.classification.confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="opacity-70">Read-Only:</span>{' '}
                  <span className="font-medium text-green-600">{queryResult.explainability.read_only ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : activeTab === 'insights' ? (
        <div className="mt-3 grid gap-2">
          {insights.length === 0 ? (
            <div className="text-sm opacity-70">No insights available.</div>
          ) : (
            insights.map((i) => (
              <div key={i.id} className="rounded-lg border p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium">{i.title}</div>
                  <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(i.severity)}`}>
                    {i.severity}
                  </span>
                </div>
                <div className="text-sm mt-1 opacity-70">{i.description}</div>
                <div className="text-xs mt-2 opacity-50">
                  Confidence: {(i.confidence * 100).toFixed(0)}%
                  {i.action_suggested ? ` | Suggested: ${i.action_suggested}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'forecast' ? (
        <div className="mt-3">
          <div className="rounded-xl border p-3 mb-3">
            <div className="text-sm font-medium">Current MRR: ${currentMrr}</div>
            <div className="text-xs opacity-70">12-month forecast with 10% monthly growth assumption</div>
          </div>

          <div className="grid gap-2 max-h-80 overflow-y-auto">
            {forecasts.map((f) => (
              <div key={f.month} className="rounded-lg border p-2 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">Month {f.month}</span>
                  <span className="ml-2 text-xs opacity-50">
                    (${f.lower_bound} - ${f.upper_bound})
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">${f.projected_mrr}</div>
                  <div className="text-xs opacity-50">{(f.confidence * 100).toFixed(0)}% confidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {explainability ? (
            <div className="grid gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">Model Version</div>
                <div className="text-sm opacity-70">{explainability.model_version}</div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium mb-2">Capabilities</div>
                <ul className="text-sm opacity-70 list-disc pl-4">
                  {explainability.capabilities.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-green-200 p-3">
                <div className="text-sm font-medium mb-2 text-green-700">Safety Features</div>
                <ul className="text-sm opacity-70 list-disc pl-4">
                  {explainability.safety_features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 p-3">
                <div className="text-sm font-medium mb-2 text-yellow-700">Limitations</div>
                <ul className="text-sm opacity-70 list-disc pl-4">
                  {explainability.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">Loading explainability info...</div>
          )}
        </div>
      )}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
