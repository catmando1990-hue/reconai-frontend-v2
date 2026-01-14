import { RouteShell } from "@/components/dashboard/RouteShell";
import { OverviewSnapshot } from "@/components/overview/OverviewSnapshot";

export default function CoreOverviewPage() {
  return (
    <RouteShell
      title="Core Overview"
      subtitle="Read-only operational snapshot across accounts, activity, and controls."
    >
      <OverviewSnapshot />
    </RouteShell>
  );
}
