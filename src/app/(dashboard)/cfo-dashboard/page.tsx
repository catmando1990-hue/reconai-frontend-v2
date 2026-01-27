"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { TierGate } from "@/components/legal/TierGate";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { PLATFORM_DISCLAIMER } from "@/lib/legal/disclaimers";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { STATUS, CTA } from "@/lib/dashboardCopy";
import { auditedFetch } from "@/lib/auditedFetch";
import { ConnectBusinessBankButton } from "@/components/plaid/ConnectBusinessBankButton";
import {
  BarChart3,
  PieChart,
  ShieldCheck,
  ChevronRight,
  FileText,
  Download,
  Loader2,
  Building2,
} from "lucide-react";

const cfoModules = [
  {
    name: "Executive Summary",
    href: ROUTES.CFO_EXECUTIVE_SUMMARY,
    icon: FileText,
    description:
      "CFO-grade snapshot for decision-making: risks, actions, and runway posture",
  },
  {
    name: "Financial Reports",
    href: ROUTES.CFO_FINANCIAL_REPORTS,
    icon: BarChart3,
    description: "Financial reports and analysis tools",
  },
  {
    name: "Cash Flow",
    href: ROUTES.CFO_CASH_FLOW,
    icon: PieChart,
    description: "Cash flow projections and monitoring",
  },
  {
    name: "Compliance",
    href: ROUTES.CFO_COMPLIANCE,
    icon: ShieldCheck,
    description: "Audit logs, exports and evidence retention",
  },
  {
    name: "Overview",
    href: ROUTES.CFO_OVERVIEW,
    icon: BarChart3,
    description: "Executive surfaces across financial posture and risk",
  },
];

type BusinessItem = {
  item_id: string;
  institution_name: string;
  status: string;
};

export default function CfoOverviewPage() {
  const [exporting, setExporting] = useState(false);
  const [businessItems, setBusinessItems] = useState<BusinessItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const fetchBusinessItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await auditedFetch<{ items: BusinessItem[] }>(
        "/api/plaid/items?context=business",
      );
      setBusinessItems(data?.items || []);
    } catch {
      setBusinessItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessItems();
  }, [fetchBusinessItems]);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await auditedFetch<Response>("/api/cfo/export", {
        method: "POST",
        rawResponse: true,
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cfo_report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <TierGate
      tier="cfo"
      title="CFO Mode"
      subtitle="Executive clarity + defensibility"
    >
      <RouteShell
        title="CFO Mode"
        subtitle="Executive clarity and defensibility tools"
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Report
            </Button>
            <Button asChild size="sm">
              <Link href={ROUTES.CFO_EXECUTIVE_SUMMARY}>Executive Summary</Link>
            </Button>
          </div>
        }
      >
        <DisclaimerNotice>{PLATFORM_DISCLAIMER}</DisclaimerNotice>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - CFO Modules */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="CFO Tools"
              subtitle="Executive-grade financial intelligence and compliance"
            >
              {/* BACKGROUND NORMALIZATION: No decorative colors */}
              <div className="space-y-4">
                {cfoModules.map((module) => {
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
                          <h3 className="text-base font-medium">
                            {module.name}
                          </h3>
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

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Financial Snapshot">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Cash Position
                  </span>
                  <span className="text-xl font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Runway</span>
                  <span className="text-xl font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Burn Rate
                  </span>
                  <span className="text-xl font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  {CTA.CONNECT_BANK} to populate financial metrics.
                </p>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Risk Indicators">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Risks
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pending Actions
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NOT_EVALUATED}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Business Banking">
              <div className="space-y-3">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : businessItems.length > 0 ? (
                  <div className="space-y-2">
                    {businessItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.institution_name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    <ConnectBusinessBankButton />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect a business bank account to populate CFO financial
                      data.
                    </p>
                    <ConnectBusinessBankButton />
                  </div>
                )}
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="About CFO Mode">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  CFO Mode provides executive-grade financial intelligence with
                  emphasis on defensibility and audit readiness.
                </p>
                <p>
                  Reports generated here are designed for board presentations,
                  investor updates, and regulatory filings.
                </p>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
