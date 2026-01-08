"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <RouteShell title="Settings" subtitle="Manage your account and preferences">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
              <p className="font-medium">{user?.fullName ?? "Not set"}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">
                {user?.primaryEmailAddress?.emailAddress ?? "Not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="mb-4 text-lg font-medium">Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Settings and preferences coming soon.
          </p>
        </div>
      </div>
    </RouteShell>
  );
}
