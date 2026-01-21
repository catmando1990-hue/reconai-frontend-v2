"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Wrench } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";

/**
 * BUILD 9/18: Admin-only maintenance toggle control.
 * Uses authenticated apiFetch to toggle maintenance mode.
 * BUILD 18: Remove hardcoded colors; rely on semantic tokens.
 *
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function MaintenanceToggle() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;

    apiFetch<{ ok: boolean; enabled: boolean }>("/api/maintenance/status")
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(null));
  }, [authReady, apiFetch]);

  if (enabled === null) return null;

  const toggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const endpoint = enabled
        ? "/api/admin/maintenance/disable"
        : "/api/admin/maintenance/enable";

      await apiFetch(endpoint, { method: "POST" });
      setEnabled(!enabled);
    } catch {
      // Silent fail by design (admin can retry)
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-1 text-xs font-medium text-foreground transition-shadow hover:shadow-sm disabled:opacity-60"
      title={enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
    >
      <Wrench className="h-3 w-3 text-muted-foreground" />
      <span>{loading ? "…" : enabled ? "Maintenance" : "Maintenance"}</span>
      <StatusChip variant={enabled ? "warn" : "ok"}>
        {enabled ? "ON" : "OFF"}
      </StatusChip>
    </button>
  );
}
