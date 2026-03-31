"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";
import PolicyBanner from "@/components/policy/PolicyBanner";

export default function CoreOverviewPage() {
  return (
    <RouteShell
      title="Core Overview"
      subtitle="Operational posture across transactions, compliance, and system integrity."
    >
      <PolicyBanner
        policy="bookkeeping"
        message="ReconAI provides bookkeeping support surfaces. Verify financial records and consult a qualified professional for official reporting."
        context="core-overview"
      />

      <OverviewSnapshot />
    </RouteShell>
  );
}
