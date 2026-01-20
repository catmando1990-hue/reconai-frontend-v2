"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type NavSection = {
  label: string;
  items: NavItem[];
};

const CORE_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", href: "/home", icon: LayoutDashboard },
      { label: "Connect Bank", href: "/connect-bank", icon: Landmark },
    ],
  },
  {
    label: "Core",
    href: "/core/overview",
    icon: Layers,
    children: [
      { label: "Overview", href: "/core/overview", icon: Layers },
      { label: "Accounts", href: "/accounts", icon: Landmark },
      {
        label: "Transactions",
        href: "/core/transactions",
        icon: ArrowLeftRight,
      },
      { label: "Reports", href: "/core/reports", icon: FileText },
    ],
  },
  {
    label: "Intelligence",
    href: "/intelligence/insights",
    icon: Sparkles,
    children: [
      { label: "Insights", href: "/intelligence/insights", icon: Sparkles },
      { label: "Alerts", href: "/intelligence/alerts", icon: Receipt },
      { label: "AI Worker", href: "/intelligence/ai-worker", icon: Plane },
    ],
  },
  {
    label: "CFO Mode",
    href: "/cfo/overview",
    icon: LineChart,
    children: [
      { label: "Overview", href: "/cfo/overview", icon: LineChart },
      {
        label: "Executive Summary",
        href: "/cfo/executive-summary",
        icon: FileText,
      },
      {
        label: "Compliance View",
        href: "/cfo/compliance",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Invoicing",
    href: "/invoicing",
    icon: Receipt,
    children: [
      { label: "Invoices", href: "/invoicing", icon: Receipt },
      { label: "New Invoice", href: "/invoicing/new", icon: FileText },
      { label: "A/R Aging", href: "/ar", icon: ArrowLeftRight },
      { label: "Settings", href: "/invoicing/settings", icon: Settings },
      { label: "Template Preview", href: "/invoicing/preview", icon: FileText },
    ],
  },
];

const SETTINGS_NAV: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    children: [{ label: "Profile", href: "/settings", icon: User }],
  },
];

function getActiveSection(pathname: string): string {
  if (pathname.startsWith("/core")) return "Core";
  if (pathname.startsWith("/accounts")) return "Core";
  if (pathname.startsWith("/transactions")) return "Core";
  if (pathname.startsWith("/intelligence")) return "Intelligence";
  if (pathname.startsWith("/cfo")) return "CFO Mode";
  if (pathname.startsWith("/invoicing")) return "Invoicing";
  if (pathname.startsWith("/ar")) return "Invoicing";
  if (pathname.startsWith("/govcon")) return "GovCon";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useUserProfile();

  const activeSection = getActiveSection(pathname);
  const [expanded, setExpanded] = useState<string>(activeSection);

  const showGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  const sections = useMemo((): NavSection[] => {
    const coreItems = [...CORE_NAV];

    if (showGovCon) {
      const govConItem: NavItem = {
        label: "GovCon",
        href: "/govcon",
        icon: Building2,
        children: [
          { label: "Overview", href: "/govcon", icon: Building2 },
          { label: "Contracts", href: "/govcon/contracts", icon: FileText },
          { label: "Timekeeping", href: "/govcon/timekeeping", icon: Layers },
          { label: "Indirects", href: "/govcon/indirects", icon: Layers },
          {
            label: "Reconciliation",
            href: "/govcon/reconciliation",
            icon: ArrowLeftRight,
          },
          { label: "Audit Trail", href: "/govcon/audit", icon: ShieldCheck },
          { label: "SF-1408", href: "/govcon/sf-1408", icon: ShieldCheck },
        ],
      };

      // Insert GovCon after CFO Mode to keep sectioning coherent.
      const cfoIndex = coreItems.findIndex((i) => i.label === "CFO Mode");
      if (cfoIndex !== -1) coreItems.splice(cfoIndex + 1, 0, govConItem);
      else coreItems.push(govConItem);
    }

    return [
      { label: "Workspace", items: coreItems },
      { label: "Account", items: SETTINGS_NAV },
    ];
  }, [showGovCon]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Always expand the active section on navigation; prevents "lost" nested nav states.
  useEffect(() => {
    setExpanded(activeSection);
  }, [activeSection]);

  return (
    <aside className="relative w-64 shrink-0 flex flex-col h-full overflow-hidden">
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-r border-border" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
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

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {section.label}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isExpanded = expanded === item.label;
                  const isActive = activeSection === item.label;

                  const panelId = `nav-${item.label.replace(/\s+/g, "-").toLowerCase()}`;

                  return (
                    <div key={item.label}>
                      <div
                        className={[
                          "group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border",
                          isActive
                            ? "bg-primary/10 text-foreground border-primary/15"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border-transparent",
                        ].join(" ")}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 min-w-0 flex-1"
                          aria-current={isActive ? "page" : undefined}
                        >
                          <div
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
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
                          <span className="truncate">{item.label}</span>
                        </Link>

                        {item.children && item.children.length > 0 && (
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpanded(isExpanded ? "" : item.label);
                            }}
                            className="ml-2 inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <ChevronDown
                              className={[
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded ? "rotate-180" : "",
                              ].join(" ")}
                            />
                          </button>
                        )}
                      </div>

                      {item.children && (
                        <div
                          id={panelId}
                          style={{
                            position: "relative",
                            top: "auto",
                            left: "auto",
                          }}
                          className={[
                            "grid transition-[grid-template-rows] duration-200 ease-out",
                            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          ].join(" ")}
                        >
                          <div className="overflow-hidden">
                            <div className="mt-1 ml-5 pl-4 border-l border-border/50 space-y-1">
                              {item.children.map((child) => {
                                const ChildIcon = child.icon;
                                const childActive = isRouteActive(
                                  pathname,
                                  child.href,
                                );

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    aria-current={
                                      childActive ? "page" : undefined
                                    }
                                    className={[
                                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors border",
                                      childActive
                                        ? "bg-primary/10 text-foreground border-primary/15"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border-transparent",
                                    ].join(" ")}
                                  >
                                    <ChildIcon
                                      className={[
                                        "h-4 w-4",
                                        childActive ? "text-primary" : "",
                                      ].join(" ")}
                                    />
                                    <span className="truncate">
                                      {child.label}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-border/40" />
            </div>
          ))}
        </nav>

        <div className="border-t border-border/50 p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Link
              href="/"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-colors"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-border/50 bg-card/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-border transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground bg-card/50 border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
