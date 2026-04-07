"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Shield,
  User
} from 'lucide-react';
import { useState } from 'react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/payroll/PayrollCompliance.css';

const checklistItems = [
  { label: 'Federal Tax Deposits', status: 'compliant', detail: 'All deposits current through Q1 2026' },
  { label: 'State Withholding', status: 'compliant', detail: 'Verified across 5 jurisdictions' },
  { label: 'Workers Comp Insurance', status: 'compliant', detail: 'Policy renewed Jan 2026' },
  { label: 'I-9 Verification', status: 'attention', detail: '2 pending verifications' },
  { label: 'FLSA Overtime Classification', status: 'compliant', detail: '47 employees reviewed' },
  { label: 'State Registration - Oregon', status: 'action-required', detail: 'Registration expired — renewal required' },
];

const auditLog = [
  { date: 'Mar 28, 2026', action: 'Quarterly compliance review completed', user: 'Sarah Chen', status: 'completed' },
  { date: 'Mar 22, 2026', action: 'Workers Comp certificate uploaded', user: 'David Kim', status: 'completed' },
  { date: 'Mar 15, 2026', action: 'I-9 reverification flagged for 2 employees', user: 'System', status: 'flagged' },
  { date: 'Mar 10, 2026', action: 'FLSA classification audit passed', user: 'Maria Lopez', status: 'completed' },
  { date: 'Mar 02, 2026', action: 'Oregon state registration renewal notice', user: 'System', status: 'action' },
];

const regulatoryCalendar = [
  { month: 'Jan', events: 2, status: 'complete' },
  { month: 'Feb', events: 1, status: 'complete' },
  { month: 'Mar', events: 3, status: 'current' },
  { month: 'Apr', events: 2, status: 'upcoming' },
  { month: 'May', events: 0, status: 'none' },
  { month: 'Jun', events: 1, status: 'future' },
  { month: 'Jul', events: 2, status: 'future' },
  { month: 'Aug', events: 0, status: 'none' },
  { month: 'Sep', events: 1, status: 'future' },
  { month: 'Oct', events: 2, status: 'future' },
  { month: 'Nov', events: 0, status: 'none' },
  { month: 'Dec', events: 1, status: 'future' },
];

const statusIcon = (status) => {
  if (status === 'compliant') return <CheckCircle size={16} />;
  if (status === 'attention') return <AlertCircle size={16} />;
  if (status === 'action-required') return <AlertTriangle size={16} />;
  return null;
};

const logStatusLabel = (status) => {
  if (status === 'completed') return 'Completed';
  if (status === 'flagged') return 'Flagged';
  if (status === 'action') return 'Action Needed';
  return status;
};

