"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command, Activity, Sparkles, Bell } from "lucide-react";
import {
  CommandPalette,
  CommandItem,
} from "@/components/dashboard/CommandPalette";
import { DEFAULT_COMMANDS } from "@/lib/commandRegistry";

function sectionLabel(pathname: string): string {
  if (pathname.startsWith("/core")) return "Core";
  if (pathname.startsWith("/intelligence")) return "Intelligence";
  if (pathname.startsWith("/cfo")) return "CFO";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

export function CommandStripV2() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCmdK = (e.metaKey || e.ctrlKey) && key === "k";
      if (!isCmdK) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (target as HTMLElement | null)?.isContentEditable;
      if (isTyping) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands: CommandItem[] = useMemo(() => {
    return DEFAULT_COMMANDS.map((d) => {
      return {
        id: d.id,
        label: d.label,
        group: d.group,
        hint: d.hint,
        keywords: d.keywords,
        onSelect: () => {
          if (d.href) router.push(d.href);
        },
      };
    });
  }, [router]);

  const label = sectionLabel(pathname);

  return (
    <div className="border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <Command className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">ReconAI</div>
          <div className="text-xs text-muted-foreground">• {label}</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-2 flex h-9 flex-1 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-sm text-muted-foreground hover:bg-card/60"
          aria-label="Open command palette"
        >
          <span className="truncate">Type a command or search…</span>
          <span className="ml-auto rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            ⌘K
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/intelligence/insights")}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-xs hover:bg-card/60"
          >
            <Sparkles className="h-4 w-4" />
            Run Intelligence
          </button>
          <button
            type="button"
            onClick={() => router.push("/intelligence/alerts")}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-xs hover:bg-card/60"
          >
            <Bell className="h-4 w-4" />
            Signals
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card/40 px-3 text-xs hover:bg-card/60"
          >
            <Activity className="h-4 w-4" />
            Health
          </button>
        </div>
      </div>

      <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
    </div>
  );
}
