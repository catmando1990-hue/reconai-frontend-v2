"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      const res = await fetch("/api/admin/maintenance", { cache: "no-store" });
      if (cancelled) return;

      if (res.status === 403) {
        setError("Access denied. Admin only.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) {
          setMaintenance(Boolean(data.maintenance));
        }
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !maintenance }),
    });
    if (res.ok) {
      const data = await res.json();
      setMaintenance(Boolean(data.maintenance));
    }
    setLoading(false);
  }

  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (maintenance === null) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Admin Settings</h1>
      <div className="flex items-center justify-between rounded border p-4">
        <span>Maintenance Mode</span>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {maintenance ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
