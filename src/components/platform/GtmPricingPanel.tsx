'use client';

import * as React from 'react';

type Tier = {
  id: string;
  name: string;
  price_monthly_usd: number;
  price_annual_usd: number;
  description: string;
  features: string[];
  limits: {
    transactions_per_month: number;
    users: number;
    integrations: number;
  };
  recommended_for: string;
};

type Feature = {
  id: string;
  description: string;
  available_tiers: string[];
  enabled_for_current: boolean;
};

type UpgradePath = {
  target_tier: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  annual_savings: number;
  new_features: string[];
  recommended: boolean;
};

type TiersResponse = {
  request_id: string;
  org_id: string;
  current_tier: string;
  tiers: Tier[];
};

type FeaturesResponse = {
  request_id: string;
  org_id: string;
  current_tier: string;
  features: Feature[];
  total_features: number;
  enabled_count: number;
};

type UpgradePathsResponse = {
  request_id: string;
  org_id: string;
  current_tier: string;
  upgrade_paths: UpgradePath[];
  recommendation: UpgradePath | null;
};

export function GtmPricingPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [tiersData, setTiersData] = React.useState<TiersResponse | null>(null);
  const [featuresData, setFeaturesData] = React.useState<FeaturesResponse | null>(null);
  const [upgradePathsData, setUpgradePathsData] = React.useState<UpgradePathsResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<'tiers' | 'features' | 'upgrades'>('tiers');
  const [upgrading, setUpgrading] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [tiersRes, featuresRes, upgradesRes] = await Promise.all([
        fetch(`${apiBase}/api/gtm/tiers`, { credentials: 'include' }),
        fetch(`${apiBase}/api/gtm/features`, { credentials: 'include' }),
        fetch(`${apiBase}/api/gtm/upgrade-paths`, { credentials: 'include' }),
      ]);

      if (!tiersRes.ok) throw new Error(`Tiers: HTTP ${tiersRes.status}`);
      if (!featuresRes.ok) throw new Error(`Features: HTTP ${featuresRes.status}`);
      if (!upgradesRes.ok) throw new Error(`Upgrades: HTTP ${upgradesRes.status}`);

      setTiersData(await tiersRes.json());
      setFeaturesData(await featuresRes.json());
      setUpgradePathsData(await upgradesRes.json());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const requestUpgrade = async (targetTier: string) => {
    setUpgrading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/gtm/request-upgrade`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_tier: targetTier,
          billing_cycle: billingCycle,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      alert(`Upgrade requested! ${json.message}`);
      setSelectedTier(null);
      fetchData();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to request upgrade');
    } finally {
      setUpgrading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">GTM & Pricing</div>
          <div className="text-xs opacity-70">Tier packaging, feature gates, upgrade paths.</div>
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
        {(['tiers', 'features', 'upgrades'] as const).map((tab) => (
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

      {/* Current Tier Badge */}
      {tiersData ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs opacity-70">Current Tier:</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            {tiersData.current_tier.toUpperCase()}
          </span>
        </div>
      ) : null}

      {/* Tiers Tab */}
      {activeTab === 'tiers' && tiersData ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {tiersData.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-xl border p-3 ${tier.id === tiersData.current_tier ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="font-medium">{tier.name}</div>
              <div className="text-xl font-bold">
                ${billingCycle === 'monthly' ? tier.price_monthly_usd : tier.price_annual_usd}
                <span className="text-xs font-normal opacity-70">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <div className="mt-2 text-xs opacity-70">{tier.description}</div>
              <div className="mt-2 text-xs">
                <div>{tier.limits.transactions_per_month === -1 ? 'Unlimited' : tier.limits.transactions_per_month} txns/mo</div>
                <div>{tier.limits.users === -1 ? 'Unlimited' : tier.limits.users} users</div>
              </div>
              {tier.id !== tiersData.current_tier && tier.price_monthly_usd > (tiersData.tiers.find(t => t.id === tiersData.current_tier)?.price_monthly_usd ?? 0) ? (
                <button
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className="mt-2 w-full rounded-lg border bg-blue-600 px-2 py-1 text-xs text-white"
                >
                  Upgrade
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Features Tab */}
      {activeTab === 'features' && featuresData ? (
        <div className="mt-4">
          <div className="mb-3 text-xs opacity-70">
            {featuresData.enabled_count} of {featuresData.total_features} features enabled
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {featuresData.features.map((feature) => (
              <div
                key={feature.id}
                className={`rounded-lg border p-2 ${feature.enabled_for_current ? 'bg-green-50' : 'opacity-60'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${feature.enabled_for_current ? 'text-green-600' : 'text-gray-400'}`}>
                    {feature.enabled_for_current ? '✓' : '○'}
                  </span>
                  <span className="text-sm font-medium">{feature.id.replace(/_/g, ' ')}</span>
                </div>
                <div className="ml-5 text-xs opacity-70">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Upgrades Tab */}
      {activeTab === 'upgrades' && upgradePathsData ? (
        <div className="mt-4">
          {upgradePathsData.upgrade_paths.length > 0 ? (
            <div className="space-y-3">
              {upgradePathsData.upgrade_paths.map((path) => (
                <div
                  key={path.target_tier}
                  className={`rounded-xl border p-3 ${path.recommended ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{path.name}</span>
                      {path.recommended ? (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${billingCycle === 'monthly' ? path.price_monthly : path.price_annual}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                      {path.annual_savings > 0 && billingCycle === 'annual' ? (
                        <div className="text-xs text-green-600">Save ${path.annual_savings}/yr</div>
                      ) : null}
                    </div>
                  </div>
                  {path.new_features.length > 0 ? (
                    <div className="mt-2 text-xs opacity-70">
                      New features: {path.new_features.slice(0, 3).join(', ')}
                      {path.new_features.length > 3 ? ` +${path.new_features.length - 3} more` : ''}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedTier(path.target_tier)}
                    className="mt-2 rounded-lg border bg-blue-600 px-3 py-1 text-xs text-white"
                  >
                    Upgrade to {path.name}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm opacity-70 py-4">
              You are on the highest tier. No upgrades available.
            </div>
          )}
        </div>
      ) : null}

      {/* Billing Cycle Toggle */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs opacity-70">Billing:</span>
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`rounded-lg px-2 py-1 text-xs ${billingCycle === 'monthly' ? 'bg-blue-100 font-medium' : ''}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('annual')}
          className={`rounded-lg px-2 py-1 text-xs ${billingCycle === 'annual' ? 'bg-blue-100 font-medium' : ''}`}
        >
          Annual (Save 20%)
        </button>
      </div>

      {/* Upgrade Modal */}
      {selectedTier ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <div className="font-medium">Confirm Upgrade</div>
            <div className="mt-2 text-sm opacity-70">
              Upgrade to <strong>{selectedTier}</strong> ({billingCycle} billing)?
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTier(null)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => requestUpgrade(selectedTier)}
                disabled={upgrading}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
              >
                {upgrading ? 'Processing...' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tiersData ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {tiersData.request_id}</div>
      ) : null}
    </div>
  );
}
