"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Percent,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { govconApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/govcon/GovConTimekeeping.css";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function GovConTimekeeping() {
  const [dismissed, setDismissed] = useState(false);
  const [timesheetData, setTimesheetData] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [kpis, setKpis] = useState({
    totalHours: 0,
    utilization: "—",
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await govconApi.listTimesheets();
      const payload = res.data ?? res;

      // Normalize timesheet rows
      const rows =
        payload.timesheets ??
        payload.rows ??
        (Array.isArray(payload) ? payload : []);
      setTimesheetData(
        rows.map((row) => ({
          chargeCode: row.charge_code ?? row.chargeCode ?? "",
          contract: row.contract ?? "",
          hours: row.hours ?? [0, 0, 0, 0, 0],
        })),
      );

      // Normalize recent submissions
      const recent =
        payload.recent_submissions ?? payload.recentSubmissions ?? [];
      setRecentSubmissions(
        recent.map((s) => ({
          week: s.week ?? s.period ?? "",
          status: s.status ?? "Pending",
        })),
      );

      // Normalize KPIs
      setKpis({
        totalHours: payload.total_hours ?? payload.totalHours ?? 0,
        utilization:
          payload.billable_utilization ??
          payload.billableUtilization ??
          payload.utilization ??
          "—",
        pendingApprovals:
          payload.pending_approvals ?? payload.pendingApprovals ?? 0,
      });
    } catch (err) {
      console.warn("GovConTimekeeping: failed to fetch timesheets", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const getDailyTotals = () => {
    return dayLabels.map((_, dayIndex) =>
      timesheetData.reduce((sum, row) => sum + (row.hours[dayIndex] ?? 0), 0),
    );
  };

  const getRowTotal = (hours) => hours.reduce((sum, h) => sum + h, 0);

  const dailyTotals = getDailyTotals();
  const weekTotal = dailyTotals.reduce((sum, d) => sum + d, 0);

  const formatHours = (val) => {
    if (val === 0) return "0";
    return val % 1 === 0 ? val.toFixed(1) : val.toFixed(1);
  };

  if (loading) {
    return (
      <div className="govcon-timekeeping">
        <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="govcon-timekeeping">
      {!dismissed && (
        <PolicyBanner
          policy="legal"
          context="govcon-timekeeping"
          message="Timekeeping records must be maintained in accordance with DCAA requirements. Ensure all entries are accurate and contemporaneous."
          dismissible
          onDismiss={() => setDismissed(true)}
        />
      )}

      <div className="gct-header">
        <div className="gct-header-left">
          <h1 className="gct-title">Timekeeping</h1>
          <div className="gct-week-selector">
            <button className="gct-week-nav" aria-label="Previous week">
              <ChevronLeft size={18} />
            </button>
            <span className="gct-week-label">
              Week of Mar 24 - Mar 28, 2026
            </span>
            <button className="gct-week-nav" aria-label="Next week">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <button className="gct-submit-btn">
          <Send size={16} />
          Submit Timesheet
        </button>
      </div>

      <div className="gct-kpi-grid">
        <div className="gct-kpi-card">
          <div className="gct-kpi-icon">
            <Clock size={20} />
          </div>
          <div className="gct-kpi-content">
            <span className="gct-kpi-value">
              {kpis.totalHours || weekTotal}
            </span>
            <span className="gct-kpi-label">Total Hours This Week</span>
          </div>
        </div>
        <div className="gct-kpi-card">
          <div className="gct-kpi-icon">
            <Percent size={20} />
          </div>
          <div className="gct-kpi-content">
            <span className="gct-kpi-value">
              {typeof kpis.utilization === "number"
                ? `${kpis.utilization}%`
                : kpis.utilization}
            </span>
            <span className="gct-kpi-label">Billable Utilization</span>
          </div>
        </div>
        <div className="gct-kpi-card">
          <div className="gct-kpi-icon">
            <FileText size={20} />
          </div>
          <div className="gct-kpi-content">
            <span className="gct-kpi-value">{kpis.pendingApprovals}</span>
            <span className="gct-kpi-label">Pending Approvals</span>
          </div>
        </div>
      </div>

      <div className="gct-timesheet-card">
        <div className="gct-timesheet-header">
          <h2 className="gct-timesheet-title">Weekly Timesheet</h2>
          <span className="gct-status-badge gct-status-draft">
            Draft - Not Submitted
          </span>
        </div>
        <div className="gct-table-wrapper">
          <table className="gct-table">
            <thead>
              <tr>
                <th className="gct-th gct-th-charge">Charge Code</th>
                <th className="gct-th gct-th-contract">Contract</th>
                {dayLabels.map((day) => (
                  <th key={day} className="gct-th gct-th-day">
                    {day}
                  </th>
                ))}
                <th className="gct-th gct-th-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {timesheetData.map((row, idx) => {
                const rowTotal = getRowTotal(row.hours);
                return (
                  <tr key={idx} className="gct-row">
                    <td className="gct-td gct-td-charge">{row.chargeCode}</td>
                    <td className="gct-td gct-td-contract">{row.contract}</td>
                    {row.hours.map((h, dIdx) => (
                      <td key={dIdx} className="gct-td gct-td-hours">
                        <span className="gct-hour-value">{formatHours(h)}</span>
                      </td>
                    ))}
                    <td className="gct-td gct-td-row-total">
                      {formatHours(rowTotal)}
                    </td>
                  </tr>
                );
              })}
              {timesheetData.length === 0 && (
                <tr>
                  <td
                    colSpan={7 + dayLabels.length}
                    style={{ textAlign: "center", color: "#888" }}
                  >
                    No timesheet data available.
                  </td>
                </tr>
              )}
            </tbody>
            {timesheetData.length > 0 && (
              <tfoot>
                <tr className="gct-totals-row">
                  <td className="gct-td gct-td-totals-label" colSpan={2}>
                    Daily Totals
                  </td>
                  {dailyTotals.map((total, idx) => (
                    <td key={idx} className="gct-td gct-td-daily-total">
                      {formatHours(total)}
                    </td>
                  ))}
                  <td className="gct-td gct-td-grand-total">
                    {formatHours(weekTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="gct-recent-card">
        <h2 className="gct-recent-title">Recent Submissions</h2>
        <ul className="gct-recent-list">
          {recentSubmissions.map((sub, idx) => (
            <li key={idx} className="gct-recent-item">
              <div className="gct-recent-info">
                <Clock size={16} className="gct-recent-icon" />
                <span className="gct-recent-week">{sub.week}</span>
              </div>
              <span className="gct-status-badge gct-status-approved">
                <CheckCircle size={14} />
                {sub.status}
              </span>
            </li>
          ))}
          {recentSubmissions.length === 0 && (
            <li style={{ color: "#888", padding: "0.5rem 0" }}>
              No recent submissions.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
