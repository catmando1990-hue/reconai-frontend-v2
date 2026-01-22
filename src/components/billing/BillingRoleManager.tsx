"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type BillingRole = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_owner: boolean;
};

type RolesResponse = {
  request_id: string;
  roles: BillingRole[];
};

type RoleUpdateResult = {
  user_id: string;
  role: string;
  success: boolean;
  error?: string;
};

type RoleUpdateResponse = {
  request_id: string;
  results: RoleUpdateResult[];
};

export function BillingRoleManager({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<BillingRole[]>([]);
  const [pendingChanges, setPendingChanges] = React.useState<
    Record<string, string>
  >({});
  // Audit evidence state
  const [lastRequestId, setLastRequestId] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleError = (e: unknown, fallbackMessage: string) => {
    if (e instanceof AuditProvenanceError) {
      setErr(`Provenance error: ${e.message}`);
    } else if (e instanceof HttpError) {
      setErr(`HTTP ${e.status}: ${e.message}`);
    } else {
      setErr(e instanceof Error ? e.message : fallbackMessage);
    }
  };

  const fetchRoles = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<RolesResponse>(
        `${apiBase}/api/billing/roles`,
        { credentials: "include" },
      );
      setRoles(json.roles || []);
      setPendingChanges({});
    } catch (e: unknown) {
      handleError(e, "Failed to load billing roles");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setSaving(true);
    setErr(null);
    setSaveSuccess(false);
    setLastRequestId(null);
    try {
      const updates = Object.entries(pendingChanges).map(([user_id, role]) => ({
        user_id,
        role,
      }));

      const json = await auditedFetch<RoleUpdateResponse>(
        `${apiBase}/api/billing/roles`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ updates }),
        },
      );

      // Capture request_id for audit evidence
      setLastRequestId(json.request_id);

      const results = json.results || [];

      // Check for failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        setErr(
          `Some updates failed: ${failures.map((f) => f.error).join(", ")}`,
        );
      } else {
        setSaveSuccess(true);
      }

      // Refresh roles
      await fetchRoles();
    } catch (e: unknown) {
      handleError(e, "Failed to save changes");
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

      {err ? (
        <div className="mt-3">
          <div className="text-sm text-red-500">{err}</div>
          <AuditEvidence requestId={lastRequestId} variant="error" />
        </div>
      ) : null}

      {saveSuccess && !err && (
        <div className="mt-3">
          <div className="text-sm text-green-600">Changes saved successfully.</div>
          <AuditEvidence requestId={lastRequestId} variant="success" />
        </div>
      )}

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
