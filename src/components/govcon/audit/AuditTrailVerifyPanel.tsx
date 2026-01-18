"use client";

import { useEffect, useState } from "react";

type VerifyEvent = {
  id: string;
  created_at: string;
  event_type: string;
  prev_hash: string | null;
  event_hash: string | null;
  computed_hash: string | null;
  ok: boolean;
};

type VerifyResponse = {
  request_id?: string | null;
  status: "ok" | "empty" | "error";
  verified_count: number;
  total: number;
  events: VerifyEvent[];
  advisory?: { message?: string };
};

export default function AuditTrailVerifyPanel() {
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch("/govcon/audit/verify", { method: "GET" });
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as VerifyResponse;
      setData(json);
    } catch {
      setErr("Unable to verify audit trail at this time.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Audit Trail Verification</h1>
          <p className="text-sm text-muted-foreground">
            Read-only integrity check of hash-chained audit events (if
            available).
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Re-verify"}
        </button>
      </div>

      {err ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          {err}
        </div>
      ) : !data ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : data.status === "empty" ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No hash-chained audit events are available to verify.{" "}
          {data.advisory?.message ? `(${data.advisory.message})` : ""}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium">{data.status.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Verified:</span>{" "}
                <span className="font-medium">
                  {data.verified_count}/{data.total}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Advisory-only. A &quot;PASS&quot; indicator here does not certify
              compliance.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-3">Created</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Prev Hash</th>
                  <th className="p-3">Event Hash</th>
                  <th className="p-3">Computed</th>
                  <th className="p-3">OK</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0">
                    <td className="p-3 whitespace-nowrap">{e.created_at}</td>
                    <td className="p-3 whitespace-nowrap">{e.event_type}</td>
                    <td className="p-3 font-mono text-xs">
                      {e.prev_hash ?? "—"}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {e.event_hash ?? "—"}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {e.computed_hash ?? "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {e.ok ? "PASS" : "FAIL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4 text-xs text-muted-foreground">
        This integrity view checks stored hash links if your audit table
        supports prev_hash/event_hash/payload. If your current storage does not
        include hash chaining, this page will show an empty state.
      </div>
    </div>
  );
}
