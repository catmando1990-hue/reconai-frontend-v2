"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AdminCommandStrip } from "@/components/admin/AdminCommandStrip";
import { CommandStripV2 } from "@/components/dashboard/CommandStripV2";
import { Menu, X, Brain } from "lucide-react";

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/core")) return "Core";
  if (pathname.startsWith("/dashboard/intelligence")) return "Intelligence";
  if (pathname.startsWith("/dashboard/cfo")) return "CFO Mode";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "ReconAI";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getSectionTitle(pathname || "");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

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
    <div className="relative flex min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      {/* Decorative background elements - matching landing page aesthetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Top gradient orb */}
        <div className="absolute -top-40 right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl dark:bg-primary/5" />
        {/* Bottom left orb */}
        <div className="absolute -bottom-40 left-[-5%] h-[400px] w-[400px] rounded-full bg-purple-500/8 blur-3xl dark:bg-purple-500/5" />
        {/* Bottom right orb */}
        <div className="absolute bottom-20 right-[-10%] h-[350px] w-[350px] rounded-full bg-cyan-500/8 blur-3xl dark:bg-cyan-500/5" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block relative z-10 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
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
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-[340px] bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl">
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
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* BUILD 9: Admin command strip - only visible to admins */}
        <div className="hidden md:block">
          <AdminCommandStrip />
        </div>

        {/* BUILD 21-23: Command Strip V2 - desktop only */}
        <div className="hidden md:block">
          <CommandStripV2 />
        </div>

        {/* Main */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
