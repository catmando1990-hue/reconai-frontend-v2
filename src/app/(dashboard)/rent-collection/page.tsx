"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell title="Rent Collection" subtitle="Collection surfaces staged.">
      <PlaceholderSurface
        title="Rent Collection"
        subtitle="Collection surfaces staged."
        bullets={[
          "Read-only invoices/bills linkage",
          "Signals for delinquencies later",
          "No payment initiation yet",
        ]}
      />
    </RouteShell>
  );
}
