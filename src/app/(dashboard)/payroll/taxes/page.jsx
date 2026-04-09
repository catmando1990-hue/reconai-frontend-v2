"use client";

import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  HandCoins,
  Landmark,
  MapPin,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/payroll/PayrollTaxes.css";

const taxKpis = [
  {
    label: "Federal Withholding",
    value: "$892,400",
    sub: "YTD",
    icon: Landmark,
    change: "+5.1%",
  },
  {
    label: "State Taxes",
    value: "$234,600",
    sub: "YTD",
    icon: Building2,
    change: "+3.8%",
  },
  {
    label: "FICA / Medicare",
    value: "$312,800",
    sub: "YTD",
    icon: HandCoins,
    change: "+4.2%",
  },
  {
    label: "Employer Match",
    value: "$156,400",
    sub: "YTD",
    icon: DollarSign,
    change: "+4.0%",
  },
];

const taxFilings = [
  {
    type: "Federal 941",
    period: "Q1 2026",
    dueDate: "Apr 30, 2026",
    amount: "$297,400",
    status: "upcoming",
  },
  {
    type: "CA DE 9",
    period: "Q1 2026",
    dueDate: "Apr 30, 2026",
    amount: "$68,200",
    status: "upcoming",
  },
  {
    type: "Federal 941",
    period: "Q4 2025",
    dueDate: "Jan 31, 2026",
    amount: "$284,100",
    status: "filed",
  },
  {
    type: "TX TWC Report",
    period: "Q4 2025",
    dueDate: "Jan 31, 2026",
    amount: "$18,900",
    status: "filed",
  },
  {
    type: "NY-1",
    period: "Q4 2025",
    dueDate: "Jan 31, 2026",
    amount: "$42,300",
    status: "filed",
  },
  {
    type: "Federal 940",
    period: "2025 Annual",
    dueDate: "Jan 31, 2026",
    amount: "$44,800",
    status: "filed",
  },
  {
    type: "W-2 / W-3",
    period: "2025 Annual",
    dueDate: "Jan 31, 2026",
    amount: "--",
    status: "filed",
  },
  {
    type: "CA DE 9",
    period: "Q4 2025",
    dueDate: "Jan 31, 2026",
    amount: "$62,500",
    status: "filed",
  },
  {
    type: "FL RT-6",
    period: "Q1 2026",
    dueDate: "Apr 30, 2026",
    amount: "$9,600",
    status: "pending",
  },
];

const jurisdictions = [
  {
    name: "Federal",
    rate: "22.0%",
    withheld: "$892,400",
    employees: 47,
    color: "#10b981",
  },
  {
    name: "California",
    rate: "9.3%",
    withheld: "$112,400",
    employees: 18,
    color: "#3b82f6",
  },
  {
    name: "Texas",
    rate: "0.0%",
    withheld: "$18,900",
    employees: 12,
    color: "#f59e0b",
  },
  {
    name: "New York",
    rate: "8.82%",
    withheld: "$72,600",
    employees: 9,
    color: "#8b5cf6",
  },
  {
    name: "Florida",
    rate: "0.0%",
    withheld: "$30,700",
    employees: 8,
    color: "#ec4899",
  },
];

const upcomingDeadlines = [
  { label: "Federal 941 (Q1)", date: "Apr 30, 2026", daysLeft: 31 },
  { label: "CA DE 9 (Q1)", date: "Apr 30, 2026", daysLeft: 31 },
  { label: "FL RT-6 (Q1)", date: "Apr 30, 2026", daysLeft: 31 },
  { label: "TX TWC (Q1)", date: "Apr 30, 2026", daysLeft: 31 },
  { label: "Federal 941 (Q2)", date: "Jul 31, 2026", daysLeft: 123 },
];

const calendarMonths = [
  { month: "Jan", filings: 4, status: "complete" },
  { month: "Feb", filings: 0, status: "none" },
  { month: "Mar", filings: 0, status: "none" },
  { month: "Apr", filings: 3, status: "upcoming" },
  { month: "May", filings: 0, status: "none" },
  { month: "Jun", filings: 0, status: "none" },
  { month: "Jul", filings: 2, status: "future" },
  { month: "Aug", filings: 0, status: "none" },
  { month: "Sep", filings: 0, status: "none" },
  { month: "Oct", filings: 2, status: "future" },
  { month: "Nov", filings: 0, status: "none" },
  { month: "Dec", filings: 0, status: "none" },
];

