"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { TierGate } from "@/components/legal/TierGate";
import { ROUTES } from "@/lib/routes";
import {
  Building2,
  ArrowLeftRight,
  FileText,
  Upload,
  Link2,
  Settings,
  ChevronRight,
  BarChart3,
} from "lucide-react";

const coreModules = [
  {
    name: "Transactions",
    href: ROUTES.CORE_TRANSACTIONS,
    icon: ArrowLeftRight,
    description: "View and categorize",
    primary: true,
  },
  {
    name: "Accounts",
    href: ROUTES.ACCOUNTS,
    icon: Building2,
    description: "Connected bank accounts",
  },
  {
    name: "Reports",
    href: ROUTES.CORE_REPORTS,
    icon: BarChart3,
    description: "Financial reports",
  },
  {
    name: "Upload",
    href: ROUTES.UPLOAD,
    icon: Upload,
    description: "Import statements",
  },
  {
    name: "Connect Bank",
    href: ROUTES.CONNECT_BANK,
    icon: Link2,
    description: "Link new accounts",
  },
  {
    name: "Settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
    description: "Preferences",
  },
];

export default function CoreOverviewPage() {
  return (
    <TierGate tier="core" title="Core" subtitle="Structured financial reality">
      <RouteShell
        title="Core"
        subtitle="Structured financial reality. Your operational foundation."
      >
        <PolicyBanner
          policy="bookkeeping"
          message="Transaction categorization is automated but may require review. Verify classifications before using for tax or compliance purposes."
          context="core"
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - Work Queue */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Work Queue"
              subtitle="Items requiring attention"
              actions={
                <Link
                  href={ROUTES.CORE_TRANSACTIONS}
                  className="text-sm text-primary hover:underline"
                >
                  View all transactions
                </Link>
              }
            >
              <EmptyState
                icon={FileText}
                title="No pending items"
                description="All transactions are categorized and reconciled. Check back after new activity."
                action={{
                  label: "View transactions",
                  href: ROUTES.CORE_TRANSACTIONS,
                }}
              />
            </PrimaryPanel>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Quick Access">
              <nav className="space-y-1">
                {coreModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      className={[
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                        module.primary
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{module.name}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </nav>
            </SecondaryPanel>

            <SecondaryPanel title="System Status" collapsible>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Data Sync
                  </span>
                  <StatusChip variant="ok">Connected</StatusChip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Categorization
                  </span>
                  <StatusChip variant="ok">Active</StatusChip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reconciliation
                  </span>
                  <StatusChip variant="muted">Pending review</StatusChip>
                </div>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
