"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AdminCommandStrip } from "@/components/admin/AdminCommandStrip";
import { CommandStripV2 } from "@/components/dashboard/CommandStripV2";
import { Menu, X, Brain, Maximize2, Minimize2 } from "lucide-react";

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith("/core")) return "Core";
  if (pathname.startsWith("/cfo")) return "CFO Mode";
  if (pathname.startsWith("/payroll")) return "Payroll";
  if (pathname.startsWith("/govcon")) return "GovCon";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/home")) return "Dashboard";
  return "ReconAI";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getSectionTitle(pathname || "");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Focus mode: user-controlled sidebar collapse for immersive views
  const [focusMode, setFocusMode] = useState(false);

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
    <div className="relative min-h-[100dvh] bg-muted text-foreground overflow-x-hidden">
      <div className="relative flex min-h-[100dvh] w-full">
        {/* Desktop sidebar - conditionally hidden in focus mode */}
        {!focusMode && (
          <div className="hidden md:block relative z-10 h-screen sticky top-0 shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-muted/80 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur transition-all hover:bg-accent hover:border-border"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  ReconAI
                </span>
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-all"
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
              className="absolute inset-0 bg-muted/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              type="button"
            />
            <div className="absolute left-0 top-0 h-full w-[85vw] max-w-[340px] bg-muted/95 backdrop-blur-xl border-r border-border/50 shadow-2xl">
              <div className="flex items-center justify-between px-4 h-14 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/50 hover:bg-accent hover:border-border transition-all"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
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
              "relative flex-1 bg-background",
              focusMode
                ? "md:rounded-none md:border-l-0"
                : "md:rounded-l-3xl md:border-l md:border-border/60",
            ].join(" ")}
          >
            {/* Focus mode toggle - desktop only */}
            <div className="hidden md:block absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/80 backdrop-blur text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-all"
                title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
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
  );
}
