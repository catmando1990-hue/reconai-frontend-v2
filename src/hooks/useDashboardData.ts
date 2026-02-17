"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { useUserProfile } from "@/lib/user-profile-context";
import { hasGovConEntitlement } from "@/lib/entitlements";
import type { Insight } from "@/lib/api/types";
import type { KPIData } from "@/components/dashboard/ExecutiveKPIRail";
import type { DriverData } from "@/components/dashboard/TopDriversPanel";
import type { StatusData } from "@/components/dashboard/StatusDistributionPanel";
import type { GeoData } from "@/components/dashboard/GeographyPanel";
import type { OperationalKPIs } from "@/components/dashboard/OperationalKPIRail";

/**
 * useDashboardData - Aggregated data hook for the executive dashboard
 *
 * Fetches all dashboard data from existing APIs:
 * - CFO snapshot (KPIs)
 * - Intelligence insights (for feed + signals count)
 * - Dashboard metrics (operational data)
 * - Cash flow report (for category breakdown)
 *
 * CANONICAL LAWS:
 * - Single mount fetch, no polling
 * - Auth-gated (waits for Clerk ready)
 * - Fail-closed on errors
 * - Manual refresh controls only
 */

// API Response Types
interface CfoSnapshotResponse {
  lifecycle: "success" | "pending" | "failed" | "stale";
  reason_code?: string;
  reason_message?: string;
  snapshot: {
    as_of: string;
    runway_days: number | null;
    cash_on_hand: number | null;
    total_receivables: number | null;
    total_payables: number | null;
    risk_score: number | null;
  } | null;
}

// InsightsResponse removed - intelligence is now domain-specific

interface CashFlowSection {
  inflows: number;
  outflows: number;
  net: number;
  items: Array<{ category: string; amount: number }>;
}

interface CashFlowResponse {
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  net_change: number;
}

interface DashboardMetricsResponse {
  available: boolean;
  counts: {
    invoices: number | null;
    bills: number | null;
    customers: number | null;
    vendors: number | null;
  };
}

// Dashboard Data State Type
interface DashboardDataState {
  // Row 1: KPI data
  kpiData: KPIData | null;
  kpiLoading: boolean;

  // Row 2 Panel 1: Top Drivers (bar chart)
  driversData: DriverData[] | null;
  driversLoading: boolean;
  driversError: string | null;

  // Row 2 Panel 2: Status Distribution (donut chart)
  statusData: StatusData[] | null;
  statusLoading: boolean;
  statusError: string | null;

  // Row 2 Panel 3: Geography
  geoData: GeoData[] | null;
  geoLoading: boolean;
  geoError: string | null;

  // Row 3: Operational KPIs
  operationalData: OperationalKPIs | null;
  operationalLoading: boolean;

  // Intelligence feed (sidebar)
  insightsData: Insight[] | null;
  insightsLifecycle: "success" | "pending" | "failed" | "stale" | null;
  insightsReasonMessage: string | null;
  insightsLoading: boolean;

  // GovCon entitlement
  hasGovCon: boolean;

  // Global state
  isLoading: boolean;
  hasAnyData: boolean;

  // Refresh functions
  refreshAll: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
}

