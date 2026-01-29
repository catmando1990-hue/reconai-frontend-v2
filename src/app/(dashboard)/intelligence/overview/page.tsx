"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";
import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import {
  Sparkles,
  Bell,
  Bot,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

const MODULES = [
  {
    title: "Insights",
    href: ROUTES.INTELLIGENCE_INSIGHTS,
    icon: Sparkles,
    description: "AI-powered transaction analysis",
  },
  {
    title: "Alerts",
    href: ROUTES.INTELLIGENCE_ALERTS,
    icon: Bell,
    description: "Signals requiring attention",
  },
  {
    title: "AI Worker",
    href: ROUTES.INTELLIGENCE_AI_WORKER,
    icon: Bot,
    description: "Workflow automation assistant",
  },
];

function IntelligenceOverviewBody() {
  const { data, isLoading, error, isSuccess, lifecycle, refetch } =
    useInsightsSummary();

  const insights = data?.items ?? [];
  const highConfidenceCount = insights.filter(
    (i) => i.confidence >= 0.8,
  ).length;
  const highSeverityCount = insights.filter(
    (i) => i.severity === "high",
  ).length;

  return (
    <RouteShell
      title="Intelligence Overview"
      subtitle="AI-powered signals and workflow assistance"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Total Insights
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">{insights.length}</p>
              <p className="text-xs text-muted-foreground">
                generated this period
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-green-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  High Confidence
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {highConfidenceCount}
              </p>
              <p className="text-xs text-muted-foreground">
                ≥80% confidence score
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-amber-500/10 p-2">
                  <Bell className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  High Severity
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">{highSeverityCount}</p>
              <p className="text-xs text-muted-foreground">
                requiring attention
              </p>
            </div>
          </div>

          {/* Recent Insights */}
          <PrimaryPanel
            title="Recent Insights"
            subtitle="Latest AI-generated signals"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error || !isSuccess ? (
              <div className="flex flex-col items-center py-8">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                  {lifecycle === "pending"
                    ? "Intelligence data is being generated..."
                    : lifecycle === "stale"
                      ? "Intelligence data is stale. Please refresh."
                      : "Failed to load insights"}
                </p>
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No insights yet"
                description="Connect your financial data to generate AI-powered insights."
              />
            ) : (
              <div className="divide-y">
                {insights.slice(0, 5).map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {insight.summary}
                      </p>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          insight.confidence >= 0.8
                            ? "bg-green-500/10 text-green-600"
                            : insight.confidence >= 0.6
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {insights.length > 5 && (
              <div className="mt-4 pt-4 border-t">
                <Link
                  href={ROUTES.INTELLIGENCE_INSIGHTS}
                  className="text-sm text-primary hover:underline"
                >
                  View all {insights.length} insights →
                </Link>
              </div>
            )}
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Modules">
            <nav className="space-y-1">
              {MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-foreground">
                        {module.title}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                );
              })}
            </nav>
          </SecondaryPanel>

          <SecondaryPanel title="How It Works">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Intelligence analyzes your transaction data using Claude AI to
                identify patterns, anomalies, and optimization opportunities.
              </p>
              <p>
                Insights are generated automatically and ranked by confidence
                score. Review and confirm to improve accuracy over time.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links">
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.INTELLIGENCE_INSIGHTS}
                className="block text-primary hover:underline"
              >
                All Insights
              </Link>
              <Link
                href={ROUTES.INTELLIGENCE_ALERTS}
                className="block text-primary hover:underline"
              >
                Active Alerts
              </Link>
              <Link
                href={ROUTES.INTELLIGENCE_AI_WORKER}
                className="block text-primary hover:underline"
              >
                AI Worker
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function IntelligenceOverviewPage() {
  return (
    <TierGate
      tier="intelligence"
      title="Intelligence Overview"
      subtitle="Upgrade or request access to unlock Intelligence features."
    >
      <IntelligenceOverviewBody />
    </TierGate>
  );
}
