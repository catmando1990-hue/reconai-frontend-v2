"use client";

import AIChat from "@/components/recon/AIChat";
import "@/styles/core/CoreLayout.css";
import {
  ArrowLeftRight,
  Brain,
  Building2,
  FileBarChart,
  FileCheck,
  FileText,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const coreTabs = [
  { name: "Overview", path: "/core", icon: LayoutDashboard, end: true },
  { name: "Transactions", path: "/core/transactions", icon: ArrowLeftRight },
  { name: "Accounts", path: "/core/accounts", icon: Wallet },
  { name: "Reports", path: "/core/reports", icon: FileBarChart },
  { name: "Statements", path: "/core/statements", icon: FileText },
  { name: "Bank Connections", path: "/core/bank-connections", icon: Building2 },
  { name: "Tax Documents", path: "/core/tax-documents", icon: FileCheck },
  { name: "Intelligence", path: "/core/intelligence", icon: Brain },
];

export default function CoreLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="core-page">
      <div className="core-layout">
        <div className="core-main">
          {/* Sub-tabs Navigation */}
          <div className="core-tabs">
            {coreTabs.map((tab) => {
              const isActive = tab.end
                ? pathname === tab.path
                : pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  className={`core-tab ${isActive ? "active" : ""}`}
                >
                  <tab.icon size={18} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="core-content">{children}</div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="core-chat">
          <AIChat />
        </div>
      </div>
    </div>
  );
}
