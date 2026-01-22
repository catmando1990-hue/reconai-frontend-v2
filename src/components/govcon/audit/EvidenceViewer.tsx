"use client";

import { useEffect, useMemo, useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type EvidenceItem = {
  id: string;
  created_at: string;
  type: string;
  title: string;
  hash: string | null;
  source: string | null;
};

type EvidenceResponse = {
  request_id?: string | null;
  items: EvidenceItem[];
  advisory?: { message?: string };
};

export default function EvidenceViewer() {
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);
        setErr(null);
        const json = await auditedFetch<EvidenceResponse>("/govcon/evidence");
        if (!alive) return;
        setData(json);
      } catch (e) {
        if (!alive) return;
        if (e instanceof AuditProvenanceError) {
          setErr(`Provenance error: ${e.message}`);
        } else if (e instanceof HttpError) {
          setErr(`HTTP ${e.status}: ${e.message}`);
        } else {
          setErr("Unable to load evidence at this time.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) =>
      [i.type, i.title, i.hash ?? "", i.source ?? ""].some((x) =>
        x.toLowerCase().includes(needle),
      ),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Evidence Viewer</h1>
        <p className="text-sm text-muted-foreground">
          Read-only evidence index. No uploads. No edits. No automatic actions.
        </p>
      </div>

      <div className="rounded-lg border p-3">
        <label
          className="text-xs text-muted-foreground"
          htmlFor="evidence-search"
        >
          Search evidence
        </label>
        {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
        <input
          id="evidence-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by type, title, hash, source…"
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : err ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          {err}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No evidence found.{" "}
          {data?.advisory?.message ? `(${data.advisory.message})` : ""}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3">Created</th>
                <th className="p-3">Type</th>
                <th className="p-3">Title</th>
                <th className="p-3">Hash</th>
                <th className="p-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-b last:border-b-0">
                  <td className="p-3 whitespace-nowrap">{it.created_at}</td>
                  <td className="p-3 whitespace-nowrap">{it.type}</td>
                  <td className="p-3">{it.title}</td>
                  <td className="p-3 font-mono text-xs">{it.hash ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap">{it.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border p-4 text-xs text-muted-foreground">
        Advisory-only. Use this to locate artifacts (exports, audit events,
        evidence references). This does not certify compliance.
      </div>
    </div>
  );
}
