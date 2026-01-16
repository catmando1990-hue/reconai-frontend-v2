'use client';

import * as React from 'react';

/**
 * STEP 17 + STEP 19 — Activation Benchmarks & Cohorts Panel
 *
 * Read-only views for:
 * - Activation time benchmarks
 * - Cohort comparison by tier/signup month
 *
 * STEP 19: Intentional empty/insufficient-data states with explanatory copy.
 *
 * Manual refresh only. Dashboard-only.
 */

type BenchmarkMetric = {
  median_seconds: number | null;
  p25_seconds: number | null;
  p75_seconds: number | null;
  p90_seconds: number | null;
  sample_size: number;
  median_formatted: string | null;
  p25_formatted: string | null;
  p75_formatted: string | null;
  p90_formatted: string | null;
  insufficient_data?: boolean;
  min_required?: number;
  message?: string;
};

type Cohort = {
  cohort_type: string;
  cohort_value: string;
  total_orgs: number;
  activated_orgs: number | null;
  activation_rate: number | null;
  insufficient_data?: boolean;
  min_required?: number;
  message?: string;
};

type BenchmarksResponse = {
  request_id: string;
  benchmarks: {
    time_to_first_bank: BenchmarkMetric;
    time_to_first_classification: BenchmarkMetric;
    time_to_first_insight: BenchmarkMetric;
  };
  snapshot_at: string;
};

type CohortsResponse = {
  request_id: string;
  cohorts: Cohort[];
  snapshot_at: string;
};

export function BenchmarksPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [benchmarksData, setBenchmarksData] = React.useState<BenchmarksResponse | null>(null);
  const [cohortsData, setCohortsData] = React.useState<CohortsResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'benchmarks' | 'cohorts'>('benchmarks');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [benchmarksRes, cohortsRes] = await Promise.all([
        fetch(`${apiBase}/api/benchmarks/activation`, { credentials: 'include' }),
        fetch(`${apiBase}/api/benchmarks/cohorts`, { credentials: 'include' }),
      ]);

      if (!benchmarksRes.ok) throw new Error(`Benchmarks: HTTP ${benchmarksRes.status}`);
      if (!cohortsRes.ok) throw new Error(`Cohorts: HTTP ${cohortsRes.status}`);

      setBenchmarksData(await benchmarksRes.json());
      setCohortsData(await cohortsRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load benchmarks data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tierCohorts = cohortsData?.cohorts.filter((c) => c.cohort_type === 'tier') ?? [];
  const monthCohorts = cohortsData?.cohorts.filter((c) => c.cohort_type === 'signup_month') ?? [];

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Activation Benchmarks</div>
          <div className="text-xs opacity-70">Time-to-first-value metrics and cohort comparison. Read-only.</div>
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
        {(['benchmarks', 'cohorts'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize ${activeTab === tab ? 'border-b-2 border-blue-500 font-medium' : 'opacity-70'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && benchmarksData ? (
        <div className="mt-4 space-y-4">
          {Object.entries(benchmarksData.benchmarks).map(([key, metric]) => (
            <div key={key} className="rounded-xl border p-4">
              <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>

              {/* STEP 19: Insufficient data state */}
              {metric.insufficient_data ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                  <div className="text-sm font-medium text-amber-800">Insufficient Data</div>
                  <div className="mt-1 text-xs text-amber-600">
                    Minimum {metric.min_required ?? 5} samples required for statistically meaningful benchmarks.
                  </div>
                  <div className="mt-2 text-xs text-amber-500">
                    Current sample size: {metric.sample_size}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {metric.median_formatted ?? '-'}
                      </div>
                      <div className="text-xs opacity-70">Median</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {metric.p25_formatted ?? '-'}
                      </div>
                      <div className="text-xs opacity-70">25th %ile</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {metric.p75_formatted ?? '-'}
                      </div>
                      <div className="text-xs opacity-70">75th %ile</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {metric.p90_formatted ?? '-'}
                      </div>
                      <div className="text-xs opacity-70">90th %ile</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-center opacity-50">
                    Sample size: {metric.sample_size} organizations
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="text-xs opacity-50 text-center">
            Advisory: Benchmarks are calculated from anonymized aggregate data.
          </div>
        </div>
      ) : null}

      {/* Cohorts Tab */}
      {activeTab === 'cohorts' && cohortsData ? (
        <div className="mt-4 space-y-4">
          {/* By Tier */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Cohorts by Tier</div>
            <div className="space-y-2">
              {tierCohorts.map((cohort) => (
                <div key={cohort.cohort_value} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium capitalize">{cohort.cohort_value}</span>
                    {/* STEP 19: Insufficient data indicator */}
                    {cohort.insufficient_data ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {cohort.total_orgs} orgs (min {cohort.min_required ?? 3} required)
                      </span>
                    ) : (
                      <span className="text-xs opacity-70">
                        {cohort.activated_orgs}/{cohort.total_orgs} activated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cohort.insufficient_data ? (
                      <span className="text-xs text-amber-600 italic">Insufficient data</span>
                    ) : (
                      <>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${cohort.activation_rate ?? 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {cohort.activation_rate ?? 0}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Signup Month */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Cohorts by Signup Month</div>
            <div className="space-y-2">
              {monthCohorts.map((cohort) => (
                <div key={cohort.cohort_value} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cohort.cohort_value}</span>
                    {/* STEP 19: Insufficient data indicator */}
                    {cohort.insufficient_data ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {cohort.total_orgs} orgs (min {cohort.min_required ?? 3} required)
                      </span>
                    ) : (
                      <span className="text-xs opacity-70">
                        {cohort.activated_orgs}/{cohort.total_orgs} activated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cohort.insufficient_data ? (
                      <span className="text-xs text-amber-600 italic">Insufficient data</span>
                    ) : (
                      <>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${cohort.activation_rate ?? 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {cohort.activation_rate ?? 0}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs opacity-50 text-center">
            Advisory: Cohort data is calculated from anonymized aggregate data.
            Cohorts with fewer than the minimum required organizations show &quot;Insufficient data&quot;.
          </div>
        </div>
      ) : null}

      {benchmarksData ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {benchmarksData.request_id}</div>
      ) : null}
    </div>
  );
}
