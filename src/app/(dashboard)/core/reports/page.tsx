"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import {
  FileText,
  Activity,
  DollarSign,
  Tag,
  Repeat,
  TrendingUp,
  FileCheck,
  Users,
  AlertTriangle,
  Shield,
} from "lucide-react";

const REPORTS = [
  {
    id: "ledger",
    title: "Transaction Ledger",
    description: "Complete, immutable list of all transactions",
    icon: FileText,
    href: "/core/reports/ledger",
  },
  {
    id: "account-activity",
    title: "Account Activity",
    description: "Per-account transaction summaries with balances",
    icon: Activity,
    href: "/core/reports/account-activity",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Actual money in vs money out (direct method)",
    icon: DollarSign,
    href: "/core/reports/cash-flow",
  },
  {
    id: "category-spend",
    title: "Category Spend",
    description: "Aggregated spending by category",
    icon: Tag,
    href: "/core/reports/category-spend",
  },
  {
    id: "recurring",
    title: "Recurring Activity",
    description: "Identified repeating inflows and outflows",
    icon: Repeat,
    href: "/core/reports/recurring",
  },
  {
    id: "balance-history",
    title: "Balance History",
    description: "Historical balance changes over time",
    icon: TrendingUp,
    href: "/core/reports/balance-history",
  },
  {
    id: "reconciliation",
    title: "Statement Reconciliation",
    description: "Compare uploaded statements vs ingested data",
    icon: FileCheck,
    href: "/core/reports/reconciliation",
  },
  {
    id: "counterparties",
    title: "Counterparty Report",
    description: "Who money flows to and from",
    icon: Users,
    href: "/core/reports/counterparties",
  },
  {
    id: "exceptions",
    title: "Exception Report",
    description: "Transactions that violate normal patterns",
    icon: AlertTriangle,
    href: "/core/reports/exceptions",
  },
  {
    id: "data-integrity",
    title: "Data Integrity",
    description: "Source lineage and trust report",
    icon: Shield,
    href: "/core/reports/data-integrity",
  },
] as const;

export default function ReportsPage() {
  return (
    <RouteShell
      title="Reports"
      subtitle="Read-only reporting surfaces. No forecasts, no AI recommendations, no tax advice."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.id}
              href={report.href}
              className="group rounded-xl border border-border bg-card/50 p-5 transition-all hover:border-primary/50 hover:bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-border bg-muted p-2.5">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-primary">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
        <h3 className="font-medium text-sm">About CORE Reports</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• All reports are read-only and factual</li>
          <li>• Data sourced from Plaid transactions and linked accounts</li>
          <li>• No forecasts, projections, or compliance interpretations</li>
          <li>• Audit-ready with full data lineage</li>
        </ul>
      </div>
    </RouteShell>
  );
}
