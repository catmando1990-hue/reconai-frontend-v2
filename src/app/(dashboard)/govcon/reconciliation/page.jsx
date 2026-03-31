"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Play,
  XCircle,
} from "lucide-react";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConReconciliation.css";

const reconciliationRuns = [
  {
    date: "Mar 28, 2026",
    type: "Full ICS",
    period: "Q1 2026",
    variancesFound: 3,
    resolved: 0,
    status: "Open",
  },
  {
    date: "Mar 15, 2026",
    type: "Labor",
    period: "Feb 2026",
    variancesFound: 2,
    resolved: 2,
    status: "Resolved",
  },
  {
    date: "Mar 1, 2026",
    type: "Indirect",
    period: "Feb 2026",
    variancesFound: 5,
    resolved: 5,
    status: "Resolved",
  },
  {
    date: "Feb 15, 2026",
    type: "Full ICS",
    period: "Q4 2025",
    variancesFound: 8,
    resolved: 8,
    status: "Resolved",
  },
  {
    date: "Feb 1, 2026",
    type: "Labor",
    period: "Jan 2026",
    variancesFound: 1,
    resolved: 1,
    status: "Resolved",
  },
];

const openVariances = [
  {
    id: 1,
    title: "Labor hours mismatch on FA-8721",
    detail: "2.5 hours unreconciled between timesheet and billing records",
    severity: "High",
    contract: "FA-8721",
  },
  {
    id: 2,
    title: "Overhead rate variance",
    detail: "Q1 actual 46.1% vs provisional 45.2% — exceeds threshold",
    severity: "Medium",
    contract: "All Contracts",
  },
  {
    id: 3,
    title: "Direct material unclassified charge",
    detail: "$1,250 on W912DY — charge lacks proper cost objective assignment",
    severity: "Low",
    contract: "W912DY",
  },
];

const icsSchedules = [
  { code: "Schedule H", name: "Manufacturing", documented: true },
  { code: "Schedule I", name: "Fringe Benefits", documented: true },
  { code: "Schedule J", name: "Indirect", documented: false },
  { code: "Schedule K", name: "Direct Costs", documented: true },
  { code: "Schedule L", name: "Labor", documented: true },
  { code: "Schedule O", name: "Overhead", documented: false },
];

function getTypeBadgeClass(type) {
  switch (type) {
    case "Full ICS":
      return "gcr-type-badge gcr-type-full-ics";
    case "Labor":
      return "gcr-type-badge gcr-type-labor";
    case "Indirect":
      return "gcr-type-badge gcr-type-indirect";
    default:
      return "gcr-type-badge";
  }
}

function getStatusBadgeClass(status) {
  return status === "Open"
    ? "gcr-status-badge gcr-status-open"
    : "gcr-status-badge gcr-status-resolved";
}

function getSeverityClass(severity) {
  switch (severity) {
    case "High":
      return "gcr-severity-high";
    case "Medium":
      return "gcr-severity-medium";
    case "Low":
      return "gcr-severity-low";
    default:
      return "";
  }
}

function getSeverityLabel(severity) {
  switch (severity) {
    case "High":
      return "gcr-severity-label gcr-severity-label-high";
    case "Medium":
      return "gcr-severity-label gcr-severity-label-medium";
    case "Low":
      return "gcr-severity-label gcr-severity-label-low";
    default:
      return "gcr-severity-label";
  }
}

