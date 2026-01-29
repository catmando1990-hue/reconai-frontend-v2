"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarV2 } from "./SidebarV2";
import { AdminCommandStrip } from "@/components/admin/AdminCommandStrip";
import { Menu, X, Bell, Search } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface ShellV2Props {
  children: React.ReactNode;
  /** Module name for potential customization */
  module?: string;
}

export function ShellV2({ children, module }: ShellV2Props) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0">
        <SidebarV2 />
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-primary-foreground"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-semibold">ReconAI</span>
        </div>

        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10" />
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-card">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
              <SidebarV2 />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-56">
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/home"
              className="text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#059669] text-[10px] font-medium text-white">
                2
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 hover:bg-accent transition-colors"
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
              <span className="text-sm font-medium">
                {user?.firstName || "User"}
              </span>
            </button>
          </div>
        </header>

        <AdminCommandStrip />

        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
