'use client';

import * as React from 'react';

/**
 * STEP 23 — Activation → Revenue Funnel Attribution Panel
 *
 * Read-only views for:
 * - Funnel stage progression
 * - Conversion rates between stages
 * - Revenue attribution by milestone
 * - Time-to-revenue metrics
 *
 * Manual refresh only. Dashboard-only.
 */

type FunnelStage = {
  id: string;
  name: string;
  description: string;
  order: number;
  timestamp: string | null;
  completed: boolean;
};

type Attribution = {
  org_id: string;
  current_tier: string;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  stages_completed: FunnelStage[];
  stages_pending: FunnelStage[];
  timing: {
    raw_seconds: Record<string, number>;
    formatted: Record<string, string | null>;
  };
  revenue_attributed: number;
};

type Conversion = {
  from_stage: string;
  to_stage: string;
  from_completed: boolean;
  to_completed: boolean;
  conversion_rate: number | null;
};

type RevenueAttribution = {
  milestone: string;
  name: string;
  attributed_mrr: number;
  weight_percent: number;
};

type Revenue = {
  org_id: string;
  current_tier: string;
  is_converted: boolean;
  mrr: number;
  arr: number;
  attribution: RevenueAttribution[];
  time_to_revenue: {
    seconds: number | null;
    formatted: string | null;
  };
};

type AttributionResponse = {
  request_id: string;
  attribution: Attribution;
  timestamp: string;
};

type ConversionResponse = {
  request_id: string;
  conversions: {
    by_stage: Conversion[];
    overall: {
      signup_to_activated: number | null;
      signup_to_converted: number | null;
      activated_to_converted: number | null;
    };
  };
  timestamp: string;
};

type RevenueResponse = {
  request_id: string;
  revenue: Revenue;
  timestamp: string;
};

