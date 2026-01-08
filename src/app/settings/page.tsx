import { RouteShell } from "@/components/dashboard/RouteShell";

export default function SettingsPage() {
  return (
    <RouteShell
      title="Settings"
      subtitle="Workspace preferences, integrations, and security controls."
    >
      <p className="text-sm text-muted-foreground">
        Settings will appear here.
      </p>
    </RouteShell>
  );
}
