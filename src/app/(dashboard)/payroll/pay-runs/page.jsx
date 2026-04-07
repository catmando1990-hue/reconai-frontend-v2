"use client";

import {
  Calendar,
  CalendarClock,
  CheckCircle,
  Clock,
  CreditCard,
  FileEdit,
  Loader,
  Plus,
  Users,
} from 'lucide-react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/payroll/PayrollPayRuns.css';

const payRuns = [
  {
    id: 'PR-2026-06',
    period: 'Mar 16 – Mar 29, 2026',
    payDate: 'Mar 29, 2026',
    employees: 47,
    grossPay: '$192,600',
    netPay: '$148,340',
    status: 'completed',
  },
  {
    id: 'PR-2026-05',
    period: 'Mar 2 – Mar 15, 2026',
    payDate: 'Mar 15, 2026',
    employees: 47,
    grossPay: '$192,600',
    netPay: '$148,120',
    status: 'completed',
  },
  {
    id: 'PR-2026-04',
    period: 'Feb 16 – Mar 1, 2026',
    payDate: 'Mar 1, 2026',
    employees: 46,
    grossPay: '$189,250',
    netPay: '$145,780',
    status: 'completed',
  },
  {
    id: 'PR-2026-07',
    period: 'Mar 30 – Apr 12, 2026',
    payDate: 'Apr 12, 2026',
    employees: 47,
    grossPay: '$193,100',
    netPay: '$148,720',
    status: 'processing',
  },
  {
    id: 'PR-2026-08',
    period: 'Apr 13 – Apr 26, 2026',
    payDate: 'Apr 26, 2026',
    employees: 47,
    grossPay: '$193,100',
    netPay: '$148,720',
    status: 'draft',
  },
  {
    id: 'PR-2026-09',
    period: 'Apr 27 – May 10, 2026',
    payDate: 'May 10, 2026',
    employees: 47,
    grossPay: '$193,100',
    netPay: '$148,720',
    status: 'scheduled',
  },
];

const statusConfig = {
  completed: { bg: '#dcfce7', color: '#15803d', icon: CheckCircle, label: 'Completed' },
  processing: { bg: '#dbeafe', color: '#2563eb', icon: Loader, label: 'Processing' },
  draft: { bg: '#fef3c7', color: '#b45309', icon: FileEdit, label: 'Draft' },
  scheduled: { bg: '#f1f5f9', color: '#64748b', icon: CalendarClock, label: 'Scheduled' },
};

export default function PayrollPayRuns() {
  return (
    <div className="payroll-payruns">
      <PolicyBanner
        policy="general"
        context="payrun-advisory"
        message="Pay run data shown is for planning purposes. Always verify totals with your payroll provider before approving."
        dismissible
      />

      <div className="payruns-layout">
        <main className="payruns-main">
          {/* Header */}
          <header className="payruns-header">
            <div className="header-left">
              <div className="header-title">
                <CreditCard size={22} />
                <h1>Pay Runs</h1>
              </div>
              <p className="header-subtitle">Payroll processing cycles</p>
            </div>
            <button className="payruns-new-btn">
              <Plus size={16} />
              New Pay Run
            </button>
          </header>

          {/* Pay Runs Table */}
          <section className="payruns-panel">
            <div className="payruns-table">
              <div className="payruns-table-header">
                <span>Run ID</span>
                <span>Period</span>
                <span>Pay Date</span>
                <span>Employees</span>
                <span>Gross Pay</span>
                <span>Net Pay</span>
                <span>Status</span>
              </div>
              {payRuns.map((run) => {
                const cfg = statusConfig[run.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={run.id} className="payruns-table-row">
                    <span className="run-id">{run.id}</span>
                    <span className="run-period">{run.period}</span>
                    <span>{run.payDate}</span>
                    <span className="run-employees">
                      <Users size={12} />
                      {run.employees}
                    </span>
                    <span className="run-gross">{run.grossPay}</span>
                    <span className="run-net">{run.netPay}</span>
                    <span
                      className="run-status-badge"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="payruns-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Calendar size={14} />
              <h3>Next Pay Run</h3>
            </div>
            <div className="next-payrun-card">
              <div className="next-payrun-id">PR-2026-07</div>
              <div className="next-payrun-detail">
                <span className="next-label">Period</span>
                <span className="next-value">Mar 30 – Apr 12, 2026</span>
              </div>
              <div className="next-payrun-detail">
                <span className="next-label">Pay Date</span>
                <span className="next-value">Apr 12, 2026</span>
              </div>
              <div className="next-payrun-detail">
                <span className="next-label">Employees</span>
                <span className="next-value">47</span>
              </div>
              <div className="next-payrun-detail">
                <span className="next-label">Est. Gross</span>
                <span className="next-value">$193,100</span>
              </div>
              <div className="next-payrun-status">
                <Loader size={12} />
                Processing
              </div>
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <Clock size={14} />
              <h3>Pay Schedule</h3>
            </div>
            <div className="schedule-list">
              <div className="schedule-row">
                <span className="schedule-label">Frequency</span>
                <span className="schedule-value">Bi-weekly</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-label">Pay Day</span>
                <span className="schedule-value">Friday</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-label">Period Length</span>
                <span className="schedule-value">14 days</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-label">Runs per Year</span>
                <span className="schedule-value">26</span>
              </div>
              <div className="schedule-row">
                <span className="schedule-label">Next Deadline</span>
                <span className="schedule-value">Apr 10, 2026</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
