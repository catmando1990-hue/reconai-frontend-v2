"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";

export default function CfoOverviewPage() {
  return (
    <RouteShell
      title="CFO Overview"
      subtitle="Executive surfaces across financial posture and risk."
    >
      <PolicyBanner
        policy="accounting"
        message="Financial reports and metrics are for informational purposes. Consult a licensed accountant for official financial statements and compliance requirements."
        context="cfo-overview"
      />
      <OverviewSnapshot />
    </RouteShell>
  );
}
