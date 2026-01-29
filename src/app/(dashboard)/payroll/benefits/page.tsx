"use client";

import { useMemo } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  Heart,
  Loader2,
  AlertCircle,
  User,
  Stethoscope,
  Eye,
  PiggyBank,
  Shield,
  Smile,
} from "lucide-react";
import { useBenefitEnrollments, usePayrollPeople } from "@/hooks/usePayroll";
import type {
  BenefitEnrollment,
  BenefitType,
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

function getBenefitIcon(type: BenefitType) {
  switch (type) {
    case "health":
      return <Stethoscope className="h-4 w-4" />;
    case "dental":
      return <Smile className="h-4 w-4" />;
    case "vision":
      return <Eye className="h-4 w-4" />;
    case "401k":
    case "hsa":
    case "fsa":
      return <PiggyBank className="h-4 w-4" />;
    case "life":
    case "disability":
      return <Shield className="h-4 w-4" />;
    default:
      return <Heart className="h-4 w-4" />;
  }
}

function getBenefitLabel(type: BenefitType): string {
  const labels: Record<BenefitType, string> = {
    health: "Health Insurance",
    dental: "Dental Insurance",
    vision: "Vision Insurance",
    "401k": "401(k)",
    hsa: "HSA",
    fsa: "FSA",
    life: "Life Insurance",
    disability: "Disability Insurance",
    other: "Other",
  };
  return labels[type] || type;
}

function PayrollBenefitsBody() {
  const { data: benefitsData, isLoading, isError } = useBenefitEnrollments();
  const { data: peopleData } = usePayrollPeople(100);

  const enrollments: BenefitEnrollment[] = benefitsData?.items ?? [];
  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    const items: PayrollPerson[] = peopleData?.items ?? [];
    items.forEach((p) => {
      map.set(p.id, `${p.first_name} ${p.last_name}`);
    });
    return map;
  }, [peopleData?.items]);

  const stats = useMemo(() => {
    const uniquePeople = new Set(enrollments.map((e) => e.person_id));
    const totalEmployeeContrib = enrollments.reduce(
      (sum, e) => sum + e.employee_contribution,
      0,
    );
    const totalEmployerContrib = enrollments.reduce(
      (sum, e) => sum + e.employer_contribution,
      0,
    );
    const benefitTypes = new Set(enrollments.map((e) => e.benefit_type));

    return {
      enrolledCount: uniquePeople.size,
      planCount: benefitTypes.size,
      totalEmployeeContrib,
      totalEmployerContrib,
      totalCost: totalEmployeeContrib + totalEmployerContrib,
    };
  }, [enrollments]);

  if (isLoading) {
    return (
      <RouteShell
        title="Benefits & Deductions"
        subtitle="Employee benefits and payroll deductions"
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
        title="Benefits & Deductions"
        subtitle="Employee benefits and payroll deductions"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">Failed to load benefits</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </RouteShell>
    );
  }

  return (
    <RouteShell
      title="Benefits & Deductions"
      subtitle="Employee benefits and payroll deductions"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Benefits Administration"
            subtitle={`${enrollments.length} active enrollments`}
          >
            {enrollments.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No benefits configured"
                description="Benefit plans and deduction schedules will appear here once benefits administration is set up."
              />
            ) : (
              <div className="divide-y">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {getBenefitIcon(enrollment.benefit_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getBenefitLabel(enrollment.benefit_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {enrollment.plan_name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <User className="inline h-3 w-3 mr-1" />
                          {peopleMap.get(enrollment.person_id) || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Effective {formatDate(enrollment.effective_date)}
                          {enrollment.end_date &&
                            ` – ${formatDate(enrollment.end_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Employee:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(enrollment.employee_contribution)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Employer:{" "}
                        <span className="font-medium text-green-600">
                          {formatCurrency(enrollment.employer_contribution)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Benefits Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Plans
                </span>
                <span className="text-sm font-medium">{stats.planCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Enrolled Employees
                </span>
                <span className="text-sm font-medium">
                  {stats.enrolledCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Enrollments
                </span>
                <span className="text-sm font-medium">
                  {benefitsData?.total ?? 0}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Monthly Costs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Employee Contrib
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(stats.totalEmployeeContrib)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Employer Contrib
                </span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(stats.totalEmployerContrib)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(stats.totalCost)}
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
                <Heart className="h-4 w-4 text-muted-foreground" />
                Add Enrollment
              </button>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollBenefitsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Benefits & Deductions"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollBenefitsBody />
    </TierGate>
  );
}
