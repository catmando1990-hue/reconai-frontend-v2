"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { useGovConSnapshot } from "@/hooks/useGovConSnapshot";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import {
  FileText,
  Clock,
  Layers,
  Shield,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  {
    title: "Contracts",
    href: ROUTES.GOVCON_CONTRACTS,
    icon: FileText,
    description: "Active government contracts",
  },
  {
    title: "Timekeeping",
    href: ROUTES.GOVCON_TIMEKEEPING,
    icon: Clock,
    description: "Labor hour documentation",
  },
  {
    title: "Indirect Costs",
    href: ROUTES.GOVCON_INDIRECTS,
    icon: Layers,
    description: "Cost pool mapping",
  },
  {
    title: "Audit Trail",
    href: ROUTES.GOVCON_AUDIT,
    icon: Shield,
    description: "Event documentation",
  },
];

export default function GovConOverviewPage() {
  const { data, isLoading, lifecycle, hasEvidence, refetch } =
    useGovConSnapshot();

  const evidenceCount = data?.snapshot?.evidence_attached?.length ?? 0;

  return (
    <RouteShell
      title="GovCon Overview"
      subtitle="Government contracting documentation status at a glance"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      <PolicyBanner
        policy="legal"
        message="GovCon workspace provides advisory documentation assistance only. Does not certify DCAA compliance."
        context="govcon-overview"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Documentation Status */}
        <SecondaryPanel title="Documentation Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusChip
                variant={
                  lifecycle === "success" && hasEvidence ? "muted" : "unknown"
                }
              >
                {lifecycle === "success" && hasEvidence
                  ? "Documented"
                  : lifecycle === "pending"
                    ? "Checking..."
                    : "Not evaluated"}
              </StatusChip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Evidence Files
              </span>
              <span className="text-lg font-semibold">{evidenceCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Update</span>
              <span className="text-sm">
                {data?.snapshot?.as_of
                  ? new Date(data.snapshot.as_of).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </SecondaryPanel>

        {/* SF-1408 Summary */}
        <SecondaryPanel title="SF-1408 Controls">
          <div className="space-y-3">
            {["Timekeeping", "Job Cost", "Audit Trail", "ICS Schedules"].map(
              (area) => (
                <div key={area} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{area}</span>
                  <StatusChip
                    variant={
                      hasEvidence && lifecycle === "success"
                        ? "muted"
                        : "unknown"
                    }
                  >
                    {hasEvidence && lifecycle === "success"
                      ? "Documented"
                      : "Pending"}
                  </StatusChip>
                </div>
              ),
            )}
            <div className="pt-2 border-t">
              <Link
                href={ROUTES.GOVCON_SF1408}
                className="text-xs text-primary hover:underline"
              >
                View full SF-1408 checklist →
              </Link>
            </div>
          </div>
        </SecondaryPanel>

        {/* Quick Links */}
        <SecondaryPanel title="Quick Access">
          <nav className="space-y-1">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-muted"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 font-medium">{link.title}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </Link>
              );
            })}
          </nav>
        </SecondaryPanel>
      </div>
    </RouteShell>
  );
}
