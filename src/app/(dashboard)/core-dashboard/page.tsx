"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import PolicyBanner from "@/components/policy/PolicyBanner";
import Link from "next/link";
import {
  Building2,
  ArrowLeftRight,
  Home,
  DoorOpen,
  UserCheck,
  FileSignature,
  Wallet,
  Wrench,
  ChevronRight,
} from "lucide-react";

const coreModules = [
  {
    name: "Accounts",
    href: "/accounts",
    icon: Building2,
    description: "Manage bank accounts and financial institutions",
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    description: "View and categorize all transactions",
  },
  {
    name: "Properties",
    href: "/properties",
    icon: Home,
    description: "Manage real estate properties",
  },
  {
    name: "Units",
    href: "/units",
    icon: DoorOpen,
    description: "Track individual rental units",
  },
  {
    name: "Tenants",
    href: "/tenants",
    icon: UserCheck,
    description: "Manage tenant information",
  },
  {
    name: "Leases",
    href: "/leases",
    icon: FileSignature,
    description: "Track lease agreements",
  },
  {
    name: "Rent Collection",
    href: "/rent-collection",
    icon: Wallet,
    description: "Monitor rent payments",
  },
  {
    name: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    description: "Track maintenance requests",
  },
];

export default function CoreOverviewPage() {
  return (
    <RouteShell
      title="Core"
      subtitle="Structured financial reality. Your operational foundation."
    >
      <PolicyBanner
        policy="bookkeeping"
        message="Transaction categorization is automated but may require review. Verify classifications before using for tax or compliance purposes."
        context="core"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coreModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card/50 p-4 transition hover:border-primary/20 hover:bg-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{module.name}</h3>
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
    </RouteShell>
  );
}
