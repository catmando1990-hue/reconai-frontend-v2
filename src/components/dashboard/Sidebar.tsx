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
} from "lucide-react";
import { useState, useEffect } from "react";

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
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

export function Sidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { signOut } = useClerk();
  const activeSection = getActiveSection(pathname);
  const [expanded, setExpanded] = useState<string>(activeSection);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Update expanded section when navigating
  useEffect(() => {
    setExpanded(getActiveSection(pathname));
  }, [pathname]);

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/50 flex flex-col">
      {/* Logo / Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">ReconAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
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
                    "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
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
                  <div className="mt-1 ml-4 pl-3 border-l border-border space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={[
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                            childActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          ].join(" ")}
                        >
                          <ChildIcon className="h-4 w-4" />
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
      <div className="border-t border-border p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          Back to Home
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
