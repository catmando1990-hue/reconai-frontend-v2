"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="DCAA"
      subtitle="DCAA surfaces staged for controlled rollout."
    >
      <PlaceholderSurface
        title="DCAA"
        subtitle="DCAA surfaces staged for controlled rollout."
        bullets={[
          "Audit-ready logging",
          "Evidence snapshots",
          "Read-only posture until approved",
        ]}
      />
    </RouteShell>
  );
}
