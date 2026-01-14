"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell title="Tenants" subtitle="Tenant module surfaces staged.">
      <PlaceholderSurface
        title="Tenants"
        subtitle="Tenant module surfaces staged."
        bullets={[
          "Read-only entities",
          "Lease linkage",
          "Audit-backed actions later",
        ]}
      />
    </RouteShell>
  );
}
