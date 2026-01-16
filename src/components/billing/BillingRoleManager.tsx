"use client";

import * as React from "react";

type BillingRole = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_owner: boolean;
};

type RoleUpdateResult = {
  user_id: string;
  role: string;
  success: boolean;
  error?: string;
};

export function BillingRoleManager({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<BillingRole[]>([]);
  const [pendingChanges, setPendingChanges] = React.useState<
    Record<string, string>
  >({});

  const fetchRoles = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/billing/roles`, {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setRoles(json.roles || []);
      setPendingChanges({});
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load billing roles";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setSaving(true);
    setErr(null);
    try {
      const updates = Object.entries(pendingChanges).map(([user_id, role]) => ({
        user_id,
        role,
      }));

      const res = await fetch(`${apiBase}/api/billing/roles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const results = (json.results || []) as RoleUpdateResult[];

      // Check for failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        setErr(
          `Some updates failed: ${failures.map((f) => f.error).join(", ")}`,
        );
      }

      // Refresh roles
      await fetchRoles();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save changes";
      setErr(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Billing Role Management</div>
          <div className="text-xs opacity-70">
            Manage billing permissions for team members (manual).
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="rounded-xl border bg-blue-600 text-white px-3 py-2 text-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button
            type="button"
            onClick={fetchRoles}
            disabled={loading}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {loading ? "Loading..." : "Load Roles"}
          </button>
        </div>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {roles.length > 0 ? (
        <div className="mt-4 space-y-2">
          {roles.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div>
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs opacity-70">{member.email}</div>
              </div>
              {member.is_owner ? (
                <span className="text-xs px-2 py-1 rounded bg-gray-200">
                  Owner (cannot change)
                </span>
              ) : (
                <select
                  value={pendingChanges[member.user_id] || member.role}
                  onChange={(e) =>
                    handleRoleChange(member.user_id, e.target.value)
                  }
                  className="rounded-lg border px-2 py-1 text-sm"
                >
                  <option value="billing_admin">Billing Admin</option>
                  <option value="read_only">Read Only</option>
                </select>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm opacity-70">
          No roles loaded. Click &quot;Load Roles&quot; to view team members.
        </div>
      )}
    </div>
  );
}
