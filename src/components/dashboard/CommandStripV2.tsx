"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command, Activity, Sparkles, Bell } from "lucide-react";
import {
  CommandPalette,
  CommandItem,
} from "@/components/dashboard/CommandPalette";
import { DEFAULT_COMMANDS } from "@/lib/commandRegistry";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const handleOpenPalette = useCallback(() => {
    setOpen(true);
  }, []);

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
    <div className="border-b border-[#e5e7eb] dark:border-[#27272a] bg-white/70 dark:bg-[#18181b]/70 backdrop-blur relative z-30">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <Command className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
          <div className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">ReconAI</div>
          <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">• {label}</div>
        </div>

        <button
          type="button"
          onClick={handleOpenPalette}
          className="ml-2 flex h-9 flex-1 items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb]/40 dark:bg-[#27272a]/40 px-3 text-sm text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] cursor-pointer relative z-40 transition-colors"
          aria-label="Open command palette"
        >
          <span className="truncate">Type a command or search…</span>
          <span className="ml-auto rounded-md border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-2 py-0.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
            ⌘K
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/intelligence/insights")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-3 text-xs text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#3f3f46] cursor-pointer transition-colors"
          >
            <Sparkles className="h-4 w-4 text-[#4f46e5] dark:text-[#6366f1]" />
            Run Intelligence
          </button>
          <button
            type="button"
            onClick={() => router.push("/intelligence/alerts")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-3 text-xs text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#3f3f46] cursor-pointer transition-colors"
          >
            <Bell className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            Signals
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-3 text-xs text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#3f3f46] cursor-pointer transition-colors"
          >
            <Activity className="h-4 w-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            Health
          </button>
          <ThemeToggle />
        </div>
      </div>

      <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
    </div>
  );
}
