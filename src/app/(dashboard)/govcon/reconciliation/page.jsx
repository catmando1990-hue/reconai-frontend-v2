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
import { useCallback, useEffect, useState } from "react";

import { govconApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/govcon/GovConReconciliation.css";

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
  const [reconciliationRuns, setReconciliationRuns] = useState([]);
  const [openVariances, setOpenVariances] = useState([]);
  const [icsSchedules, setIcsSchedules] = useState([]);
  const [kpis, setKpis] = useState({
    lastRun: "—",
    openCount: 0,
    resolvedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await govconApi.getReconciliation();
      const data = res.data ?? res;

      // Normalize runs
      const runs =
        data.runs ?? data.reconciliation_runs ?? data.reconciliationRuns ?? [];
      setReconciliationRuns(
        runs.map((r) => ({
          date: r.date ?? r.run_date ?? r.runDate ?? "",
          type: r.type ?? "",
          period: r.period ?? "",
          variancesFound: r.variances_found ?? r.variancesFound ?? 0,
          resolved: r.resolved ?? 0,
          status: r.status ?? "Resolved",
        })),
      );

      // Normalize open variances
      const variances =
        data.open_variances ?? data.openVariances ?? data.variances ?? [];
      setOpenVariances(
        variances.map((v) => ({
          id: v.id,
          title: v.title ?? "",
          detail: v.detail ?? v.description ?? "",
          severity: v.severity ?? "Medium",
          contract: v.contract ?? v.contract_number ?? "",
        })),
      );

      // Normalize ICS schedules
      const schedules =
        data.ics_schedules ?? data.icsSchedules ?? data.schedules ?? [];
      setIcsSchedules(
        schedules.map((s) => ({
          code: s.code ?? "",
          name: s.name ?? "",
          documented: s.documented ?? false,
        })),
      );

      // KPIs
      setKpis({
        lastRun: data.last_run ?? data.lastRun ?? runs[0]?.date ?? "—",
        openCount: data.open_count ?? data.openCount ?? variances.length,
        resolvedCount:
          data.resolved_count ??
          data.resolvedCount ??
          data.resolved_this_month ??
          0,
      });
    } catch (err) {
      console.warn("GovConReconciliation: failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="govcon-reconciliation">
        <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
          Loading...
        </p>
      </div>
    );
  }

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
            <span className="gcr-kpi-value">{kpis.lastRun}</span>
          </div>
        </div>
        <div className="gcr-kpi-card">
          <div className="gcr-kpi-icon gcr-kpi-icon-warning">
            <AlertTriangle size={20} />
          </div>
          <div className="gcr-kpi-content">
            <span className="gcr-kpi-label">Open Variances</span>
            <span className="gcr-kpi-value">{kpis.openCount}</span>
          </div>
        </div>
        <div className="gcr-kpi-card">
          <div className="gcr-kpi-icon gcr-kpi-icon-success">
            <CheckCircle2 size={20} />
          </div>
          <div className="gcr-kpi-content">
            <span className="gcr-kpi-label">Resolved This Month</span>
            <span className="gcr-kpi-value">{kpis.resolvedCount}</span>
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
                  {reconciliationRuns.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", color: "#888" }}
                      >
                        No reconciliation runs found.
                      </td>
                    </tr>
                  )}
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
              {openVariances.length === 0 && (
                <p
                  style={{
                    color: "#888",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  No open variances.
                </p>
              )}
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
              {icsSchedules.length === 0 && (
                <li style={{ color: "#888", padding: "0.5rem 0" }}>
                  No ICS schedules available.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
