"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import "@/styles/payroll/PayrollOverview.css";

const kpis = [
  { label: "Total Headcount", value: "47", change: "+3", trend: "up", icon: Users },
  { label: "Monthly Payroll", value: "$385,200", change: "+4.2%", trend: "up", icon: DollarSign },
  { label: "Avg. Hours/Week", value: "38.5", change: "-0.3", trend: "down", icon: Clock },
  { label: "Next Pay Run", value: "Apr 15", change: "16 days", trend: "neutral", icon: CreditCard },
];

const recentPayRuns = [
  { id: "PR-2026-06", date: "Mar 15, 2026", amount: "$385,200", employees: 47, status: "completed" },
  { id: "PR-2026-05", date: "Mar 1, 2026", amount: "$382,100", employees: 46, status: "completed" },
  { id: "PR-2026-04", date: "Feb 15, 2026", amount: "$378,500", employees: 45, status: "completed" },
];

const complianceItems = [
  { label: "Tax Filings", status: "current", detail: "Q1 2026 filed" },
  { label: "W-2 Distribution", status: "current", detail: "All issued" },
  { label: "1099 Filing", status: "current", detail: "12 contractors" },
  { label: "State Registrations", status: "attention", detail: "1 pending renewal" },
];

const quickLinks = [
  { label: "Run Payroll", path: "/payroll/pay-runs", icon: CreditCard },
  { label: "Add Employee", path: "/payroll/people", icon: Users },
  { label: "View Reports", path: "/payroll/compliance", icon: FileText },
  { label: "Tax Summary", path: "/payroll/taxes", icon: Receipt },
];

function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp size={12} />;
  if (trend === "down") return <TrendingDown size={12} />;
  return null;
}

export default function PayrollOverview() {
  return (
    <div className="payroll-overview">
      <div className="payroll-overview-layout">
        <main className="payroll-overview-main">
          <section className="payroll-kpi-grid">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="payroll-kpi-card">
                  <div className="kpi-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <div className="kpi-content">
                    <span className="kpi-label">{kpi.label}</span>
                    <span className="kpi-value">{kpi.value}</span>
                    <span className={`kpi-change ${kpi.trend}`}>
                      <TrendIcon trend={kpi.trend} />
                      {kpi.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="payroll-panel">
            <div className="panel-header">
              <CreditCard size={16} />
              <h2>Recent Pay Runs</h2>
            </div>
            <div className="pay-runs-table">
              <div className="table-header">
                <span>Run ID</span>
                <span>Date</span>
                <span>Employees</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {recentPayRuns.map((run) => (
                <div key={run.id} className="table-row">
                  <span className="run-id">{run.id}</span>
                  <span>{run.date}</span>
                  <span>{run.employees}</span>
                  <span className="run-amount">{run.amount}</span>
                  <span className={`run-status ${run.status}`}>
                    <CheckCircle size={12} />
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/payroll/pay-runs" className="panel-view-all">
              View all pay runs <ArrowRight size={14} />
            </Link>
          </section>

          <section className="payroll-panel">
            <div className="panel-header">
              <FileText size={16} />
              <h2>Compliance Status</h2>
            </div>
            <div className="compliance-grid">
              {complianceItems.map((item) => (
                <div key={item.label} className={`compliance-item ${item.status}`}>
                  <div className="compliance-icon">
                    {item.status === "current" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                  </div>
                  <div className="compliance-info">
                    <span className="compliance-label">{item.label}</span>
                    <span className="compliance-detail">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="payroll-overview-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <ArrowRight size={14} />
              <h3>Quick Links</h3>
            </div>
            <div className="quick-links">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.label} href={link.path} className="quick-link">
                    <Icon size={14} />
                    <span>{link.label}</span>
                    <ArrowRight size={12} />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <Users size={14} />
              <h3>Workforce Summary</h3>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span className="summary-label">Full-Time</span>
                <span className="summary-value">35</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Part-Time</span>
                <span className="summary-value">12</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Contractors</span>
                <span className="summary-value">8</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">States</span>
                <span className="summary-value">5</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
