"use client";

import Link from "next/link";
import { TierGate } from "@/components/legal/TierGate";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ROUTES } from "@/lib/routes";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Info,
} from "lucide-react";

const cashFlowSections = [
  {
    name: "Cash Position",
    icon: TrendingUp,
    description:
      "Current cash balance across all connected accounts",
    status: "Awaiting data",
  },
  {
    name: "Inflows",
    icon: ArrowUpRight,
    description:
      "Revenue and other cash inflows over the selected period",
    status: "Awaiting data",
  },
  {
    name: "Outflows",
    icon: ArrowDownRight,
    description:
      "Expenses, payroll, and other cash outflows over the selected period",
    status: "Awaiting data",
  },
  {
    name: "Projections",
    icon: Activity,
    description:
      "Short-horizon cash flow forecast based on historical patterns",
    status: "Awaiting data",
  },
];

function CashFlowBody() {
  return (
    <RouteShell
      title="Cash Flow"
      subtitle="Cash position and projections"
    >
      {/* Advisory */}
      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Cash flow insights are advisory and explainable. Projections are
          based on historical patterns and do not constitute financial advice.
          No writes or auto-actions are performed.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Cash Flow Sections */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Cash Flow Analysis"
            subtitle="Trend surfaces with confidence and explanation"
          >
            <div className="space-y-4">
              {cashFlowSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.name}
                    className="flex items-start gap-4 rounded-lg border border-border bg-muted p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">
                          {section.name}
                        </h3>
                        <span className="text-xs text-muted-foreground italic">
                          {section.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            <div className="mt-6">
              <EmptyState
                icon={TrendingUp}
                title="No cash flow data available"
                description="Connect your bank accounts to see cash flow analysis. Cash flow data is computed from transaction history across all connected sources."
              />
            </div>
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Cash Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Balance
                </span>
                <span className="text-sm text-muted-foreground italic">
                  Awaiting data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  30-Day Inflows
                </span>
                <span className="text-sm text-muted-foreground italic">
                  Awaiting data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  30-Day Outflows
                </span>
                <span className="text-sm text-muted-foreground italic">
                  Awaiting data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Net Cash Flow
                </span>
                <span className="text-sm text-muted-foreground italic">
                  Awaiting data
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Connect bank accounts to populate cash flow metrics.
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="About Cash Flow">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Cash flow analysis provides visibility into how money moves
                through your organization over time.
              </p>
              <p>
                Projections use historical patterns to estimate short-horizon
                cash positions. All insights are advisory only.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.CFO_EXECUTIVE_SUMMARY}
                className="block text-primary hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href={ROUTES.CFO_OVERVIEW}
                className="block text-primary hover:underline"
              >
                CFO overview
              </Link>
              <Link
                href={ROUTES.CFO_FINANCIAL_REPORTS}
                className="block text-primary hover:underline"
              >
                Financial reports
              </Link>
              <Link
                href={ROUTES.CFO_COMPLIANCE}
                className="block text-primary hover:underline"
              >
                Compliance
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function CashFlowPage() {
  return (
    <TierGate
      tier="cfo"
      title="Cash Flow"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <CashFlowBody />
    </TierGate>
  );
}
