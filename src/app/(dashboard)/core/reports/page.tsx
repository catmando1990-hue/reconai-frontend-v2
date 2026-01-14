"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Reports"
      subtitle="Read-only reporting surfaces staged for the next release phase."
    >
      <PlaceholderSurface
        title="Reports"
        subtitle="Read-only reporting surfaces staged for the next release phase."
        bullets={[
          "Category rollups and exports (read-only)",
          "Audit-linked report generation",
          "Evidence-first reporting surfaces",
        ]}
      />
    </RouteShell>
  );
}
