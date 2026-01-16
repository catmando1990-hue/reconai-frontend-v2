"use client";

import * as React from "react";

/**
 * STEP 27 — Lazy Loading Utilities for Dashboard Panels
 *
 * Provides:
 * - Dynamic import wrappers for heavy dashboard components
 * - Loading states for lazy-loaded panels
 * - No polling or background timers
 * - Dashboard-only
 *
 * Use these to avoid loading heavy components on initial dashboard view.
 */

/**
 * Loading placeholder for lazy-loaded panels
 */
export function PanelLoadingFallback() {
  return (
    <div className="rounded-2xl border p-4 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-48 rounded bg-gray-100" />
      <div className="mt-4 space-y-2">
        <div className="h-8 rounded bg-gray-100" />
        <div className="h-8 rounded bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Error boundary fallback for lazy-loaded panels
 */
export function PanelErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="text-sm font-medium text-red-800">
        Failed to load panel
      </div>
      <div className="mt-1 text-xs text-red-600">{error.message}</div>
      {resetErrorBoundary ? (
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mt-2 rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

/**
 * Lazy load wrapper with Suspense
 */
export function LazyPanel({
  children,
  fallback = <PanelLoadingFallback />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <React.Suspense fallback={fallback}>{children}</React.Suspense>;
}

// ============================================================================
// Lazy-loaded Panel Exports (STEP 27: Dynamic imports for heavy components)
// ============================================================================

/**
 * Lazy-loaded BenchmarksPanel
 * Heavy component with charts - defer loading until needed
 */
export const LazyBenchmarksPanel = React.lazy(() =>
  import("../components/platform/BenchmarksPanel").then((m) => ({
    default: m.BenchmarksPanel,
  })),
);

/**
 * Lazy-loaded FunnelAttributionPanel
 * Heavy component with funnel visualization - defer loading until needed
 */
export const LazyFunnelAttributionPanel = React.lazy(() =>
  import("../components/platform/FunnelAttributionPanel").then((m) => ({
    default: m.FunnelAttributionPanel,
  })),
);

/**
 * Lazy-loaded OrgGovernancePanel
 * Complex panel with multiple tabs - defer loading until needed
 */
export const LazyOrgGovernancePanel = React.lazy(() =>
  import("../components/platform/OrgGovernancePanel").then((m) => ({
    default: m.OrgGovernancePanel,
  })),
);

/**
 * Lazy-loaded InvestorAuditPanel
 * Read-only audit panel - defer loading until needed
 */
export const LazyInvestorAuditPanel = React.lazy(() =>
  import("../components/platform/InvestorAuditPanel").then((m) => ({
    default: m.InvestorAuditPanel,
  })),
);

/**
 * Lazy-loaded BillingReconcilePanel
 * Reconciliation panel - defer loading until needed
 */
export const LazyBillingReconcilePanel = React.lazy(() =>
  import("../components/billing/BillingReconcilePanel").then((m) => ({
    default: m.BillingReconcilePanel,
  })),
);

/**
 * Lazy-loaded KillSwitchStatusPanel
 * Kill-switch status - defer loading until needed
 */
export const LazyKillSwitchStatusPanel = React.lazy(() =>
  import("../components/platform/KillSwitchStatusPanel").then((m) => ({
    default: m.KillSwitchStatusPanel,
  })),
);

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Check if component should be lazy-loaded based on viewport visibility
 */
export function useInViewport<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
) {
  const [isInViewport, setIsInViewport] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          // Stop observing once in viewport
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref]);

  return isInViewport;
}

/**
 * Defer rendering until component is in viewport
 */
export function DeferredRender({
  children,
  fallback = <PanelLoadingFallback />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInViewport = useInViewport(ref);

  return <div ref={ref}>{isInViewport ? children : fallback}</div>;
}
