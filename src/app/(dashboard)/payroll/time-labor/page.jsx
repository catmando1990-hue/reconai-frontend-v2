"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/payroll/PayrollTimeLabor.css";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle,
  Clock,
  ClockArrowUp,
  Palmtree,
  Timer,
  Users,
} from "lucide-react";

const timeSummary = [
  { label: "Total Hours This Period", value: "3,848", icon: Clock },
  { label: "Overtime Hours", value: "124", icon: Timer },
  { label: "PTO Hours Used", value: "186", icon: Palmtree },
  { label: "Avg Hours/Employee", value: "38.5", icon: Users },
];

const departmentAllocation = [
  { department: "Engineering", hours: 1540, percentage: 40 },
  { department: "Sales", hours: 770, percentage: 20 },
  { department: "Marketing", hours: 578, percentage: 15 },
  { department: "Design", hours: 462, percentage: 12 },
  { department: "Operations", hours: 308, percentage: 8 },
  { department: "HR & Admin", hours: 190, percentage: 5 },
];

const recentTimeEntries = [
  {
    id: 1,
    employee: "Sarah Chen",
    date: "Mar 28, 2026",
    hours: 8.5,
    type: "Regular",
    status: "approved",
  },
  {
    id: 2,
    employee: "Marcus Johnson",
    date: "Mar 28, 2026",
    hours: 10.0,
    type: "Overtime",
    status: "approved",
  },
  {
    id: 3,
    employee: "Priya Patel",
    date: "Mar 27, 2026",
    hours: 8.0,
    type: "Regular",
    status: "approved",
  },
  {
    id: 4,
    employee: "James Wilson",
    date: "Mar 27, 2026",
    hours: 8.0,
    type: "PTO",
    status: "approved",
  },
  {
    id: 5,
    employee: "Ana Rodriguez",
    date: "Mar 27, 2026",
    hours: 9.5,
    type: "Overtime",
    status: "pending",
  },
  {
    id: 6,
    employee: "David Kim",
    date: "Mar 26, 2026",
    hours: 8.0,
    type: "Regular",
    status: "approved",
  },
  {
    id: 7,
    employee: "Lisa Thompson",
    date: "Mar 26, 2026",
    hours: 8.0,
    type: "PTO",
    status: "pending",
  },
];

const policySummary = [
  { label: "Standard Work Week", value: "40 hours" },
  { label: "Overtime Rate", value: "1.5x base pay" },
  { label: "PTO Accrual", value: "15 days/year" },
  { label: "Pay Period", value: "Semi-monthly" },
];

export default function PayrollTimeLabor() {
  return (
    <div className="payroll-time-labor">
      <PolicyBanner
        policy="general"
        context="time-labor-advisory"
        message="Time and labor data is for tracking purposes. Verify entries with your timekeeping system before payroll processing."
        dismissible
      />

      <header className="time-labor-header">
        <div className="header-left">
          <div className="header-title">
            <Clock size={22} />
            <h1>Time & Labor</h1>
          </div>
          <p className="header-subtitle">Hours tracking and labor allocation</p>
        </div>
      </header>

      <div className="time-labor-layout">
        <main className="time-labor-main">
          {/* Time Tracking Summary */}
          <section className="time-kpi-grid">
            {timeSummary.map((kpi) => (
              <div key={kpi.label} className="time-kpi-card">
                <div className="kpi-icon-wrap">
                  <kpi.icon size={18} />
                </div>
                <div className="kpi-content">
                  <span className="kpi-label">{kpi.label}</span>
                  <span className="kpi-value">{kpi.value}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Time Allocation by Department */}
          <section className="payroll-panel">
            <div className="panel-header">
              <BarChart3 size={16} />
              <h2>Time Allocation by Department</h2>
            </div>
            <div className="department-allocation">
              {departmentAllocation.map((dept) => (
                <div key={dept.department} className="allocation-row">
                  <div className="allocation-info">
                    <span className="allocation-dept">{dept.department}</span>
                    <span className="allocation-hours">
                      {dept.hours.toLocaleString()} hrs
                    </span>
                  </div>
                  <div className="allocation-bar-track">
                    <div
                      className="allocation-bar-fill"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                  <span className="allocation-pct">{dept.percentage}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Time Entries */}
          <section className="payroll-panel">
            <div className="panel-header">
              <CalendarClock size={16} />
              <h2>Recent Time Entries</h2>
            </div>
            <div className="time-entries-table">
              <div className="table-header">
                <span>Employee</span>
                <span>Date</span>
                <span>Hours</span>
                <span>Type</span>
                <span>Status</span>
              </div>
              {recentTimeEntries.map((entry) => (
                <div key={entry.id} className="table-row">
                  <span className="entry-name">{entry.employee}</span>
                  <span>{entry.date}</span>
                  <span className="entry-hours">{entry.hours}</span>
                  <span className={`entry-type ${entry.type.toLowerCase()}`}>
                    {entry.type}
                  </span>
                  <span className={`entry-status ${entry.status}`}>
                    {entry.status === "approved" ? (
                      <CheckCircle size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="time-labor-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <BookOpen size={14} />
              <h3>Policy Summary</h3>
            </div>
            <div className="summary-list">
              {policySummary.map((item) => (
                <div key={item.label} className="summary-row">
                  <span className="summary-label">{item.label}</span>
                  <span className="summary-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <ClockArrowUp size={14} />
              <h3>Period Overview</h3>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span className="summary-label">Current Period</span>
                <span className="summary-value">Mar 16 - 31</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Days Remaining</span>
                <span className="summary-value">1 day</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Pending Approvals</span>
                <span className="summary-value pending-count">2</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Utilization Rate</span>
                <span className="summary-value">96.2%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
