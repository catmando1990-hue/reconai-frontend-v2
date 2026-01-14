"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell title="Leases" subtitle="Property/lease modules are staged.">
      <PlaceholderSurface
        title="Leases"
        subtitle="Property/lease modules are staged."
        bullets={[
          "Read-only entities first",
          "Evidence-first changes later",
          "Audit logging required for writes",
        ]}
      />
    </RouteShell>
  );
}