export default function GovConReconciliation() {
  return (
    <div className="govcon-reconciliation">
      <PolicyBanner
        policy="legal"
        context="govcon-reconciliation"
        message="Reconciliation results are preliminary. Final incurred cost submissions require DCAA review."
        dismissible
      />

      <div className="gcr-header">
        <div className="gcr-header-left">
          <h1 className="gcr-title">Reconciliation</h1>
        </div>
        <div className="gcr-header-actions">
          <button className="gcr-btn gcr-btn-primary">
            <Play size={16} />
            Run Reconciliation
          </button>
          <button className="gcr-btn gcr-btn-outline">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="gcr-kpi-grid">
        <div className="gcr-kpi-card">
          <div className="gcr-kpi-icon">
            <Calendar size={20} />
          </div>
          <div className="gcr-kpi-content">
            <span className="gcr-kpi-label">Last Run</span>
            <span className="gcr-kpi-value">Mar 28, 2026</span>
          </div>
        </div>
        <div className="gcr-kpi-card">
          <div className="gcr-kpi-icon gcr-kpi-icon-warning">
            <AlertTriangle size={20} />
          </div>
          <div className="gcr-kpi-content">
            <span className="gcr-kpi-label">Open Variances</span>
            <span className="gcr-kpi-value">3</span>
          </div>
        </div>
        <div className="gcr-kpi-card">
          <div className="gcr-kpi-icon gcr-kpi-icon-success">
            <CheckCircle2 size={20} />
          </div>
          <div className="gcr-kpi-content">
            <span className="gcr-kpi-label">Resolved This Month</span>
            <span className="gcr-kpi-value">12</span>
          </div>
        </div>
      </div>

      <div className="gcr-main-grid">
        <div className="gcr-main-content">
          <div className="gcr-card">
            <div className="gcr-card-header">
              <h2 className="gcr-card-title">Reconciliation Runs</h2>
            </div>
            <div className="gcr-table-wrapper">
              <table className="gcr-table">
                <thead>
                  <tr>
                    <th>Run Date</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Variances Found</th>
                    <th>Resolved</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliationRuns.map((run, index) => (
                    <tr key={index} className="gcr-table-row">
                      <td className="gcr-date-cell">{run.date}</td>
                      <td>
                        <span className={getTypeBadgeClass(run.type)}>
                          {run.type}
                        </span>
                      </td>
                      <td>{run.period}</td>
                      <td className="gcr-number-cell">{run.variancesFound}</td>
                      <td className="gcr-number-cell">{run.resolved}</td>
                      <td>
                        <span className={getStatusBadgeClass(run.status)}>
                          {run.status === "Open" ? (
                            <XCircle size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="gcr-card">
            <div className="gcr-card-header">
              <h2 className="gcr-card-title">Open Variances</h2>
              <span className="gcr-variance-count">
                {openVariances.length} items
              </span>
            </div>
            <div className="gcr-variances-list">
              {openVariances.map((variance) => (
                <div
                  key={variance.id}
                  className={`gcr-variance-item ${getSeverityClass(variance.severity)}`}
                >
                  <div className="gcr-variance-header">
                    <span className="gcr-variance-title">{variance.title}</span>
                    <span className={getSeverityLabel(variance.severity)}>
                      {variance.severity}
                    </span>
                  </div>
                  <p className="gcr-variance-detail">{variance.detail}</p>
                  <div className="gcr-variance-footer">
                    <span className="gcr-variance-contract">
                      <FileText size={14} />
                      {variance.contract}
                    </span>
                    <button className="gcr-variance-action">
                      Review
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="gcr-sidebar">
          <div className="gcr-card">
            <div className="gcr-card-header">
              <h2 className="gcr-card-title">ICS Schedule Reference</h2>
            </div>
            <ul className="gcr-schedule-list">
              {icsSchedules.map((schedule, index) => (
                <li key={index} className="gcr-schedule-item">
                  <div className="gcr-schedule-check">
                    {schedule.documented ? (
                      <CheckCircle2
                        size={16}
                        className="gcr-check-icon gcr-check-documented"
                      />
                    ) : (
                      <XCircle
                        size={16}
                        className="gcr-check-icon gcr-check-pending"
                      />
                    )}
                  </div>
                  <div className="gcr-schedule-info">
                    <span className="gcr-schedule-code">{schedule.code}</span>
                    <span className="gcr-schedule-name">{schedule.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
