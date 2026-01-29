"use client";

import { useMemo } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  DollarSign,
  Loader2,
  AlertCircle,
  User,
  TrendingUp,
  Clock,
  Percent,
  Award,
} from "lucide-react";
import { useCompensation, usePayrollPeople } from "@/hooks/usePayroll";
import type {
  Compensation,
  CompensationType,
  PayrollPerson,
} from "@/lib/api/payroll-types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCompTypeBadge(compType: CompensationType) {
  switch (compType) {
    case "salary":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
          <TrendingUp className="h-3 w-3" />
          Salary
        </span>
      );
    case "hourly":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600">
          <Clock className="h-3 w-3" />
          Hourly
        </span>
      );
    case "commission":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
          <Percent className="h-3 w-3" />
          Commission
        </span>
      );
    case "bonus":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
          <Award className="h-3 w-3" />
          Bonus
        </span>
      );
    default:
      return null;
  }
}

function PayrollCompensationBody() {
  const { data: compData, isLoading, isError } = useCompensation();
  const { data: peopleData } = usePayrollPeople(100);

  const compensations: Compensation[] = compData?.items ?? [];
  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    const items: PayrollPerson[] = peopleData?.items ?? [];
    items.forEach((p) => {
      map.set(p.id, `${p.first_name} ${p.last_name}`);
    });
    return map;
  }, [peopleData?.items]);

  const stats = useMemo(() => {
    const salaries = compensations.filter((c) => c.comp_type === "salary");
    const hourly = compensations.filter((c) => c.comp_type === "hourly");
    const totalAnnual = salaries.reduce((sum, c) => sum + c.rate, 0);
    const avgSalary = salaries.length > 0 ? totalAnnual / salaries.length : 0;
    const avgHourly =
      hourly.length > 0
        ? hourly.reduce((sum, c) => sum + c.rate, 0) / hourly.length
        : 0;

    return {
      totalRecords: compensations.length,
      salaryCount: salaries.length,
      hourlyCount: hourly.length,
      totalAnnual,
      avgSalary,
      avgHourly,
    };
  }, [compensations]);

  if (isLoading) {
    return (
      <RouteShell
        title="Compensation"
        subtitle="Salary, wages, and compensation structures"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RouteShell>
    );
  }

  if (isError) {
    return (
      <RouteShell
        title="Compensation"
        subtitle="Salary, wages, and compensation structures"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">
            Failed to load compensation data
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </RouteShell>
    );
  }

  return (
    <RouteShell
      title="Compensation"
      subtitle="Salary, wages, and compensation structures"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Compensation Structures"
            subtitle={`${compensations.length} active records`}
          >
            {compensations.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No compensation data"
                description="Compensation structures, salary bands, and wage records will appear here once configured."
              />
            ) : (
              <div className="divide-y">
                {compensations.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {peopleMap.get(comp.person_id) || "Unknown"}
                          </span>
                          {getCompTypeBadge(comp.comp_type)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Effective {formatDate(comp.effective_date)}
                          {comp.end_date && ` – ${formatDate(comp.end_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(comp.rate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {comp.comp_type === "hourly"
                          ? "/hour"
                          : comp.comp_type === "salary"
                            ? "/year"
                            : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Compensation Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Records
                </span>
                <span className="text-sm font-medium">
                  {stats.totalRecords}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Salaried</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.salaryCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hourly</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.hourlyCount}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Averages">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Salary
                </span>
                <span className="text-sm font-medium">
                  {stats.avgSalary > 0 ? formatCurrency(stats.avgSalary) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Hourly Rate
                </span>
                <span className="text-sm font-medium">
                  {stats.avgHourly > 0
                    ? `${formatCurrency(stats.avgHourly)}/hr`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Annual
                </span>
                <span className="text-sm font-medium text-green-600">
                  {stats.totalAnnual > 0
                    ? formatCurrency(stats.totalAnnual)
                    : "—"}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Actions">
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Add Compensation
              </button>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollCompensationPage() {
  return (
    <TierGate
      tier="payroll"
      title="Compensation"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollCompensationBody />
    </TierGate>
  );
}
