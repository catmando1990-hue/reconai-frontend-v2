"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { TierGate } from "@/components/legal/TierGate";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";
import PolicyBanner from "@/components/policy/PolicyBanner";
import Link from "next/link";
import { Bot, Bell, Sparkles, ChevronRight } from "lucide-react";

const intelligenceModules = [
  {
    name: "AI Worker",
    href: "/intelligence/ai-worker",
    icon: Bot,
    description:
      "Structured assistance for repeatable finance workflows. You approve every final outcome.",
  },
  {
    name: "Alerts",
    href: "/intelligence/alerts",
    icon: Bell,
    description:
      "Signals that may require review or documentation. Always verify before acting.",
  },
  {
    name: "Insights",
    href: "/intelligence/insights",
    icon: Sparkles,
    description:
      "Decision-grade signals surfaced from transaction behavior and operating patterns.",
  },
];

export default function IntelligenceOverviewPage() {
  return (
    <TierGate
      tier="intelligence"
      title="Intelligence"
      subtitle="Signals + AI Worker support"
    >
      <RouteShell
        title="Intelligence"
        subtitle="AI-powered signals and workflow assistance"
      >
        <PolicyBanner
          policy="legal"
          message="AI-generated insights are advisory only. Always verify recommendations with qualified professionals before making financial decisions."
          context="intelligence"
        />
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

        <div className="h-6" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {intelligenceModules.map((module) => {
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
