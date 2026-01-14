"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Compliance"
      subtitle="Compliance surfaces remain read-only and evidence-first."
    >
      <PlaceholderSurface
        title="Compliance"
        subtitle="Compliance surfaces remain read-only and evidence-first."
        bullets={[
          "Audit trail review",
          "Policy acknowledgements",
          "Signals-driven risk flags",
        ]}
      />
    </RouteShell>
  );
}