export function FunnelAttributionPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [attribution, setAttribution] = React.useState<Attribution | null>(null);
  const [conversions, setConversions] = React.useState<ConversionResponse['conversions'] | null>(null);
  const [revenue, setRevenue] = React.useState<Revenue | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'funnel' | 'conversion' | 'revenue'>('funnel');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [attrRes, convRes, revRes] = await Promise.all([
        fetch(`${apiBase}/api/funnel/attribution`, { credentials: 'include' }),
        fetch(`${apiBase}/api/funnel/conversion`, { credentials: 'include' }),
        fetch(`${apiBase}/api/funnel/revenue`, { credentials: 'include' }),
      ]);

      if (!attrRes.ok) throw new Error(`Attribution: HTTP ${attrRes.status}`);
      if (!convRes.ok) throw new Error(`Conversion: HTTP ${convRes.status}`);
      if (!revRes.ok) throw new Error(`Revenue: HTTP ${revRes.status}`);

      const attrData: AttributionResponse = await attrRes.json();
      const convData: ConversionResponse = await convRes.json();
      const revData: RevenueResponse = await revRes.json();

      setAttribution(attrData.attribution);
      setConversions(convData.conversions);
      setRevenue(revData.revenue);
      setRequestId(attrData.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load funnel data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'Not completed';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Funnel Attribution</div>
          <div className="text-xs opacity-70">
            Activation to revenue funnel metrics. Read-only.
          </div>
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
      <div className="mt-4 flex gap-2 border-b">
        {(['funnel', 'conversion', 'revenue'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 font-medium'
                : 'opacity-70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Funnel Tab */}
      {activeTab === 'funnel' && attribution ? (
        <div className="mt-4 space-y-4">
          {/* Progress Overview */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Funnel Progress</div>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
                {attribution.progress.completed}/{attribution.progress.total} stages
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                style={{ width: `${attribution.progress.percent}%` }}
              />
            </div>
            <div className="mt-2 text-xs opacity-70 text-right">
              {attribution.progress.percent}% complete
            </div>
          </div>

          {/* Stage Visualization */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-4">Funnel Stages</div>
            <div className="relative">
              {[...attribution.stages_completed, ...attribution.stages_pending]
                .sort((a, b) => a.order - b.order)
                .map((stage, idx, arr) => (
                  <div key={stage.id} className="flex items-start gap-3 pb-4">
                    {/* Connector line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          stage.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {stage.completed ? '✓' : stage.order}
                      </div>
                      {idx < arr.length - 1 ? (
                        <div
                          className={`w-0.5 h-8 ${
                            stage.completed ? 'bg-green-300' : 'bg-gray-200'
                          }`}
                        />
                      ) : null}
                    </div>

                    {/* Stage details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{stage.name}</div>
                        {stage.completed ? (
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
                            Complete
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {stage.description}
                      </div>
                      {stage.timestamp ? (
                        <div className="text-xs opacity-50 mt-1">
                          {formatTimestamp(stage.timestamp)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Timing Metrics */}
          {Object.keys(attribution.timing.formatted).length > 0 ? (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3">Stage Timing</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(attribution.timing.formatted).map(
                  ([key, value]) =>
                    value ? (
                      <div key={key} className="rounded-lg border p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {value}
                        </div>
                        <div className="text-xs opacity-70 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ) : null
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Conversion Tab */}
      {activeTab === 'conversion' && conversions ? (
        <div className="mt-4 space-y-4">
          {/* Overall Conversion */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Overall Conversion</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversions.overall.signup_to_activated ?? '-'}%
                </div>
                <div className="text-xs opacity-70">Signup → Activated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {conversions.overall.signup_to_converted ?? '-'}%
                </div>
                <div className="text-xs opacity-70">Signup → Converted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {conversions.overall.activated_to_converted ?? '-'}%
                </div>
                <div className="text-xs opacity-70">Activated → Converted</div>
              </div>
            </div>
          </div>

          {/* Stage-by-Stage Conversion */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Stage Conversion Rates</div>
            <div className="space-y-3">
              {conversions.by_stage.map((conv) => (
                <div
                  key={`${conv.from_stage}-${conv.to_stage}`}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="capitalize">
                        {conv.from_stage.replace(/_/g, ' ')}
                      </span>
                      <span className="mx-2 opacity-50">→</span>
                      <span className="capitalize">
                        {conv.to_stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        conv.conversion_rate === 100
                          ? 'text-green-600'
                          : conv.conversion_rate === 0
                          ? 'text-gray-500'
                          : 'text-blue-600'
                      }`}
                    >
                      {conv.conversion_rate !== null
                        ? `${conv.conversion_rate}%`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        conv.conversion_rate === 100
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${conv.conversion_rate ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs opacity-70">
                    <span>
                      From:{' '}
                      {conv.from_completed ? (
                        <span className="text-green-600">Complete</span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </span>
                    <span>
                      To:{' '}
                      {conv.to_completed ? (
                        <span className="text-green-600">Complete</span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && revenue ? (
        <div className="mt-4 space-y-4">
          {/* Revenue Overview */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Revenue Metrics</div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  revenue.is_converted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {revenue.is_converted ? 'Converted' : 'Not Converted'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenue.mrr)}
                </div>
                <div className="text-xs opacity-70">MRR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(revenue.arr)}
                </div>
                <div className="text-xs opacity-70">ARR</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium capitalize">
                  {revenue.current_tier}
                </div>
                <div className="text-xs opacity-70">Current Tier</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">
                  {revenue.time_to_revenue.formatted ?? 'N/A'}
                </div>
                <div className="text-xs opacity-70">Time to Revenue</div>
              </div>
            </div>
          </div>

          {/* Revenue Attribution */}
          {revenue.attribution.length > 0 ? (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3">Attribution by Milestone</div>
              <div className="space-y-3">
                {revenue.attribution.map((attr) => (
                  <div
                    key={attr.milestone}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{attr.name}</div>
                      <div className="text-xs opacity-70">
                        {attr.weight_percent}% attribution weight
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(attr.attributed_mrr)}
                      </div>
                      <div className="text-xs opacity-70">MRR attributed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <div className="text-sm text-gray-500">
                No revenue attribution yet
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Complete activation milestones and upgrade to see attribution
              </div>
            </div>
          )}
        </div>
      ) : null}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
