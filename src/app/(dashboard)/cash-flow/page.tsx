"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PlaceholderSurface } from "@/components/dashboard/PlaceholderSurface";

export default function Page() {
  return (
    <RouteShell
      title="Cash Flow"
      subtitle="Cash flow insights are advisory and explainable."
    >
      <PlaceholderSurface
        title="Cash Flow"
        subtitle="Cash flow insights are advisory and explainable."
        bullets={[
          "Trend surfaces with confidence + explanation",
          "Short-horizon forecast-lite",
          "No writes or auto-actions",
        ]}
      />
    </RouteShell>
  );
}
