"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { TierGate } from "@/components/legal/TierGate";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { STATUS } from "@/lib/dashboardCopy";
import { Bot, Bell, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const intelligenceModules = [
  {
    name: "AI Worker",
    href: ROUTES.INTELLIGENCE_AI_WORKER,
    icon: Bot,
    description:
      "Structured assistance for repeatable finance workflows. You approve every final outcome.",
  },
  {
    name: "Alerts",
    href: ROUTES.INTELLIGENCE_ALERTS,
    icon: Bell,
    description:
      "Signals that may require review or documentation. Always verify before acting.",
  },
  {
    name: "Insights",
    href: ROUTES.INTELLIGENCE_INSIGHTS,
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
        right={
          <Button asChild size="sm">
            <Link href={ROUTES.INTELLIGENCE_INSIGHTS}>View Insights</Link>
          </Button>
        }
      >
        <PolicyBanner
          policy="legal"
          message="AI-generated insights are advisory only. Always verify recommendations with qualified professionals before making financial decisions."
          context="intelligence"
        />
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - Intelligence Modules */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Intelligence Modules"
              subtitle="Select a module to explore AI-powered capabilities"
            >
              <div className="space-y-3">
                {intelligenceModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      className="group flex items-start gap-4 rounded-lg border border-border bg-background p-4 transition hover:border-primary/20 hover:bg-card"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
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
            </PrimaryPanel>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Active Signals">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Insights
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Alerts</span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pending Tasks
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="How Intelligence Works">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  ReconAI analyzes your transaction patterns and operational
                  data to surface actionable signals.
                </p>
                <p>
                  All AI-generated outputs show confidence scores. Signals below
                  0.85 confidence are flagged for additional review.
                </p>
                <p>
                  You maintain full control—every recommendation requires your
                  explicit approval before action.
                </p>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Getting Started" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href={ROUTES.CORE_TRANSACTIONS}
                  className="block text-primary hover:underline"
                >
                  Import transactions
                </Link>
                <Link
                  href={ROUTES.SETTINGS}
                  className="block text-primary hover:underline"
                >
                  Connect data sources
                </Link>
                <Link
                  href={ROUTES.INTELLIGENCE_INSIGHTS}
                  className="block text-primary hover:underline"
                >
                  View insights
                </Link>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