export function useDashboardData(): DashboardDataState {
  const { apiFetch } = useApi();
  const { isLoaded: authReady, org_id } = useOrg();
  const { profile } = useUserProfile();

  // KPI State
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  // Chart State
  const [driversData, setDriversData] = useState<DriverData[] | null>(null);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  const [statusData, setStatusData] = useState<StatusData[] | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [geoData, setGeoData] = useState<GeoData[] | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Operational State
  const [operationalData, setOperationalData] =
    useState<OperationalKPIs | null>(null);
  const [operationalLoading, setOperationalLoading] = useState(true);

  // Insights State
  const [insightsData, setInsightsData] = useState<Insight[] | null>(null);
  const [insightsLifecycle, setInsightsLifecycle] = useState<
    "success" | "pending" | "failed" | "stale" | null
  >(null);
  const [insightsReasonMessage, setInsightsReasonMessage] = useState<
    string | null
  >(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // GovCon entitlement
  const hasGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  // Fetch CFO snapshot for KPIs
  const fetchKPIs = useCallback(async () => {
    try {
      setKpiLoading(true);
      const response = await apiFetch<CfoSnapshotResponse>("/api/cfo/snapshot");

      if (response?.lifecycle === "success" && response.snapshot) {
        const { snapshot } = response;
        setKpiData({
          netCashPosition: snapshot.cash_on_hand,
          runway90Days: snapshot.runway_days,
          riskIndex: snapshot.risk_score,
          aiConfidence: null, // Will be derived from insights
          complianceStatus: null, // Will be derived from compliance data
          dcaaReady: undefined,
        });
      } else {
        setKpiData(null);
      }
    } catch {
      setKpiData(null);
    } finally {
      setKpiLoading(false);
    }
  }, [apiFetch]);

  // Fetch cash flow data for Top Drivers chart
  const fetchDrivers = useCallback(async () => {
    try {
      setDriversLoading(true);
      setDriversError(null);

      const response = await apiFetch<CashFlowResponse>(
        "/api/reports/cash-flow?period=30",
      );

      // Dev logging for API verification
      if (process.env.NODE_ENV === "development") {
        console.log("[Dashboard] Cash Flow Response:", response);
      }

      if (response?.operating?.items && response.operating.items.length > 0) {
        // Use operating section items as top drivers
        const drivers = response.operating.items
          .filter((item) => Math.abs(item.amount) > 0)
          .map((item) => ({
            name: item.category || "Uncategorized",
            value: Math.abs(item.amount),
          }));

        if (drivers.length > 0) {
          setDriversData(drivers);
        } else {
          setDriversData(null);
          setDriversError("No spend data for selected period");
        }
      } else if (response) {
        // Response exists but no operating items
        setDriversData(null);
        setDriversError("Cash flow data unavailable for selected period");
      } else {
        setDriversData(null);
      }
    } catch {
      setDriversError("Failed to load cash flow data. Tap to retry.");
      setDriversData(null);
    } finally {
      setDriversLoading(false);
    }
  }, [apiFetch]);

  // Fetch dashboard metrics for status distribution and operational data
  const fetchMetrics = useCallback(async () => {
    try {
      setStatusLoading(true);
      setStatusError(null);
      setOperationalLoading(true);

      const response = await apiFetch<DashboardMetricsResponse>(
        "/api/dashboard/metrics",
      );

      // Dev logging for API verification
      if (process.env.NODE_ENV === "development") {
        console.log("[Dashboard] Metrics Response:", response);
      }

      if (response?.available && response.counts) {
        // Create status distribution from counts
        const items: StatusData[] = [];
        const { invoices, bills, customers, vendors } = response.counts;

        if (invoices !== null && invoices > 0) {
          items.push({
            name: "Invoices",
            value: invoices,
            color: "var(--chart-1)",
          });
        }
        if (bills !== null && bills > 0) {
          items.push({ name: "Bills", value: bills, color: "var(--chart-2)" });
        }
        if (customers !== null && customers > 0) {
          items.push({
            name: "Customers",
            value: customers,
            color: "var(--chart-3)",
          });
        }
        if (vendors !== null && vendors > 0) {
          items.push({
            name: "Vendors",
            value: vendors,
            color: "var(--chart-4)",
          });
        }

        if (items.length > 0) {
          setStatusData(items);
        } else {
          setStatusData(null);
        }

        // Set operational data
        const totalTransactions = (invoices || 0) + (bills || 0);

        setOperationalData({
          transactions30d: totalTransactions > 0 ? totalTransactions : null,
          reconciledPercent: null, // Would need reconciliation API
          flaggedCount: null,
          duplicatesCount: null,
          exportsReady: null,
          signalsCount: null, // Will be set from insights
        });
      } else {
        setStatusData(null);
        setOperationalData(null);
      }
    } catch {
      setStatusError("Failed to load data");
      setStatusData(null);
      setOperationalData(null);
    } finally {
      setStatusLoading(false);
      setOperationalLoading(false);
    }
  }, [apiFetch]);

  // Geographic data - currently disabled (no geo API exists)
  // Component shows intentional "not enabled" state when data is null
  const fetchGeo = useCallback(async () => {
    setGeoLoading(true);
    setGeoError(null);
    // No geo API exists - set null to show disabled state in component
    // In production, would fetch from /api/transactions/by-state or similar
    setGeoData(null);
    setGeoLoading(false);
  }, []);

  // Intelligence insights removed - now domain-specific
  // Intelligence is accessed per-domain at /core/intelligence, /cfo/intelligence, etc.
  const fetchInsights = useCallback(async () => {
    // No global intelligence endpoint - set empty state
    setInsightsLoading(false);
    setInsightsData(null);
    setInsightsLifecycle(null);
    setInsightsReasonMessage(null);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchKPIs(),
      fetchDrivers(),
      fetchMetrics(),
      fetchGeo(),
      fetchInsights(),
    ]);
  }, [fetchKPIs, fetchDrivers, fetchMetrics, fetchGeo, fetchInsights]);

  // Initial fetch on mount
  useEffect(() => {
    if (!authReady) return;

    void refreshAll();
  }, [authReady, org_id, refreshAll]);

  // Computed state - true if ANY data source is still loading
  const isLoading =
    kpiLoading ||
    driversLoading ||
    statusLoading ||
    geoLoading ||
    operationalLoading;

  const hasAnyData =
    kpiData !== null ||
    driversData !== null ||
    statusData !== null ||
    geoData !== null ||
    operationalData !== null;

  return {
    kpiData,
    kpiLoading,
    driversData,
    driversLoading,
    driversError,
    statusData,
    statusLoading,
    statusError,
    geoData,
    geoLoading,
    geoError,
    operationalData,
    operationalLoading,
    insightsData,
    insightsLifecycle,
    insightsReasonMessage,
    insightsLoading,
    hasGovCon,
    isLoading,
    hasAnyData,
    refreshAll,
    refreshInsights: fetchInsights,
    refreshDrivers: fetchDrivers,
  };
}
