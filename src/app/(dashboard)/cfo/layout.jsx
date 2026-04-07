"use client";

import CFOChat from "@/components/recon/CFOChat";
import "@/styles/cfo/CFOLayout.css";
import {
  Brain,
  Building2,
  FileText,
  LayoutDashboard,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const cfoTabs = [
  { name: "Overview", path: "/cfo", icon: LayoutDashboard, end: true },
  { name: "Executive Summary", path: "/cfo/executive-summary", icon: FileText },
  { name: "Cash Flow", path: "/cfo/cash-flow", icon: Wallet },
  { name: "Intelligence", path: "/cfo/intelligence", icon: Brain },
  { name: "Forecasting", path: "/cfo/forecasting", icon: TrendingUp },
  { name: "Compliance", path: "/cfo/compliance", icon: Shield },
  { name: "Connections", path: "/cfo/connections", icon: Building2 },
];

export default function CFOLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="cfo-page">
      <div className="cfo-layout">
        <div className="cfo-main">
          {/* Sub-tabs Navigation */}
          <div className="cfo-tabs">
            {cfoTabs.map((tab) => {
              const isActive = tab.end
                ? pathname === tab.path
                : pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  className={`cfo-tab ${isActive ? "active" : ""}`}
                >
                  <tab.icon size={18} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="cfo-content">{children}</div>
        </div>

        {/* CFO Intelligence Sidebar */}
        <div className="cfo-chat">
          <CFOChat />
        </div>
      </div>
    </div>
  );
}
