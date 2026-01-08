"use client";

import Link from "next/link";
import { useOrg } from "@/lib/org-context";
import { hasAccess } from "@/lib/access";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  Sparkles,
  Bell,
  Bot,
  ShieldCheck,
  Home,
  DoorOpen,
  UserCheck,
  FileSignature,
  Wallet,
  Wrench,
  Settings,
  LifeBuoy,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  section?: string;
};

type Tier = {
  id: "core" | "intelligence" | "cfo";
  title: string;
  subtitle: string;
  items: NavItem[];
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const clerk = useClerk();

  // --- Map your current (old) dashboard IA into 3 tiers ---
  const tiers: Tier[] = useMemo(() => {
    const core: NavItem[] = [
      {
        name: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        section: "Core",
      },

      { name: "Accounts", href: "/accounts", icon: Building2, section: "Core" },
      {
        name: "Transactions",
        href: "/transactions",
        icon: ArrowLeftRight,
        section: "Core",
      },

      // Property module stays available, but under Core
      { name: "Properties", href: "/properties", icon: Home, section: "Core" },
      { name: "Units", href: "/units", icon: DoorOpen, section: "Core" },
      { name: "Tenants", href: "/tenants", icon: UserCheck, section: "Core" },
      { name: "Leases", href: "/leases", icon: FileSignature, section: "Core" },
      { name: "Rent", href: "/rent-collection", icon: Wallet, section: "Core" },
      {
        name: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
        section: "Core",
      },
    ];

    const intelligence: NavItem[] = [
      {
        name: "AI Worker",
        href: "/intelligence/ai-worker",
        icon: Bot,
        section: "Intelligence",
      },
      {
        name: "Alerts",
        href: "/intelligence/alerts",
        icon: Bell,
        section: "Intelligence",
      },
      {
        name: "Insights",
        href: "/intelligence/insights",
        icon: Sparkles,
        section: "Intelligence",
      },
    ];

    const cfo: NavItem[] = [
      {
        name: "Analyze",
        href: "/financial-reports",
        icon: BarChart3,
        section: "CFO Mode",
      },
      {
        name: "Cash Flow",
        href: "/cash-flow",
        icon: PieChart,
        section: "CFO Mode",
      },

      // Compliance: implied posture—kept available but de-emphasized
      {
        name: "Security & posture",
        href: "/security",
        icon: ShieldCheck,
        section: "CFO Mode",
      },
      {
        name: "Compliance",
        href: "/compliance",
        icon: ShieldCheck,
        section: "CFO Mode",
      },
      {
        name: "Certifications",
        href: "/certifications",
        icon: ShieldCheck,
        section: "CFO Mode",
      },
      { name: "DCAA", href: "/dcaa", icon: ShieldCheck, section: "CFO Mode" },
    ];

    return [
      {
        id: "core",
        title: "Core",
        subtitle: "Structured financial reality",
        items: core,
      },
      {
        id: "intelligence",
        title: "Intelligence",
        subtitle: "Signals + AI Worker support",
        items: intelligence,
      },
      {
        id: "cfo",
        title: "CFO Mode",
        subtitle: "Executive clarity + defensibility",
        items: cfo,
      },
    ];
  }, []);

  const [openTier, setOpenTier] = useState<Tier["id"]>("core");

  const { role } = useOrg();
  const canUseIntelligence = hasAccess(role, "intelligence");
  const canUseCfo = hasAccess(role, "cfo");

  const navItemClass = (active: boolean, disabled: boolean) =>
    cx(
      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
      disabled
        ? "opacity-50 cursor-not-allowed text-muted-foreground"
        : active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <aside
      className={cx(
        "sticky top-0 h-screen shrink-0 border-r border-border bg-background flex flex-col",
        isCollapsed ? "w-[84px]" : "w-[280px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div
          className={cx(
            "flex items-center gap-3",
            isCollapsed && "justify-center w-full",
          )}
        >
          <div className="h-9 w-9 rounded-xl border border-border bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">R</span>
          </div>

          {!isCollapsed && (
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">ReconAI</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          className={cx(
            "ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-accent transition",
            isCollapsed && "hidden",
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-accent transition"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tiers */}
      <div
        className={cx(
          "px-3 py-4 space-y-2 flex-1 overflow-y-auto",
          isCollapsed && "px-2",
        )}
      >
        {tiers.map((tier) => {
          const isOpen = openTier === tier.id;
          const anyActive = tier.items.some((it) =>
            isActive(pathname, it.href),
          );

          return (
            <div
              key={tier.id}
              className="rounded-2xl border border-border bg-card/40"
            >
              <button
                type="button"
                onClick={() => setOpenTier(tier.id)}
                className={cx(
                  "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-2xl hover:bg-accent transition",
                  anyActive && "bg-primary/5",
                )}
              >
                <div
                  className={cx(
                    "flex items-center gap-3",
                    isCollapsed && "justify-center w-full",
                  )}
                >
                  <div className="h-9 w-9 rounded-xl border border-border bg-background flex items-center justify-center">
                    {tier.id === "core" ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : tier.id === "intelligence" ? (
                      <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="text-left">
                      <div className="text-sm font-semibold">{tier.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {tier.subtitle}
                      </div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-muted-foreground transition",
                      isOpen && "rotate-180",
                    )}
                  />
                )}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-2 space-y-1">
                      {tier.items.map((item) => {
                        const active = isActive(pathname, item.href);
                        const Icon = item.icon;
                        const disabled =
                          (tier.id === "intelligence" && !canUseIntelligence) ||
                          (tier.id === "cfo" && !canUseCfo);

                        if (disabled) {
                          return (
                            <div
                              key={item.href}
                              className={navItemClass(active, true)}
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1">{item.name}</span>
                              <Lock className="h-4 w-4 opacity-70" />
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={navItemClass(active, false)}
                          >
                            <Icon
                              className={cx(
                                "h-4 w-4",
                                active
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-foreground",
                              )}
                            />
                            <span className="flex-1">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed mode: show only icons */}
              {isCollapsed && (
                <div className="px-1 pb-2 grid grid-cols-1 gap-1">
                  {tier.items.slice(0, 4).map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    const disabled =
                      (tier.id === "intelligence" && !canUseIntelligence) ||
                      (tier.id === "cfo" && !canUseCfo);

                    if (disabled) {
                      return (
                        <div
                          key={item.href}
                          className="h-10 w-full inline-flex items-center justify-center rounded-xl border border-border bg-background opacity-50 cursor-not-allowed"
                          aria-label={item.name}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cx(
                          "h-10 w-full inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-accent transition",
                          active && "bg-primary/10 border-primary/40",
                        )}
                        aria-label={item.name}
                      >
                        <Icon
                          className={cx(
                            "h-4 w-4",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-background p-3">
        {!isCollapsed && (
          <div className="mb-3 rounded-2xl border border-border bg-card p-3">
            <div className="text-sm font-semibold">
              {user?.fullName ?? "Signed in"}
            </div>
            <div className="text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </div>
          </div>
        )}

        <div className={cx("grid gap-2", isCollapsed && "gap-1")}>
          <Link
            href="/settings"
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition",
              isCollapsed && "justify-center",
            )}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            {!isCollapsed && <span>Settings</span>}
          </Link>

          <Link
            href="/support"
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition",
              isCollapsed && "justify-center",
            )}
          >
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
            {!isCollapsed && <span>Support</span>}
          </Link>

          <button
            type="button"
            onClick={() => clerk.signOut({ redirectUrl: "/" })}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition",
              isCollapsed && "justify-center",
            )}
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
