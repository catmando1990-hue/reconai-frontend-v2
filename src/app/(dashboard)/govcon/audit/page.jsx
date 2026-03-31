"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConAudit.css";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit3,
  FileText,
  Hash,
  RefreshCw,
  Shield,
  Upload,
} from "lucide-react";

const kpis = [
  { label: "Total Records", value: "1,247", icon: FileText },
  { label: "Chain Integrity", value: "Verified", icon: Shield },
  { label: "Retention Period", value: "6 Years", icon: Clock },
];

const timelineEntries = [
  {
    date: "Mar 28, 14:22",
    title: "Timesheet Submitted",
    description: "Week ending Mar 28, 2026 submitted by J. Mitchell",
    hash: "8a3f...c2d1",
    icon: Upload,
    recent: true,
  },
  {
    date: "Mar 28, 10:15",
    title: "Indirect Rate Updated",
    description: "Overhead rate adjusted to 46.1% provisional",
    hash: "7b2e...d4f3",
    icon: RefreshCw,
    recent: true,
  },
  {
    date: "Mar 27, 16:45",
    title: "Reconciliation Run",
    description: "Full ICS reconciliation for Q1 2026 completed",
    hash: "6c1d...e5a2",
    icon: CheckCircle,
    recent: false,
  },
  {
    date: "Mar 27, 09:30",
    title: "Contract Modified",
    description: "FA-8721-23-C-0042 modification 004 recorded",
    hash: "5d0c...f6b1",
    icon: Edit3,
    recent: false,
  },
  {
    date: "Mar 26, 11:00",
    title: "Invoice Generated",
    description: "Progress payment invoice #INV-2026-042 created",
    hash: "4e9b...a7c0",
    icon: FileText,
    recent: false,
  },
  {
    date: "Mar 25, 15:30",
    title: "Labor Charge Corrected",
    description: "D001 charge code correction for Mar 24",
    hash: "3f8a...b8d9",
    icon: AlertTriangle,
    recent: false,
  },
];

const evidenceItems = [
  { label: "Financial Statements", status: "Current", color: "green" },
  { label: "Bank Records", status: "Current", color: "green" },
  { label: "Labor Records", status: "Current", color: "green" },
  { label: "Indirect Cost Data", status: "Pending Update", color: "amber" },
];

export default function GovConAudit() {
  return (
    <div className="govcon-audit">
      <PolicyBanner
        policy="legal"
        context="govcon-audit"
        message="Audit trail records are maintained for DCAA review purposes. This does not constitute certified audit documentation."
        dismissible
      />

      <div className="gca-header">
        <h1 className="gca-title">Audit Trail</h1>
        <div className="gca-header-actions">
          <button className="gca-btn gca-btn-primary">
            <Download size={16} />
            Export for DCAA
          </button>
          <button className="gca-btn gca-btn-outline">
            <Shield size={16} />
            Verify Integrity
          </button>
        </div>
      </div>

      <div className="gca-kpi-grid">
        {kpis.map((kpi) => (
          <div className="gca-kpi-card" key={kpi.label}>
            <div className="gca-kpi-icon">
              <kpi.icon size={20} />
            </div>
            <div className="gca-kpi-info">
              <span className="gca-kpi-value">{kpi.value}</span>
              <span className="gca-kpi-label">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="gca-main-grid">
        <div className="gca-timeline-section">
          <h2 className="gca-section-title">Recent Activity</h2>
          <div className="gca-timeline">
            {timelineEntries.map((entry, index) => (
              <div className="gca-timeline-entry" key={index}>
                <div
                  className={`gca-timeline-dot ${entry.recent ? "gca-dot-purple" : "gca-dot-gray"}`}
                />
                {index < timelineEntries.length - 1 && (
                  <div className="gca-timeline-line" />
                )}
                <div className="gca-timeline-card">
                  <div className="gca-timeline-card-header">
                    <div className="gca-timeline-icon">
                      <entry.icon size={16} />
                    </div>
                    <span className="gca-timeline-date">{entry.date}</span>
                  </div>
                  <h3 className="gca-timeline-title">{entry.title}</h3>
                  <p className="gca-timeline-desc">{entry.description}</p>
                  <span className="gca-timeline-hash">
                    <Hash size={12} />
                    {entry.hash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gca-sidebar">
          <div className="gca-sidebar-card">
            <h3 className="gca-sidebar-title">Evidence Status</h3>
            <div className="gca-evidence-list">
              {evidenceItems.map((item) => (
                <div className="gca-evidence-item" key={item.label}>
                  <span
                    className={`gca-evidence-dot gca-evidence-${item.color}`}
                  />
                  <span className="gca-evidence-label">{item.label}</span>
                  <span
                    className={`gca-evidence-status gca-evidence-${item.color}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="gca-sidebar-card">
            <h3 className="gca-sidebar-title">DCAA Export History</h3>
            <div className="gca-export-list">
              <div className="gca-export-row">
                <span className="gca-export-label">Last export</span>
                <span className="gca-export-value">Mar 15, 2026</span>
              </div>
              <div className="gca-export-row">
                <span className="gca-export-label">Format</span>
                <span className="gca-export-value">JSON + PDF</span>
              </div>
              <div className="gca-export-row">
                <span className="gca-export-label">Records</span>
                <span className="gca-export-value">1,180</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
