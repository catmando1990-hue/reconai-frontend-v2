"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Core Transactions"
      subtitle="This surface will consolidate transaction review tools for Core."
    >
      <PlaceholderSurface
        title="Core Transactions"
        subtitle="This surface will consolidate transaction review tools for Core."
        bullets={[
          "Normalized transaction feed (already live)",
          "Duplicate indicators and evidence",
          "Category suggestions (advisory)",
        ]}
      />
    </RouteShell>
  );
}
