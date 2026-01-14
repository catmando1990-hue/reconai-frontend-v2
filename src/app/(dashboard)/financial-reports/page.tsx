"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Financial Reports"
      subtitle="Report surfaces staged for the next release phase."
    >
      <PlaceholderSurface
        title="Financial Reports"
        subtitle="Report surfaces staged for the next release phase."
        bullets={[
          "Read-only summaries",
          "Export-ready structures",
          "No official filing claims",
        ]}
      />
    </RouteShell>
  );
}
