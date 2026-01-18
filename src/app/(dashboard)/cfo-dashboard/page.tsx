"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { TierGate } from "@/components/legal/TierGate";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { PLATFORM_DISCLAIMER } from "@/lib/legal/disclaimers";
import Link from "next/link";
import { BarChart3, PieChart, ShieldCheck, ChevronRight } from "lucide-react";

const cfoModules = [
  {
    name: "Analyze",
    href: "/financial-reports",
    icon: BarChart3,
    description: "Financial reports and analysis tools",
  },
  {
    name: "Cash Flow",
    href: "/cash-flow",
    icon: PieChart,
    description: "Cash flow projections and monitoring",
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    description: "Compliance status and audit readiness",
  },
  {
    name: "Certifications",
    href: "/certifications",
    icon: ShieldCheck,
    description: "Certification tracking and management",
  },
  {
    name: "DCAA",
    href: "/dcaa",
    icon: ShieldCheck,
    description: "DCAA compliance and documentation",
  },
];

export default function CfoOverviewPage() {
  return (
    <TierGate
      tier="cfo"
      title="CFO Mode"
      subtitle="Executive clarity + defensibility"
    >
      <RouteShell
        title="CFO Mode"
        subtitle="Executive clarity and defensibility tools"
      >
        <DisclaimerNotice>{PLATFORM_DISCLAIMER}</DisclaimerNotice>

        <div className="h-6" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cfoModules.map((module) => {
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
    </TierGate>
  );
}
