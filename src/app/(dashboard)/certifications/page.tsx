"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Certifications"
      subtitle="Compliance certification surfaces staged."
    >
      <PlaceholderSurface
        title="Certifications"
        subtitle="Compliance certification surfaces staged."
        bullets={[
          "Control checklists",
          "Evidence links",
          "Audit-backed attestations later",
        ]}
      />
    </RouteShell>
  );
}
