"use client";

import { useMemo, useState } from "react";
import { SF1408_SECTIONS, type Sf1408Section } from "./sf1408_data";

function SectionCard({ section }: { section: Sf1408Section }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{section.title}</h2>
          <p className="text-xs text-muted-foreground">
            Advisory-only checklist view. No actions are taken automatically.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {section.items.map((it) => (
          <li key={it.id} className="flex gap-2 text-sm">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SF1408ChecklistViewer() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SF1408_SECTIONS;
    return SF1408_SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((i) => i.text.toLowerCase().includes(q)),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          SF-1408 Preaward Survey Checklist
        </h1>
        <p className="text-sm text-muted-foreground">
          Informational checklist viewer for government contracting accounting
          system adequacy. This is not accounting or legal advice.
        </p>
      </div>

      <div className="rounded-lg border p-3">
        <label
          className="text-xs text-muted-foreground"
          htmlFor="sf1408-search"
        >
          Search checklist items
        </label>
        {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
        <input
          id="sf1408-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to filter..."
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            No checklist items match your search.
          </div>
        ) : (
          filtered.map((s) => <SectionCard key={s.id} section={s} />)
        )}
      </div>

      <div className="rounded-lg border p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Operational note</p>
        <p className="mt-1">
          This page is a read-only reference view. It does not write data, does
          not submit forms, and does not certify compliance. Use it to guide
          internal readiness checks and documentation collection.
        </p>
      </div>
    </div>
  );
}
