"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";

export default function CompletePage() {
  const { state } = useOnboarding();

  // Gate protected routes through sign-in
  const getAuthGatedPath = (targetPath: string) => {
    return `/sign-in?redirect_url=${encodeURIComponent(targetPath)}`;
  };

  const dashboardPath =
    state.dataSource === "bank-connect"
      ? "/connect-bank"
      : state.dataSource === "manual-upload"
        ? "/dashboard/core/transactions"
        : "/dashboard";

  return (
    <div className="space-y-8">
      <header className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          You&apos;re ready to go
        </h1>
        <p className="mt-2 text-muted-foreground">
          ReconAI is configured for {state.entityName || "your workspace"}.
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">What happens next</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {state.dataSource === "bank-connect" && (
                  <li>Connect your bank accounts securely via Plaid</li>
                )}
                {state.dataSource === "manual-upload" && (
                  <li>Upload your first statement to begin categorization</li>
                )}
                {state.dataSource === "later" && (
                  <li>Explore the platform and add data when ready</li>
                )}
                <li>ReconAI will analyze transactions and surface insights</li>
                <li>Review outputs in your dashboard for accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 text-sm">
          <div className="font-medium">Configuration summary</div>
          <dl className="mt-3 space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <dt>Entity type</dt>
              <dd className="font-medium text-foreground capitalize">
                {state.entityType?.replace("-", " ") || "Not set"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Operating intent</dt>
              <dd className="font-medium text-foreground capitalize">
                {state.operatingIntent?.replace(/-/g, " ") || "Not set"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Data source</dt>
              <dd className="font-medium text-foreground capitalize">
                {state.dataSource?.replace(/-/g, " ") || "Not set"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <footer className="flex flex-col gap-3 pt-4">
        <Link
          href={getAuthGatedPath(dashboardPath)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {state.dataSource === "bank-connect"
            ? "Connect bank accounts"
            : state.dataSource === "manual-upload"
              ? "Upload your first statement"
              : "Open dashboard"}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {state.dataSource !== "later" && (
          <Link
            href={getAuthGatedPath("/dashboard")}
            className="text-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            Skip to dashboard
          </Link>
        )}
      </footer>
    </div>
  );
}
