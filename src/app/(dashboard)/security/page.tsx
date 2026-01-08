import { RouteShell } from "@/components/dashboard/RouteShell";

export default function SecurityPage() {
  return (
    <RouteShell
      title="Security"
      subtitle="Authentication, access control, and security posture."
    >
      <p className="text-sm text-muted-foreground">
        This section is routed correctly and ready for logic phases.
      </p>
    </RouteShell>
  );
}
