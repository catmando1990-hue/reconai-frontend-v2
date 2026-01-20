"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  Clock,
  Layers,
  ArrowLeftRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Lock,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";

// Quick stats for the dashboard
const QUICK_STATS = {
  activeContracts: 2,
  totalContractValue: 3250000,
  fundedValue: 2400000,
  pendingTimesheets: 1,
  openVariances: 4,
  auditEntries: 156,
};

const MODULES = [
  {
    title: "Contracts",
    description:
      "DCAA-compliant contract management with CLIN tracking and funding status",
    href: "/govcon/contracts",
    icon: FileText,
    stats: `${QUICK_STATS.activeContracts} active contracts`,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Timekeeping",
    description:
      "Daily labor tracking with 15-min increments and approval workflow",
    href: "/govcon/timekeeping",
    icon: Clock,
    stats: `${QUICK_STATS.pendingTimesheets} pending approval`,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Indirect Costs",
    description:
      "Overhead, G&A, and fringe pool management with FAR 31.201 allowability",
    href: "/govcon/indirects",
    icon: Layers,
    stats: "3 active pools",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Reconciliation",
    description: "Labor and indirect cost reconciliation with ICS preparation",
    href: "/govcon/reconciliation",
    icon: ArrowLeftRight,
    stats: `${QUICK_STATS.openVariances} open variances`,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Audit Trail",
    description:
      "Immutable audit log with hash chain integrity and evidence retention",
    href: "/govcon/audit",
    icon: Shield,
    stats: `${QUICK_STATS.auditEntries} entries`,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GovConDashboardPage() {
  const fundingPercent =
    (QUICK_STATS.fundedValue / QUICK_STATS.totalContractValue) * 100;

  return (
    <RouteShell
      title="GovCon Dashboard"
      subtitle="Advisory-only. No actions are taken automatically."
    >
      <main className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            GovCon Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            DCAA-compliant government contracting workspace with contracts,
            timekeeping, indirects, and audit management
          </p>
        </div>

        {/* Canonical Laws Advisory */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <Lock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">
              ReconAI Canonical Laws Active
            </p>
            <p className="text-sm text-muted-foreground">
              All GovCon operations enforce: Advisory-only behavior • Manual-run
              only • Read-only execution • Confidence ≥ 0.85 for AI insights •
              Evidence required for modifications • Fail-closed defaults
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Active Contracts</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {QUICK_STATS.activeContracts}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Contract Value</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(QUICK_STATS.totalContractValue)}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Funded</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(QUICK_STATS.fundedValue)}
            </p>
            <div className="mt-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${fundingPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {fundingPercent.toFixed(1)}% funded
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-foreground" />
              <span className="text-sm">Action Required</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {QUICK_STATS.pendingTimesheets + QUICK_STATS.openVariances}
            </p>
            <p className="text-xs text-muted-foreground">
              {QUICK_STATS.pendingTimesheets} timesheets,{" "}
              {QUICK_STATS.openVariances} variances
            </p>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl ${module.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                    <p className={`text-sm font-medium mt-2 ${module.color}`}>
                      {module.stats}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* DCAA Compliance Status */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              DCAA Compliance Status
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Timekeeping</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily time entry with supervisory approval
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Job Cost Accounting
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Direct/indirect cost segregation
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Audit Trail</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Immutable records with evidence
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-medium">ICS Schedules</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  5 of 8 schedules complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">Recent Activity</h2>
          </div>
          <div className="divide-y">
            {[
              {
                icon: Clock,
                color: "text-primary",
                title: "Timesheet Submitted",
                description: "Period 2024-01-15 to 2024-01-21",
                time: "2 hours ago",
              },
              {
                icon: FileText,
                color: "text-primary",
                title: "Contract Modification Approved",
                description: "FA8750-24-C-0001 - Funding increase",
                time: "5 hours ago",
              },
              {
                icon: Layers,
                color: "text-primary",
                title: "Overhead Rate Calculated",
                description: "FY2024 Q4: 32.8% provisional",
                time: "1 day ago",
              },
              {
                icon: ArrowLeftRight,
                color: "text-primary",
                title: "Reconciliation Completed",
                description:
                  "Labor reconciliation - 10 of 12 variances resolved",
                time: "2 days ago",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-4 flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg bg-card flex items-center justify-center border`}
                  >
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-medium mb-2">FAR References</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• FAR 31.201 - Cost Principles</li>
              <li>• FAR 52.216-7 - Allowable Cost & Payment</li>
              <li>• DFARS 252.242-7006 - Accounting System</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-medium mb-2">SF-1408 Checklist</h3>
            <p className="text-sm text-muted-foreground">
              Preaward survey accounting system adequacy checklist for
              government contracting.
            </p>
            <Link
              href="/govcon/sf-1408"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View Checklist →
            </Link>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-medium mb-2">Export Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate DCAA-ready exports including ICS schedules, audit trail,
              and rate summaries.
            </p>
            <Link
              href="/govcon/audit"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Export Center →
            </Link>
          </div>
        </div>
      </main>{" "}
    </RouteShell>
  );
}
