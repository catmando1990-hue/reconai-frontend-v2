// src/lib/entitlements.ts
// STEP 5 — Monetization Gates & Tier Enforcement
// Client-side entitlement helpers for upgrade prompts.
// NO dark patterns — transparent tier limits only.
// Must match backend app/entitlements/tiers.py

export type SubscriptionTier =
  | "free"
  | "starter"
  | "pro"
  | "govcon"
  | "enterprise";

export interface TierLimits {
  name: string;
  exports_enabled: boolean;
  export_limit_per_day: number;
  signals_depth: number;
  summary_enabled: boolean;
  intelligence_enabled: boolean;
  max_transactions_per_month: number;
}

/**
 * Tier limits (must match backend app/entitlements/tiers.py)
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    name: "Free",
    exports_enabled: false,
    export_limit_per_day: 0,
    signals_depth: 10,
    summary_enabled: true,
    intelligence_enabled: true,
    max_transactions_per_month: 100,
  },
  starter: {
    name: "Starter",
    exports_enabled: true,
    export_limit_per_day: 5,
    signals_depth: 50,
    summary_enabled: true,
    intelligence_enabled: true,
    max_transactions_per_month: 500,
  },
  pro: {
    name: "Pro",
    exports_enabled: true,
    export_limit_per_day: 50,
    signals_depth: 200,
    summary_enabled: true,
    intelligence_enabled: true,
    max_transactions_per_month: 5000,
  },
  govcon: {
    name: "GovCon",
    exports_enabled: true,
    export_limit_per_day: 100,
    signals_depth: 500,
    summary_enabled: true,
    intelligence_enabled: true,
    max_transactions_per_month: 10000,
  },
  enterprise: {
    name: "Enterprise",
    exports_enabled: true,
    export_limit_per_day: 1000,
    signals_depth: 1000,
    summary_enabled: true,
    intelligence_enabled: true,
    max_transactions_per_month: 100000,
  },
};

/**
 * Check if a plan has any entitlement (non-free).
 */
export function hasEntitlement(plan: string | null | undefined): boolean {
  return plan !== "free" && plan !== null && plan !== undefined;
}

/**
 * Get tier limits for a plan.
 */
export function getTierLimits(plan: string | null | undefined): TierLimits {
  const normalized = plan?.toLowerCase() as SubscriptionTier;
  return TIER_LIMITS[normalized] || TIER_LIMITS.free;
}

/**
 * Check if exports are enabled for a plan.
 */
export function canExport(plan: string | null | undefined): boolean {
  const limits = getTierLimits(plan);
  return limits.exports_enabled;
}

/**
 * Get signals depth limit for a plan.
 */
export function getSignalsDepth(plan: string | null | undefined): number {
  const limits = getTierLimits(plan);
  return limits.signals_depth;
}

/**
 * Get max transactions per month for a plan.
 */
export function getMaxTransactionsPerMonth(
  plan: string | null | undefined,
): number {
  const limits = getTierLimits(plan);
  return limits.max_transactions_per_month;
}

export type EntitlementFeature =
  | "exports"
  | "signals_depth"
  | "summary"
  | "intelligence";

export interface FeatureAccessResult {
  allowed: boolean;
  upgrade_to: SubscriptionTier | null;
}

/**
 * Check if a feature is available.
 * Returns { allowed: boolean, upgrade_to?: string }
 */
export function checkFeatureAccess(
  plan: string | null | undefined,
  feature: EntitlementFeature,
): FeatureAccessResult {
  const limits = getTierLimits(plan);

  switch (feature) {
    case "exports":
      return {
        allowed: limits.exports_enabled,
        upgrade_to: limits.exports_enabled ? null : "starter",
      };
    case "signals_depth":
      return { allowed: true, upgrade_to: null };
    case "summary":
      return {
        allowed: limits.summary_enabled,
        upgrade_to: limits.summary_enabled ? null : "starter",
      };
    case "intelligence":
      return {
        allowed: limits.intelligence_enabled,
        upgrade_to: limits.intelligence_enabled ? null : "starter",
      };
    default:
      return { allowed: false, upgrade_to: null };
  }
}

/**
 * Generate upgrade prompt message (no dark patterns).
 */
export function getUpgradePrompt(
  feature: EntitlementFeature,
  currentTier: string | null | undefined,
): string {
  const tierName = getTierLimits(currentTier).name;

  const messages: Record<string, string> = {
    exports: `Export functionality is available on Starter and above. Your current plan: ${tierName}.`,
    signals_depth: `You've reached your signal limit (${getSignalsDepth(currentTier)}). Upgrade for more insights.`,
    default: `This feature requires an upgraded plan. Your current plan: ${tierName}.`,
  };

  return messages[feature] || messages.default;
}

/**
 * Check if user has GovCon entitlement.
 * Canonical safe default: deny until explicitly granted.
 */
export function hasGovConEntitlement(
  tiers: string[] | null | undefined,
): boolean {
  if (!tiers || !Array.isArray(tiers)) return false;

  const normalizedTiers = tiers.map((t) => t.toLowerCase());
  return (
    normalizedTiers.includes("govcon") ||
    normalizedTiers.includes("contractor") ||
    normalizedTiers.includes("enterprise")
  );
}