export default function PayrollTaxes() {
  const [filingFilter, setFilingFilter] = useState("all");

  const filteredFilings =
    filingFilter === "all"
      ? taxFilings
      : taxFilings.filter((f) => f.status === filingFilter);

  return (
    <div className="payroll-taxes">
      <PolicyBanner
        policy="tax"
        context="payroll-tax-advisory"
        message="Tax data shown is for reference only. Consult a licensed tax professional for filing guidance."
        dismissible
      />

      <header className="taxes-header">
        <div className="header-left">
          <div className="header-title">
            <Receipt size={22} />
            <h1>Taxes</h1>
          </div>
          <p className="header-subtitle">Tax obligations and withholdings</p>
        </div>
      </header>

      <div className="taxes-layout">
        <main className="taxes-main">
          {/* Tax Summary KPIs */}
          <section className="taxes-kpi-grid">
            {taxKpis.map((kpi) => (
              <div key={kpi.label} className="taxes-kpi-card">
                <div className="kpi-icon-wrap">
                  <kpi.icon size={18} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">{kpi.label}</span>
                  <span className="kpi-value">{kpi.value}</span>
                  <span className="kpi-sub">
                    <TrendingUp size={12} />
                    {kpi.change} {kpi.sub}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Tax Filing Table */}
          <section className="taxes-panel">
            <div className="panel-header">
              <FileText size={16} />
              <h2>Tax Filings</h2>
            </div>
            <div className="filing-filters">
              {["all", "filed", "upcoming", "pending"].map((f) => (
                <button
                  key={f}
                  className={`filing-filter ${filingFilter === f ? "active" : ""}`}
                  onClick={() => setFilingFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="filing-table">
              <div className="filing-table-header">
                <span>Filing Type</span>
                <span>Period</span>
                <span>Due Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {filteredFilings.map((filing, idx) => (
                <div key={idx} className="filing-table-row">
                  <span className="filing-type">{filing.type}</span>
                  <span>{filing.period}</span>
                  <span>{filing.dueDate}</span>
                  <span className="filing-amount">{filing.amount}</span>
                  <span className={`filing-status ${filing.status}`}>
                    {filing.status === "filed" && <CheckCircle size={12} />}
                    {filing.status === "upcoming" && <Clock size={12} />}
                    {filing.status === "pending" && <AlertCircle size={12} />}
                    {filing.status}
                  </span>
                </div>
              ))}
              {filteredFilings.length === 0 && (
                <div className="filing-empty">
                  No filings match this filter.
                </div>
              )}
            </div>
          </section>

          {/* Jurisdiction Breakdown */}
          <section className="taxes-panel">
            <div className="panel-header">
              <MapPin size={16} />
              <h2>Tax Jurisdiction Breakdown</h2>
            </div>
            <div className="jurisdiction-list">
              {jurisdictions.map((j) => (
                <div key={j.name} className="jurisdiction-row">
                  <div
                    className="jurisdiction-indicator"
                    style={{ background: j.color }}
                  />
                  <div className="jurisdiction-info">
                    <span className="jurisdiction-name">{j.name}</span>
                    <span className="jurisdiction-employees">
                      {j.employees} employees
                    </span>
                  </div>
                  <div className="jurisdiction-rate">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value">{j.rate}</span>
                  </div>
                  <div className="jurisdiction-amount">
                    <span className="amount-label">Withheld YTD</span>
                    <span className="amount-value">{j.withheld}</span>
                  </div>
                  <div className="jurisdiction-bar-wrap">
                    <div
                      className="jurisdiction-bar"
                      style={{
                        width: `${(parseFloat(j.withheld.replace(/[$,]/g, "")) / 892400) * 100}%`,
                        background: j.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="taxes-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Clock size={14} />
              <h3>Upcoming Deadlines</h3>
            </div>
            <div className="deadlines-list">
              {upcomingDeadlines.map((d, idx) => (
                <div key={idx} className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-label">{d.label}</span>
                    <span className="deadline-date">{d.date}</span>
                  </div>
                  <span
                    className={`deadline-days ${d.daysLeft <= 30 ? "urgent" : ""}`}
                  >
                    {d.daysLeft}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <Calendar size={14} />
              <h3>Filing Calendar</h3>
            </div>
            <div className="filing-calendar">
              {calendarMonths.map((m) => (
                <div key={m.month} className={`calendar-month ${m.status}`}>
                  <span className="calendar-month-label">{m.month}</span>
                  {m.filings > 0 && (
                    <span className="calendar-month-count">{m.filings}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="calendar-legend">
              <span className="legend-item">
                <span className="legend-dot complete" /> Filed
              </span>
              <span className="legend-item">
                <span className="legend-dot upcoming" /> Upcoming
              </span>
              <span className="legend-item">
                <span className="legend-dot future" /> Future
              </span>
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <DollarSign size={14} />
              <h3>YTD Summary</h3>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span className="summary-label">Total Tax Liability</span>
                <span className="summary-value">$1,596,200</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Employer Portion</span>
                <span className="summary-value">$469,200</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Employee Portion</span>
                <span className="summary-value">$1,127,000</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Filings Complete</span>
                <span className="summary-value">6 / 9</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
