"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string[];
  onSelect: () => void;
};

const RECENTS_KEY = "reconai_recent_commands_v1";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function splitQuery(q: string): { verb?: string; text: string } {
  const raw = normalize(q);
  if (!raw) return { text: "" };
  const m = raw.match(/^(go|open|run|nav)\s*[:\s]+(.+)$/i);
  if (!m) return { text: raw };
  return { verb: normalize(m[1]), text: normalize(m[2]) };
}

function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = haystack;
  const n = needle;
  const idx = h.indexOf(n);
  if (idx >= 0) return 1000 - idx;

  let score = 0;
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    const c = n[ni];
    const found = h.indexOf(c, hi);
    if (found < 0) return -1;
    score += 10;
    if (found === hi) score += 6;
    hi = found + 1;
  }
  return score;
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string").slice(0, 8);
  } catch {
    return [];
  }
}

function writeRecent(id: string) {
  try {
    const cur = readRecents();
    const next = [id, ...cur.filter((x) => x !== id)].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function groupBy<T extends { group?: string }>(
  items: T[]
): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const g = it.group || "Other";
    const arr = map.get(g) || [];
    arr.push(it);
    map.set(g, arr);
  }
  const order = [
    "Recent",
    "Navigate",
    "Core",
    "Intelligence",
    "CFO",
    "Settings",
    "Other",
  ];
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return entries;
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = "Type a command or search…",
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  commands: CommandItem[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Only render portal after mount (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const ranked = useMemo(() => {
    const { verb, text } = splitQuery(query);
    const q = text;

    const base = commands.map((c) => {
      const hay = normalize([c.label, ...(c.keywords ?? [])].join(" "));
      const s = q ? fuzzyScore(hay, q) : 0;
      return { c, score: s };
    });

    let filtered = base;
    if (q) {
      filtered = filtered.filter((x) => x.score >= 0);
      filtered.sort((a, b) => b.score - a.score);
    }

    if (verb) {
      const v = verb;
      filtered.sort((a, b) => {
        const aHay = normalize(a.c.label + " " + (a.c.group || ""));
        const bHay = normalize(b.c.label + " " + (b.c.group || ""));
        const aBoost = aHay.includes(v) ? 1 : 0;
        const bBoost = bHay.includes(v) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return (b.score ?? 0) - (a.score ?? 0);
      });
    }

    return filtered.map((x) => x.c);
  }, [commands, query]);

  const withRecents = useMemo(() => {
    if (!open) return ranked;
    const q = normalize(query);
    if (q) return ranked;

    const recents = readRecents();
    if (!recents.length) return ranked;

    const byId = new Map(ranked.map((c) => [c.id, c] as const));
    const recentItems = recents
      .map((id) => byId.get(id))
      .filter(Boolean) as CommandItem[];

    const rest = ranked.filter((c) => !recents.includes(c.id));
    const taggedRecent = recentItems.map((c) => ({ ...c, group: "Recent" }));
    return [...taggedRecent, ...rest];
  }, [open, query, ranked]);

  const flat = withRecents;
  const groups = useMemo(() => groupBy(flat), [flat]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[activeIndex];
        if (!item) return;
        writeRecent(item.id);
        onOpenChange(false);
        item.onSelect();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, flat, activeIndex]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex((i) => {
      const max = Math.max(0, flat.length - 1);
      return Math.min(i, max);
    });
  }, [open, flat.length]);

  // Don't render until mounted (prevents SSR hydration issues)
  if (!mounted) return null;
  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-black/50 cursor-default"
        onClick={() => onOpenChange(false)}
      />

      <div className="absolute left-1/2 top-16 w-[min(920px,92vw)] -translate-x-1/2">
        <div className="rounded-2xl border border-border bg-background shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Command search"
            />
            <div className="mt-2 text-[11px] text-muted-foreground">
              Verbs: <span className="font-medium">go:</span>{" "}
              <span className="font-medium">open:</span>{" "}
              <span className="font-medium">run:</span> • Navigate with ↑↓ •
              Enter to run
            </div>
          </div>

          <div className="max-h-[58vh] overflow-y-auto p-2">
            {flat.length ? (
              <div className="space-y-3">
                {groups.map(([g, items]) => (
                  <div key={g}>
                    <div className="px-2 pb-1 text-[11px] font-semibold text-muted-foreground">
                      {g}
                    </div>
                    <ul className="space-y-1">
                      {items.map((c) => {
                        const index = flat.findIndex((x) => x.id === c.id);
                        const active = index === activeIndex;
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => {
                                writeRecent(c.id);
                                onOpenChange(false);
                                c.onSelect();
                              }}
                              className={
                                "w-full rounded-xl border px-3 py-2 text-left cursor-pointer " +
                                (active
                                  ? "border-border bg-muted/40"
                                  : "border-transparent hover:border-border hover:bg-muted/30")
                              }
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-medium">
                                  {c.label}
                                </div>
                                {c.hint ? (
                                  <div className="text-xs text-muted-foreground">
                                    {c.hint}
                                  </div>
                                ) : null}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                No matches.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span>Esc to close</span>
            <span>↑↓ navigate • Enter run</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document.body level, escaping any parent overflow/transform constraints
  return createPortal(modalContent, document.body);
}