export default function PayrollCompliance() {
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const compliantCount = checklistItems.filter(i => i.status === 'compliant').length;
  const totalCount = checklistItems.length;
  const scorePercent = 94;

  return (
    <div className="payroll-compliance">
      <PolicyBanner
        policy="legal"
        context="payroll-compliance-advisory"
        message="Compliance information is for internal tracking only. Consult legal counsel for regulatory guidance."
        dismissible
      />

      <header className="compliance-header">
        <div className="header-left">
          <div className="header-title"><Shield size={22} /><h1>Compliance</h1></div>
          <p className="header-subtitle">Regulatory compliance and controls</p>
        </div>
      </header>

      <div className="compliance-layout">
        <main className="compliance-main">
          {/* Compliance Checklist */}
          <section className="compliance-panel">
            <div className="panel-header">
              <CheckCircle size={16} />
              <h2>Compliance Checklist</h2>
              <span className="checklist-summary">{compliantCount} of {totalCount} compliant</span>
            </div>
            <div className="checklist-list">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`checklist-item ${item.status} ${selectedChecklist === idx ? 'expanded' : ''}`}
                  onClick={() => setSelectedChecklist(selectedChecklist === idx ? null : idx)}
                >
                  <div className="checklist-item-main">
                    <div className={`checklist-status-icon ${item.status}`}>
                      {statusIcon(item.status)}
                    </div>
                    <div className="checklist-info">
                      <span className="checklist-label">{item.label}</span>
                      <span className="checklist-detail">{item.detail}</span>
                    </div>
                    <span className={`checklist-badge ${item.status}`}>
                      {item.status === 'compliant' && 'Compliant'}
                      {item.status === 'attention' && 'Attention'}
                      {item.status === 'action-required' && 'Action Required'}
                    </span>
                    <ChevronRight size={14} className="checklist-chevron" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Compliance Events / Audit Log */}
          <section className="compliance-panel">
            <div className="panel-header">
              <Activity size={16} />
              <h2>Recent Compliance Events</h2>
            </div>
            <div className="audit-log">
              <div className="audit-log-header">
                <span>Date</span>
                <span>Action</span>
                <span>User</span>
                <span>Status</span>
              </div>
              {auditLog.map((entry, idx) => (
                <div key={idx} className="audit-log-row">
                  <span className="audit-date">{entry.date}</span>
                  <span className="audit-action">{entry.action}</span>
                  <span className="audit-user">
                    <User size={12} />
                    {entry.user}
                  </span>
                  <span className={`audit-status ${entry.status}`}>
                    {entry.status === 'completed' && <CheckCircle size={12} />}
                    {entry.status === 'flagged' && <AlertCircle size={12} />}
                    {entry.status === 'action' && <AlertTriangle size={12} />}
                    {logStatusLabel(entry.status)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="compliance-sidebar">
          {/* Compliance Score */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Shield size={14} />
              <h3>Compliance Score</h3>
            </div>
            <div className="score-display">
              <div className="score-ring">
                <svg viewBox="0 0 100 100" className="score-svg">
                  <circle cx="50" cy="50" r="42" className="score-track" />
                  <circle
                    cx="50" cy="50" r="42"
                    className="score-fill"
                    strokeDasharray={`${scorePercent * 2.64} ${264 - scorePercent * 2.64}`}
                    strokeDashoffset="66"
                  />
                </svg>
                <span className="score-value">{scorePercent}%</span>
              </div>
              <div className="score-breakdown">
                <div className="score-row">
                  <span className="score-dot compliant" />
                  <span className="score-label">Compliant</span>
                  <span className="score-count">{compliantCount}</span>
                </div>
                <div className="score-row">
                  <span className="score-dot attention" />
                  <span className="score-label">Attention</span>
                  <span className="score-count">{checklistItems.filter(i => i.status === 'attention').length}</span>
                </div>
                <div className="score-row">
                  <span className="score-dot action-required" />
                  <span className="score-label">Action Required</span>
                  <span className="score-count">{checklistItems.filter(i => i.status === 'action-required').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Audit */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Calendar size={14} />
              <h3>Next Audit</h3>
            </div>
            <div className="next-audit">
              <div className="audit-date-display">
                <span className="audit-month">APR</span>
                <span className="audit-day">15</span>
                <span className="audit-year">2026</span>
              </div>
              <div className="audit-details">
                <span className="audit-type">Quarterly Internal Audit</span>
                <span className="audit-countdown">
                  <Clock size={12} />
                  16 days away
                </span>
                <span className="audit-scope">Scope: Payroll & Tax Compliance</span>
              </div>
            </div>
          </div>

          {/* Regulatory Calendar */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <FileText size={14} />
              <h3>Regulatory Calendar</h3>
            </div>
            <div className="regulatory-calendar">
              {regulatoryCalendar.map((m) => (
                <div key={m.month} className={`reg-month ${m.status}`}>
                  <span className="reg-month-label">{m.month}</span>
                  {m.events > 0 && <span className="reg-month-count">{m.events}</span>}
                </div>
              ))}
            </div>
            <div className="reg-calendar-legend">
              <span className="legend-item"><span className="legend-dot complete" /> Done</span>
              <span className="legend-item"><span className="legend-dot current" /> Current</span>
              <span className="legend-item"><span className="legend-dot upcoming" /> Upcoming</span>
              <span className="legend-item"><span className="legend-dot future" /> Future</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
