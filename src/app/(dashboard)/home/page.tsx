"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import PageHelp from "@/components/dashboard/PageHelp";
import FirstRunSystemBanner from "@/components/dashboard/FirstRunSystemBanner";
import { ExecutiveKPIRail } from "@/components/dashboard/ExecutiveKPIRail";
import { TopDriversPanel } from "@/components/dashboard/TopDriversPanel";
import { StatusDistributionPanel } from "@/components/dashboard/StatusDistributionPanel";
import { GeographyPanel } from "@/components/dashboard/GeographyPanel";
import { OperationalKPIRail } from "@/components/dashboard/OperationalKPIRail";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw } from "lucide-react";

/**
 * Executive Dashboard - Stripe-Style Layout
 *
 * CANONICAL LAWS (NON-NEGOTIABLE):
 * - Desktop-first only. Desktop must NEVER look like mobile.
 * - Token-only colors (no hardcoded hex/rgb values)
 * - No placeholder content - intentional empty states only
 * - Intelligence is advisory-only, manual-run only, confidence-gated (>=0.85)
 * - No unnecessary polling or timers
 *
 * TARGET LAYOUT GEOMETRY:
 * - Container: max-w-[1600px], centered, px-6, py-6
 * - Global spacing: 24px gaps between rows (gap-6)
 * - Surface style: border-based, rounded-2xl, p-6
 * - Row 1: KPI grid = 5 tiles
 * - Row 2: 3 equal-height panels (bars, donut, geo)
 * - Row 3: KPI grid = 6 operational tiles
 *
 * DESIGN TOKENS:
 * - Surfaces: rounded-2xl, border-border, shadow-sm
 * - Typography: KPI 32-40px semibold, headers 18-20px medium
 */

export default function HomeDashboardPage() {
  const {
    // Row 1: Executive KPIs
    kpiData,
    kpiLoading,
    // Row 2: Charts
    driversData,
    driversLoading,
    driversError,
    statusData,
    statusLoading,
    statusError,
    geoData,
    geoLoading,
    geoError,
    // Row 3: Operational KPIs
    operationalData,
    operationalLoading,
    // Entitlement
    hasGovCon,
    // State
    isLoading,
    hasAnyData,
    // Actions
    refreshAll,
    refreshDrivers,
  } = useDashboardData();

  // No data state - show connect prompt
  if (!isLoading && !hasAnyData) {
    return (
      <RouteShell
        title="Dashboard"
        subtitle="Executive overview"
        right={
          <PageHelp
            title="Dashboard"
            description="Your executive financial overview. Connect accounts to see data."
          />
        }
      >
        <FirstRunSystemBanner />

        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Financial Data Yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Connect your bank accounts to see your executive dashboard with
              KPIs, charts, and operational metrics.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="default">
                <Link href="/connect-bank">Connect Bank</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/invoicing">Create Invoice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </RouteShell>
    );
  }

  return (
    <RouteShell
      title="Dashboard"
      subtitle="Executive financial overview"
      right={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void refreshAll()}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw
              className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
          <PageHelp
            title="Dashboard"
            description="Your executive overview with KPIs, charts, and operational metrics."
          />
          <Button asChild size="sm">
            <Link href="/core">Open Core</Link>
          </Button>
        </div>
      }
    >
      <FirstRunSystemBanner />

      {/* Main Dashboard Content - Stripe-style layout */}
      <div className="space-y-6">
        {/* Row 1: Executive KPI Rail (5 tiles) */}
        <ExecutiveKPIRail
          data={kpiData}
          loading={kpiLoading}
          hasGovCon={hasGovCon}
        />

        {/* Row 2: Three equal-height chart panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 1: Top Drivers (bar chart) */}
          <TopDriversPanel
            data={driversData}
            loading={driversLoading}
            error={driversError}
            title="Top Drivers"
            subtitle="Highest spend categories"
            onRefresh={refreshDrivers}
          />

          {/* Panel 2: Status Distribution (donut chart) */}
          <StatusDistributionPanel
            data={statusData}
            loading={statusLoading}
            error={statusError}
            title="Entity Distribution"
            subtitle="Invoices, bills, and contacts"
          />

          {/* Panel 3: Geography */}
          <GeographyPanel
            data={geoData}
            loading={geoLoading}
            error={geoError}
            title="Geography"
            subtitle="Distribution by region"
          />
        </div>

        {/* Row 3: Operational KPI Rail (6 tiles) */}
        <OperationalKPIRail
          data={operationalData}
          loading={operationalLoading}
        />
      </div>
    </RouteShell>
  );
}
