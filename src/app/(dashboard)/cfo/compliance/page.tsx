"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="CFO Compliance"
      subtitle="Executive compliance surfaces staged."
    >
      <PlaceholderSurface
        title="CFO Compliance"
        subtitle="Executive compliance surfaces staged."
        bullets={[
          "Audit summary already live",
          "Signals evidence review",
          "Controls staged for next phase",
        ]}
      />
    </RouteShell>
  );
}
