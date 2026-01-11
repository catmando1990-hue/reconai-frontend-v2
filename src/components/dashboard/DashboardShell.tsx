"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu, X } from "lucide-react";

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
    <div className="flex min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/50"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              ReconAI
            </span>
            <span className="text-sm font-medium">{title}</span>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card/50 px-3 text-xs"
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-[340px] bg-background border-r border-border shadow-xl">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <div className="text-sm font-semibold">Menu</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/50"
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
