"use client";

import { useMemo } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  Receipt,
  Loader2,
  AlertCircle,
  User,
  Building,
  MapPin,
  Globe,
} from "lucide-react";
import { useTaxWithholdings, usePayrollPeople } from "@/hooks/usePayroll";
import type { TaxWithholding, PayrollPerson } from "@/lib/api/payroll-types";

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaxTypeIcon(taxType: string) {
  const lower = taxType.toLowerCase();
  if (lower.includes("federal")) {
    return <Globe className="h-4 w-4" />;
  }
  if (lower.includes("state")) {
    return <Building className="h-4 w-4" />;
  }
  if (lower.includes("local") || lower.includes("city")) {
    return <MapPin className="h-4 w-4" />;
  }
  return <Receipt className="h-4 w-4" />;
}

function getTaxTypeColor(taxType: string): string {
  const lower = taxType.toLowerCase();
  if (lower.includes("federal")) {
    return "bg-blue-500/10 text-blue-600";
  }
  if (lower.includes("state")) {
    return "bg-purple-500/10 text-purple-600";
  }
  if (lower.includes("local") || lower.includes("city")) {
    return "bg-amber-500/10 text-amber-600";
  }
  return "bg-gray-500/10 text-gray-600";
}

function PayrollTaxesBody() {
  const { data: taxData, isLoading, isError } = useTaxWithholdings();
  const { data: peopleData } = usePayrollPeople(100);

  const withholdings = useMemo<TaxWithholding[]>(
    () => taxData?.items ?? [],
    [taxData?.items],
  );
  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    const items: PayrollPerson[] = peopleData?.items ?? [];
    items.forEach((p) => {
      map.set(p.id, `${p.first_name} ${p.last_name}`);
    });
    return map;
  }, [peopleData?.items]);

  const stats = useMemo(() => {
    const federal = withholdings.filter((w) =>
      w.tax_type.toLowerCase().includes("federal"),
    );
    const state = withholdings.filter((w) =>
      w.tax_type.toLowerCase().includes("state"),
    );
    const local = withholdings.filter(
      (w) =>
        w.tax_type.toLowerCase().includes("local") ||
        w.tax_type.toLowerCase().includes("city"),
    );

    const avgFederalRate =
      federal.length > 0
        ? federal.reduce((sum, w) => sum + w.rate, 0) / federal.length
        : 0;
    const avgStateRate =
      state.length > 0
        ? state.reduce((sum, w) => sum + w.rate, 0) / state.length
        : 0;

    return {
      totalRecords: withholdings.length,
      federalCount: federal.length,
      stateCount: state.length,
      localCount: local.length,
      avgFederalRate,
      avgStateRate,
    };
  }, [withholdings]);

  if (isLoading) {
    return (
      <RouteShell
        title="Taxes & Withholdings"
        subtitle="Tax obligations and withholding records"
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
        title="Taxes & Withholdings"
        subtitle="Tax obligations and withholding records"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">Failed to load tax data</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </RouteShell>
    );
  }

  return (
    <RouteShell
      title="Taxes & Withholdings"
      subtitle="Tax obligations and withholding records"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Tax Records"
            subtitle={`${withholdings.length} withholding records`}
          >
            {withholdings.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No tax records"
                description="Tax withholding records and filing status will appear here once payroll processing is active."
              />
            ) : (
              <div className="divide-y">
                {withholdings.map((withholding) => (
                  <div
                    key={withholding.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${getTaxTypeColor(withholding.tax_type)}`}
                      >
                        {getTaxTypeIcon(withholding.tax_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {withholding.tax_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <User className="inline h-3 w-3 mr-1" />
                          {peopleMap.get(withholding.person_id) || "Unknown"}
                        </p>
                        <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
                          {withholding.filing_status && (
                            <span>Filing: {withholding.filing_status}</span>
                          )}
                          {withholding.allowances != null && (
                            <span>Allowances: {withholding.allowances}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Effective {formatDate(withholding.effective_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatPercent(withholding.rate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        withholding rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Tax Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Federal Records
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.federalCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  State Records
                </span>
                <span className="text-sm font-medium text-purple-600">
                  {stats.stateCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Local Records
                </span>
                <span className="text-sm font-medium text-amber-600">
                  {stats.localCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Records
                </span>
                <span className="text-sm font-medium">
                  {taxData?.total ?? 0}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Average Rates">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Federal Rate
                </span>
                <span className="text-sm font-medium">
                  {stats.avgFederalRate > 0
                    ? formatPercent(stats.avgFederalRate)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg State Rate
                </span>
                <span className="text-sm font-medium">
                  {stats.avgStateRate > 0
                    ? formatPercent(stats.avgStateRate)
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
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Add Tax Withholding
              </button>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollTaxesPage() {
  return (
    <TierGate
      tier="payroll"
      title="Taxes & Withholdings"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollTaxesBody />
    </TierGate>
  );
}
