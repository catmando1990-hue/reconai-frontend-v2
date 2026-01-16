'use client';

import * as React from 'react';

/**
 * STEP 15 + STEP 20 — Entitlement-Driven UI Hiding & Upgrade UX Wiring
 *
 * This component gates feature access based on capabilities from:
 * GET /api/entitlements/capabilities
 *
 * Two modes:
 * - hard-disable: Feature visible but disabled with explanatory empty state + upgrade CTA
 * - soft-hide: Feature hidden; discoverable via upgrade affordance
 *
 * STEP 20: Upgrade UX Wiring
 * - CTAs route to existing Stripe upgrade flow via upgrade_url (/settings/billing)
 * - Manual navigation only (no auto-redirects)
 * - No pricing logic duplication - uses existing billing endpoints
 * - Dashboard-only
 *
 * Manual-first UX only. Dashboard-only.
 */

type Capabilities = {
  tier: string;
  tier_name: string;
  features: {
    enabled: string[];
    disabled: string[];
  };
  upgrade_url: string;
};

type EntitlementGateProps = {
  feature: string;
  mode: 'hard-disable' | 'soft-hide';
  capabilities: Capabilities | null;
  children: React.ReactNode;
  featureLabel?: string;
  upgradeMessage?: string;
  /** STEP 20: Optional callback when user clicks upgrade (for analytics/tracking) */
  onUpgradeClick?: (feature: string, currentTier: string) => void;
};

/**
 * EntitlementGate - Gates UI based on feature capabilities
 *
 * STEP 20: CTAs are wired to existing Stripe upgrade flow via upgrade_url.
 * Manual navigation only - no auto-redirects.
 *
 * @param feature - The feature ID to check (e.g., 'ai_insights', 'exports')
 * @param mode - 'hard-disable' shows disabled UI, 'soft-hide' hides entirely
 * @param capabilities - The capabilities response from /api/entitlements/capabilities
 * @param children - The content to render if feature is enabled
 * @param featureLabel - Human-readable feature name for upgrade message
 * @param upgradeMessage - Custom upgrade message (optional)
 * @param onUpgradeClick - Optional callback for analytics when user clicks upgrade
 */
export function EntitlementGate({
  feature,
  mode,
  capabilities,
  children,
  featureLabel,
  upgradeMessage,
  onUpgradeClick,
}: EntitlementGateProps) {
  // If capabilities not loaded yet, show loading placeholder
  if (!capabilities) {
    return (
      <div className="animate-pulse rounded-xl border p-4">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </div>
    );
  }

  const isEnabled = capabilities.features.enabled.includes(feature);

  // Feature is enabled - render children normally
  if (isEnabled) {
    return <>{children}</>;
  }

  // Feature is disabled
  const label = featureLabel ?? feature.replace(/_/g, ' ');
  const message = upgradeMessage ?? `${label} is available on higher tiers.`;

  /**
   * STEP 20: Handle upgrade click
   * - Manual navigation only (no auto-redirects)
   * - Routes to existing Stripe upgrade flow
   * - Optional callback for analytics
   */
  const handleUpgradeClick = () => {
    // Call optional analytics callback
    if (onUpgradeClick) {
      onUpgradeClick(feature, capabilities.tier);
    }
    // Navigation happens via href - no programmatic redirect
  };

  // Soft-hide: Feature hidden, discoverable via upgrade affordance
  if (mode === 'soft-hide') {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium capitalize">{label}</span> available with upgrade
        </div>
        {/* STEP 20: Manual navigation to existing Stripe upgrade flow */}
        <a
          href={capabilities.upgrade_url}
          onClick={handleUpgradeClick}
          className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          View Plans
        </a>
      </div>
    );
  }

  // Hard-disable: Feature visible but disabled with explanatory empty state + upgrade CTA
  return (
    <div className="relative">
      {/* Disabled overlay */}
      <div className="pointer-events-none opacity-40">{children}</div>

      {/* Overlay message */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-4">
          <div className="text-sm font-medium text-gray-700 capitalize">{label}</div>
          <div className="mt-1 text-xs text-gray-500">{message}</div>
          <div className="mt-2 text-xs text-gray-400">
            Current tier: <span className="font-medium">{capabilities.tier_name}</span>
          </div>
          {/* STEP 20: Manual navigation to existing Stripe upgrade flow */}
          <a
            href={capabilities.upgrade_url}
            onClick={handleUpgradeClick}
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Upgrade to Unlock
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * useCapabilities - Hook to fetch capabilities from the API
 *
 * Manual-first: Fetches once on mount, provides manual refresh
 */
export function useCapabilities(apiBase: string) {
  const [capabilities, setCapabilities] = React.useState<Capabilities | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCapabilities = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/entitlements/capabilities`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setCapabilities(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load capabilities');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  return {
    capabilities,
    loading,
    error,
    refresh: fetchCapabilities,
  };
}

/**
 * FeatureCheck - Simple boolean check for feature availability
 *
 * Returns true if feature is enabled, false otherwise
 */
export function isFeatureEnabled(
  capabilities: Capabilities | null,
  feature: string
): boolean {
  if (!capabilities) return false;
  return capabilities.features.enabled.includes(feature);
}

/**
 * UpgradePrompt - Standalone upgrade prompt component
 *
 * STEP 20: Routes to existing Stripe upgrade flow via upgrade_url.
 * Manual navigation only - no auto-redirects.
 *
 * Use when you want to show an upgrade prompt without gating content
 */
export function UpgradePrompt({
  capabilities,
  feature,
  featureLabel,
  onUpgradeClick,
}: {
  capabilities: Capabilities | null;
  feature: string;
  featureLabel?: string;
  /** STEP 20: Optional callback when user clicks upgrade (for analytics/tracking) */
  onUpgradeClick?: (feature: string, currentTier: string) => void;
}) {
  if (!capabilities) return null;

  const isEnabled = capabilities.features.enabled.includes(feature);
  if (isEnabled) return null;

  const label = featureLabel ?? feature.replace(/_/g, ' ');

  /**
   * STEP 20: Handle upgrade click
   * - Manual navigation only (no auto-redirects)
   * - Routes to existing Stripe upgrade flow
   */
  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick(feature, capabilities.tier);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-blue-800 capitalize">
            Unlock {label}
          </div>
          <div className="text-xs text-blue-600">
            Upgrade from {capabilities.tier_name} to access this feature
          </div>
        </div>
        {/* STEP 20: Manual navigation to existing Stripe upgrade flow */}
        <a
          href={capabilities.upgrade_url}
          onClick={handleClick}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Upgrade
        </a>
      </div>
    </div>
  );
}
