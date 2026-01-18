"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  LineChart,
  Settings,
  ChevronDown,
  Landmark,
  Receipt,
  ArrowLeftRight,
  Brain,
  Plane,
  FileText,
  ShieldCheck,
  User,
  LogOut,
  Home,
  HelpCircle,
  Building2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useUserProfile } from "@/lib/user-profile-context";
import { hasGovConEntitlement } from "@/lib/entitlements";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Connect Bank", href: "/connect-bank", icon: Landmark },
    ],
  },
  {
    label: "Core",
    href: "/dashboard/core",
    icon: Layers,
    children: [
      { label: "Overview", href: "/dashboard/core", icon: Layers },
      { label: "Accounts", href: "/dashboard/core/accounts", icon: Landmark },
      {
        label: "Transactions",
        href: "/dashboard/core/transactions",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Intelligence",
    href: "/dashboard/intelligence",
    icon: Sparkles,
    children: [
      { label: "Overview", href: "/dashboard/intelligence", icon: Sparkles },
      {
        label: "Expense Intelligence",
        href: "/dashboard/intelligence/expenses",
        icon: Receipt,
      },
      {
        label: "Travel Signals",
        href: "/dashboard/intelligence/travel",
        icon: Plane,
      },
    ],
  },
  {
    label: "CFO Mode",
    href: "/dashboard/cfo",
    icon: LineChart,
    children: [
      { label: "Overview", href: "/dashboard/cfo", icon: LineChart },
      {
        label: "Executive Summary",
        href: "/dashboard/cfo/summary",
        icon: FileText,
      },
      {
        label: "Compliance View",
        href: "/dashboard/cfo/compliance",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Invoicing",
    href: "/dashboard/invoicing",
    icon: Receipt,
    children: [
      { label: "Invoices", href: "/dashboard/invoicing", icon: Receipt },
      { label: "New Invoice", href: "/dashboard/invoicing/new", icon: FileText },
      { label: "A/R Aging", href: "/dashboard/ar", icon: ArrowLeftRight },
      { label: "Settings", href: "/dashboard/invoicing/settings", icon: Settings },
      { label: "Template Preview", href: "/dashboard/invoicing/preview", icon: FileText },
    ],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    children: [{ label: "Profile", href: "/dashboard/settings", icon: User }],
  },
];

function getActiveSection(pathname: string): string {
  if (pathname.startsWith("/dashboard/core")) return "Core";
  if (pathname.startsWith("/dashboard/intelligence")) return "Intelligence";
  if (pathname.startsWith("/dashboard/cfo")) return "CFO Mode";
  if (pathname.startsWith("/dashboard/invoicing")) return "Invoicing";
  if (pathname.startsWith("/dashboard/ar")) return "Invoicing";
  if (pathname.startsWith("/dashboard/govcon")) return "GovCon";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

export function Sidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useUserProfile();
  const activeSection = getActiveSection(pathname);
  const [expanded, setExpanded] = useState<string>(activeSection);

  // Check GovCon entitlement from user profile tiers (admin/owner bypass)
  const showGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  // Build nav items dynamically based on entitlements
  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];

    // Insert GovCon before Settings if user has entitlement
    if (showGovCon) {
      const settingsIndex = items.findIndex(
        (item) => item.label === "Settings",
      );
      const govConItem: NavItem = {
        label: "GovCon",
        href: "/dashboard/govcon",
        icon: Building2,
        children: [
          { label: "Overview", href: "/dashboard/govcon", icon: Building2 },
          {
            label: "Contracts",
            href: "/dashboard/govcon/contracts",
            icon: FileText,
          },
          {
            label: "Timekeeping",
            href: "/dashboard/govcon/timekeeping",
            icon: Layers,
          },
          {
            label: "Indirects",
            href: "/dashboard/govcon/indirects",
            icon: Layers,
          },
          {
            label: "Reconciliation",
            href: "/dashboard/govcon/reconciliation",
            icon: ArrowLeftRight,
          },
          {
            label: "Audit Trail",
            href: "/dashboard/govcon/audit",
            icon: ShieldCheck,
          },
        ],
      };
      if (settingsIndex !== -1) {
        items.splice(settingsIndex, 0, govConItem);
      } else {
        items.push(govConItem);
      }
    }

    return items;
  }, [showGovCon]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Update expanded section when navigating
  useEffect(() => {
    setExpanded(getActiveSection(pathname));
  }, [pathname]);

  return (
    <aside className="relative w-64 shrink-0 flex flex-col h-full overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-r border-border" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="h-16 flex items-center px-5 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center transition-all group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground tracking-tight">
                ReconAI
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Financial Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expanded === item.label;
              const isActive = activeSection === item.label;

              return (
                <div key={item.label}>
                  {/* Parent item */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? "" : item.label)}
                    className={[
                      "group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary/10"
                            : "bg-card/50 group-hover:bg-accent",
                        ].join(" ")}
                      >
                        <Icon
                          className={[
                            "h-4 w-4 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          ].join(" ")}
                        />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.children && item.children.length > 0 && (
                      <ChevronDown
                        className={[
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    )}
                  </button>

                  {/* Children */}
                  {item.children && isExpanded && (
                    <div className="mt-1 ml-5 pl-4 border-l border-border/50 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={[
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              childActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                            ].join(" ")}
                          >
                            <ChildIcon
                              className={[
                                "h-4 w-4",
                                childActive ? "text-primary" : "",
                              ].join(" ")}
                            />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4 space-y-2">
          {/* Quick links */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Link
              href="/"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-all"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-all"
              title="Help & Support"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground bg-card/50 border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
