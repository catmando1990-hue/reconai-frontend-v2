"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell title="Units" subtitle="Unit module surfaces staged.">
      <PlaceholderSurface
        title="Units"
        subtitle="Unit module surfaces staged."
        bullets={[
          "Read-only unit roster",
          "Lease linkage",
          "Audit-backed actions later",
        ]}
      />
    </RouteShell>
  );
}
