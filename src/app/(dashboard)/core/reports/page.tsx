"use client";

import { useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Database,
  Calendar,
  Repeat,
  Scale,
  FileCheck,
} from "lucide-react";
import { TransactionLedger } from "@/components/reports/TransactionLedger";
import { CategorySpendReport } from "@/components/reports/CategorySpendReport";
import { CounterpartyReport } from "@/components/reports/CounterpartyReport";
import { ExceptionReport } from "@/components/reports/ExceptionReport";
import { CashFlowReport } from "@/components/reports/CashFlowReport";
import { AccountActivityReport } from "@/components/reports/AccountActivityReport";
import { RecurringActivityReport } from "@/components/reports/RecurringActivityReport";
import { BalanceHistoryReport } from "@/components/reports/BalanceHistoryReport";
import { ReconciliationReport } from "@/components/reports/ReconciliationReport";
import { DataIntegrityReport } from "@/components/reports/DataIntegrityReport";

type ReportId =
  | "ledger"
  | "cash-flow"
  | "account-activity"
  | "category-spend"
  | "recurring"
  | "balance-history"
  | "reconciliation"
  | "counterparties"
  | "exceptions"
  | "integrity";

interface ReportDef {
  id: ReportId;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const REPORTS: ReportDef[] = [
  {
    id: "ledger",
    label: "Transaction Ledger",
    description: "Complete, immutable list of all transactions",
    icon: <FileText className="h-4 w-4" />,
    available: true,
  },
  {
    id: "cash-flow",
    label: "Cash Flow Statement",
    description: "Direct method - actual money in vs out",
    icon: <DollarSign className="h-4 w-4" />,
    available: true,
  },
  {
    id: "account-activity",
    label: "Account Activity",
    description: "Per-account transaction summaries",
    icon: <TrendingUp className="h-4 w-4" />,
    available: true,
  },
  {
    id: "category-spend",
    label: "Category Spend",
    description: "Aggregated spending by category",
    icon: <Scale className="h-4 w-4" />,
    available: true,
  },
  {
    id: "recurring",
    label: "Recurring Activity",
    description: "Detected repeating inflows and outflows",
    icon: <Repeat className="h-4 w-4" />,
    available: true,
  },
  {
    id: "balance-history",
    label: "Balance History",
    description: "Historical balance changes over time",
    icon: <Calendar className="h-4 w-4" />,
    available: true,
  },
  {
    id: "reconciliation",
    label: "Statement Reconciliation",
    description: "Compare uploaded statements vs ingested data",
    icon: <FileCheck className="h-4 w-4" />,
    available: true,
  },
  {
    id: "counterparties",
    label: "Counterparties",
    description: "Who money flows to and from",
    icon: <Users className="h-4 w-4" />,
    available: true,
  },
  {
    id: "exceptions",
    label: "Exceptions",
    description: "Transactions that violate normal patterns",
    icon: <AlertTriangle className="h-4 w-4" />,
    available: true,
  },
  {
    id: "integrity",
    label: "Data Integrity",
    description: "Source lineage and trust report",
    icon: <Database className="h-4 w-4" />,
    available: true,
  },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportId>("ledger");

  const renderReport = () => {
    switch (activeReport) {
      case "ledger":
        return <TransactionLedger />;
      case "cash-flow":
        return <CashFlowReport />;
      case "account-activity":
        return <AccountActivityReport />;
      case "category-spend":
        return <CategorySpendReport />;
      case "recurring":
        return <RecurringActivityReport />;
      case "balance-history":
        return <BalanceHistoryReport />;
      case "reconciliation":
        return <ReconciliationReport />;
      case "counterparties":
        return <CounterpartyReport />;
      case "exceptions":
        return <ExceptionReport />;
      case "integrity":
        return <DataIntegrityReport />;
    }
  };

  return (
    <RouteShell
      title="Reports"
      subtitle="Read-only reporting surfaces. No forecasts, no AI recommendations, no tax advice."
    >
      <div className="flex gap-6">
        {/* Report Navigation */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {REPORTS.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => report.available && setActiveReport(report.id)}
                disabled={!report.available}
                className={[
                  "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeReport === report.id
                    ? "bg-[#4f46e5]/10 dark:bg-[#6366f1]/10 border border-[#4f46e5]/20 dark:border-[#6366f1]/20"
                    : report.available
                      ? "hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] border border-transparent"
                      : "opacity-50 cursor-not-allowed border border-transparent",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5",
                    activeReport === report.id
                      ? "text-[#4f46e5] dark:text-[#6366f1]"
                      : "text-[#6b7280] dark:text-[#a1a1aa]",
                  ].join(" ")}
                >
                  {report.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={[
                      "text-sm font-medium truncate",
                      activeReport === report.id
                        ? "text-[#4f46e5] dark:text-[#6366f1]"
                        : "text-[#111827] dark:text-[#f9fafb]",
                    ].join(" ")}
                  >
                    {report.label}
                  </div>
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa] truncate">
                    {report.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="flex-1 min-w-0">{renderReport()}</div>
      </div>
    </RouteShell>
  );
}
