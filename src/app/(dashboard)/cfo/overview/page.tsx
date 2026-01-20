"use client";

import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function CfoOverviewPage() {
  return (
    <RouteShell
      title="CFO Overview"
      subtitle="Executive surfaces across financial posture and risk"
      right={
        <Button variant="secondary" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="Financial reports and metrics are for informational purposes. Consult a licensed accountant for official financial statements and compliance requirements."
        context="cfo-overview"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Overview Snapshot */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Financial Overview"
            subtitle="Aggregate financial posture and key metrics"
          >
            <OverviewSnapshot />
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Key Metrics">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Revenue
                </span>
                <span className="text-xl font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Expenses
                </span>
                <span className="text-xl font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Net Position
                </span>
                <span className="text-xl font-semibold">—</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Metrics populate from connected financial sources.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Report Purpose">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The CFO Overview aggregates financial data across all connected
                sources to provide a unified executive view.
              </p>
              <p>
                Use this report for board presentations, investor updates, and
                strategic planning sessions.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href="/cfo/executive-summary"
                className="block text-primary hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href="/cfo/compliance"
                className="block text-primary hover:underline"
              >
                Compliance
              </Link>
              <Link
                href="/financial-reports"
                className="block text-primary hover:underline"
              >
                Financial reports
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
