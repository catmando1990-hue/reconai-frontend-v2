"use client";

import Link from "next/link";
import { TierGate } from "@/components/legal/TierGate";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ROUTES } from "@/lib/routes";
import {
  BarChart3,
  FileText,
  PieChart,
  TrendingUp,
  Info,
} from "lucide-react";

const reportCategories = [
  {
    name: "Profit & Loss",
    icon: TrendingUp,
    description:
      "Revenue, expenses, and net income over a selected period",
    status: "Awaiting data",
  },
  {
    name: "Balance Sheet",
    icon: BarChart3,
    description:
      "Assets, liabilities, and equity at a point in time",
    status: "Awaiting data",
  },
  {
    name: "Cash Flow Statement",
    icon: PieChart,
    description:
      "Operating, investing, and financing cash flows",
    status: "Awaiting data",
  },
  {
    name: "Trial Balance",
    icon: FileText,
    description:
      "Debit and credit totals for all ledger accounts",
    status: "Awaiting data",
  },
];

function FinancialReportsBody() {
  return (
    <RouteShell
      title="Financial Reports"
      subtitle="Detailed financial statements and analysis"
    >
      {/* Advisory */}
      <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Financial reports are generated from connected data sources and are
          for informational purposes only. Consult a licensed accountant for
          official financial statements.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Report Categories */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Available Reports"
            subtitle="Standard financial statements and analyses"
          >
            <div className="space-y-4">
              {reportCategories.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.name}
                    className="flex items-start gap-4 rounded-lg border border-border bg-muted p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">
                          {report.name}
                        </h3>
                        <span className="text-xs text-muted-foreground italic">
                          {report.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state for when no reports have been generated */}
            <div className="mt-6">
              <EmptyState
                icon={BarChart3}
                title="No reports generated yet"
                description="Connect your financial data sources to generate reports. Reports are computed from connected bank accounts and transaction data."
              />
            </div>
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Report Status">
            <div className="space-y-4">
              {reportCategories.map((report) => (
                <div
                  key={report.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {report.name}
                  </span>
                  <span className="text-sm text-muted-foreground italic">
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="About Financial Reports">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Financial reports provide structured views of your
                organization&apos;s financial position and performance.
              </p>
              <p>
                All reports are generated from connected data sources and
                updated when new data is available.
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
                href={ROUTES.CFO_CASH_FLOW}
                className="block text-primary hover:underline"
              >
                Cash flow
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

export default function FinancialReportsPage() {
  return (
    <TierGate
      tier="cfo"
      title="Financial Reports"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <FinancialReportsBody />
    </TierGate>
  );
}
