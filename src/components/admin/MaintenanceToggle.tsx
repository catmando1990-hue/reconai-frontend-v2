"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Wrench } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";

/**
 * BUILD 9/18: Admin-only maintenance toggle control.
 * Uses authenticated apiFetch to toggle maintenance mode.
 * BUILD 18: Remove hardcoded colors; rely on semantic tokens.
 */
export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ ok: boolean; enabled: boolean }>("/api/maintenance/status")
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(null));
  }, []);

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
