"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Wrench } from "lucide-react";

/**
 * BUILD 9: Admin-only maintenance toggle control.
 * Uses authenticated apiFetch to toggle maintenance mode.
 * Shows current state and allows toggling on/off.
 */
export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial maintenance status
    apiFetch<{ ok: boolean; enabled: boolean }>("/api/maintenance/status")
      .then((res) => setEnabled(res.enabled))
      .catch(() => setEnabled(null));
  }, []);

  // Don't render until we have status
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
    } catch (err) {
      // Silently fail - admin will see if it didn't work
      console.error("Failed to toggle maintenance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={[
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border transition-colors",
        enabled
          ? "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          : "border-border bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground",
        loading ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
      title={
        enabled
          ? "Click to disable maintenance mode"
          : "Click to enable maintenance mode"
      }
    >
      <Wrench className="h-3 w-3" />
      {loading ? "..." : enabled ? "Maintenance: ON" : "Maintenance: OFF"}
    </button>
  );
}
