"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
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
  UserCheck,
  UserCog,
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
    description: "Workforce directory",
  },
  {
    name: "Employees",
    href: ROUTES.PAYROLL_EMPLOYEES,
    icon: UserCheck,
    description: "W-2 employee records",
  },
  {
    name: "Contractors",
    href: ROUTES.PAYROLL_CONTRACTORS,
    icon: UserCog,
    description: "1099 contractor records",
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {payrollModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-muted p-5 text-center transition hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{module.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {module.description}
                </p>
              </div>
            </Link>
          );
        })}
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
