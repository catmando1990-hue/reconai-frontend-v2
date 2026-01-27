"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { TierGate } from "@/components/legal/TierGate";
import { ROUTES } from "@/lib/routes";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  Play,
  Receipt,
  Heart,
  BookOpen,
  ShieldCheck,
  ScrollText,
  Camera,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

const payrollModules = [
  {
    name: "Overview",
    href: ROUTES.PAYROLL_OVERVIEW,
    icon: LayoutDashboard,
    description: "Payroll status and key metrics",
  },
  {
    name: "People",
    href: ROUTES.PAYROLL_PEOPLE,
    icon: Users,
    description: "Employee and contractor directory",
  },
  {
    name: "Compensation",
    href: ROUTES.PAYROLL_COMPENSATION,
    icon: DollarSign,
    description: "Salary, wages, and compensation structures",
  },
  {
    name: "Time & Labor",
    href: ROUTES.PAYROLL_TIME_LABOR,
    icon: Clock,
    description: "Hours tracked and labor allocation",
  },
  {
    name: "Pay Runs",
    href: ROUTES.PAYROLL_PAY_RUNS,
    icon: Play,
    description: "Payroll processing cycles",
  },
  {
    name: "Taxes & Withholdings",
    href: ROUTES.PAYROLL_TAXES,
    icon: Receipt,
    description: "Tax obligations and withholding records",
  },
  {
    name: "Benefits & Deductions",
    href: ROUTES.PAYROLL_BENEFITS,
    icon: Heart,
    description: "Employee benefits and payroll deductions",
  },
  {
    name: "Payroll Accounting",
    href: ROUTES.PAYROLL_ACCOUNTING,
    icon: BookOpen,
    description: "Journal entries and GL integration",
  },
  {
    name: "Compliance & Controls",
    href: ROUTES.PAYROLL_COMPLIANCE,
    icon: ShieldCheck,
    description: "Regulatory compliance and internal controls",
  },
  {
    name: "Audit Trail",
    href: ROUTES.PAYROLL_AUDIT_TRAIL,
    icon: ScrollText,
    description: "Payroll change log and audit history",
  },
  {
    name: "Snapshots",
    href: ROUTES.PAYROLL_SNAPSHOTS,
    icon: Camera,
    description: "Point-in-time payroll state captures",
  },
  {
    name: "Reports",
    href: ROUTES.PAYROLL_REPORTS,
    icon: BarChart3,
    description: "Payroll reports and exports",
  },
  {
    name: "Settings",
    href: ROUTES.PAYROLL_SETTINGS,
    icon: Settings,
    description: "Payroll configuration and preferences",
  },
];

function PayrollDashboardBody() {
  return (
    <RouteShell
      title="Payroll"
      subtitle="Payroll operations and workforce management"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Payroll Modules"
            subtitle="Operational payroll surfaces"
          >
            <div className="space-y-4">
              {payrollModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-start gap-4 rounded-lg border border-border bg-muted p-5 transition hover:bg-card"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">{module.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </PrimaryPanel>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Payroll Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Employees
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Contractors
                </span>
                <span className="text-sm text-muted-foreground italic">
                  No data
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Next Pay Run
                </span>
                <span className="text-sm text-muted-foreground italic">
                  Not scheduled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Pay Run
                </span>
                <span className="text-sm text-muted-foreground italic">
                  None completed
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="About Payroll">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Payroll module provides operational surfaces for workforce
                management, compensation tracking, tax compliance, and payroll
                processing.
              </p>
              <p>
                All payroll data is read-only until operational workflows are
                configured by an administrator.
              </p>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollDashboardPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollDashboardBody />
    </TierGate>
  );
}
