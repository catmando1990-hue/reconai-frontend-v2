"use client";

import { useEffect, useState, useTransition, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AdminCommandStrip } from "@/components/admin/AdminCommandStrip";
import { CommandStripV2 } from "@/components/dashboard/CommandStripV2";
import { ThemeProvider } from "@/components/theme";
import { Menu, X, Brain, Maximize2, Minimize2 } from "lucide-react";

/**
 * Routes that default to focus mode (sidebar collapsed)
 * These are immersive/perspective views that benefit from full-width content
 */
const FOCUS_MODE_ROUTES = [
  "/govcon/evidence",
  "/govcon/sf-1408",
  "/intelligence/insights",
  "/cfo/executive-summary",
];

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith("/core")) return "Core";
  if (pathname.startsWith("/intelligence")) return "Intelligence";
  if (pathname.startsWith("/cfo")) return "CFO Mode";
  if (pathname.startsWith("/govcon")) return "GovCon";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/home")) return "Dashboard";
  return "ReconAI";
}

function shouldDefaultToFocusMode(pathname: string): boolean {
  return FOCUS_MODE_ROUTES.some((route) => pathname.startsWith(route));
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getSectionTitle(pathname || "");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Focus mode: sidebar fully collapsed for immersive views
  // Compute whether current route should default to focus mode
  const shouldFocus = useMemo(
    () => shouldDefaultToFocusMode(pathname || ""),
    [pathname],
  );

  // Initialize focus mode based on current route
  const [focusMode, setFocusMode] = useState(() =>
    shouldDefaultToFocusMode(pathname || ""),
  );

  // Track previous pathname to sync focus mode with route changes
  const prevPathnameRef = useRef(pathname);

  // Reset focus mode when route changes to/from focus-default routes
  // This synchronizes component state with the router (external system)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with router state
      setFocusMode(shouldFocus);
    }
  }, [pathname, shouldFocus]);

  // Close drawer on pathname change
  useEffect(() => {
    startTransition(() => {
      setOpen(false);
    });
  }, [pathname]);

  // Prevent background scroll when drawer is open (mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <ThemeProvider>
      <div className="relative min-h-dvh bg-[#fafafa] dark:bg-[#0a0a0b] text-[#111827] dark:text-[#f9fafb] overflow-x-hidden">
        <div className="relative flex min-h-dvh w-full">
          {/* Desktop sidebar - conditionally hidden in focus mode */}
          {!focusMode && (
            <div className="hidden md:block z-10 h-screen sticky top-0 shrink-0">
              <Sidebar />
            </div>
          )}

          {/* Mobile top bar */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-[#e5e7eb]/50 dark:border-[#27272a]/50 bg-[#fafafa]/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e7eb]/50 dark:border-[#27272a]/50 bg-white/50 dark:bg-[#18181b]/50 backdrop-blur transition-all hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:border-[#e5e7eb] dark:hover:border-[#27272a]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa]" />
              </button>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#4f46e5]/10 dark:bg-[#6366f1]/10 border border-[#4f46e5]/20 dark:border-[#6366f1]/20 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-[#4f46e5] dark:text-[#6366f1]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[#6b7280] dark:text-[#a1a1aa]">
                    ReconAI
                  </span>
                  <span className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
                    {title}
                  </span>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e5e7eb]/50 dark:border-[#27272a]/50 bg-white/50 dark:bg-[#18181b]/50 backdrop-blur px-3 text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-[#f9fafb] hover:border-[#e5e7eb] dark:hover:border-[#27272a] transition-all"
              >
                Home
              </Link>
            </div>
          </div>

          {/* Mobile drawer */}
          {open && (
            <div className="md:hidden fixed inset-0 z-50">
              <button
                aria-label="Close menu"
                className="absolute inset-0 bg-[#fafafa]/60 dark:bg-[#0a0a0b]/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div className="absolute left-0 top-0 h-full w-[85vw] max-w-85 bg-[#fafafa]/95 dark:bg-[#0a0a0b]/95 backdrop-blur-xl border-r border-[#e5e7eb]/50 dark:border-[#27272a]/50 shadow-2xl">
                <div className="flex items-center justify-between px-4 h-14 border-b border-[#e5e7eb]/50 dark:border-[#27272a]/50">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#4f46e5]/10 dark:bg-[#6366f1]/10 border border-[#4f46e5]/20 dark:border-[#6366f1]/20 flex items-center justify-center">
                      <Brain className="h-3.5 w-3.5 text-[#4f46e5] dark:text-[#6366f1]" />
                    </div>
                    <span className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">Menu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb]/50 dark:border-[#27272a]/50 bg-white/50 dark:bg-[#18181b]/50 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:border-[#e5e7eb] dark:hover:border-[#27272a] transition-all"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  </button>
                </div>

                <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
                  <Sidebar />
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            {/* Desktop utility/command strips */}
            <div className="hidden md:block">
              <AdminCommandStrip />
            </div>
            <div className="hidden md:block">
              <CommandStripV2 />
            </div>

            {/* Canvas */}
            <div
              className={[
                "relative flex-1 bg-white dark:bg-[#18181b]",
                focusMode
                  ? "md:rounded-none md:border-l-0"
                  : "md:rounded-l-3xl md:border-l md:border-[#e5e7eb]/60 dark:md:border-[#27272a]/60",
              ].join(" ")}
            >
              {/* Focus mode toggle - desktop only */}
              <div className="hidden md:block absolute top-3 right-3 z-20">
                <button
                  type="button"
                  onClick={() => setFocusMode(!focusMode)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb]/50 dark:border-[#27272a]/50 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-[#f9fafb] hover:border-[#e5e7eb] dark:hover:border-[#27272a] transition-all"
                  title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                  aria-label={
                    focusMode ? "Exit focus mode" : "Enter focus mode"
                  }
                >
                  {focusMode ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <main className="h-full overflow-y-auto pt-14 md:pt-0">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
