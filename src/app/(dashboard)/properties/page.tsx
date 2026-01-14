"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell title="Properties" subtitle="Property module surfaces staged.">
      <PlaceholderSurface
        title="Properties"
        subtitle="Property module surfaces staged."
        bullets={[
          "Read-only lists and health",
          "Audit and compliance hooks",
          "Writes only after approval",
        ]}
      />
    </RouteShell>
  );
}
