"use client";

import {
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Link2,
  Shield,
  TrendingUp,
} from "lucide-react";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConOverview.css";

const kpiData = [
  { label: "Active Contracts", value: "12", icon: ClipboardList },
  { label: "Total Contract Value", value: "$14.2M", icon: DollarSign },
  { label: "DCAA Readiness Score", value: "87%", icon: Shield },
  { label: "Pending Actions", value: "5", icon: Clock },
];

const documentQueue = [
  {
    document: "ICE Submission",
    contract: "FA-8721",
    dueDate: "Apr 5",
    status: "overdue",
  },
  {
    document: "Progress Report",
    contract: "W912DY",
    dueDate: "Apr 10",
    status: "due-soon",
  },
  {
    document: "CDRL A001",
    contract: "N00024",
    dueDate: "Apr 15",
    status: "pending",
  },
  {
    document: "Final Invoice",
    contract: "FA-8721",
    dueDate: "Apr 20",
    status: "pending",
  },
  {
    document: "Subcontract Plan",
    contract: "W912DY",
    dueDate: "May 1",
    status: "submitted",
  },
];

const contracts = [
  { id: "FA-8721-23-C-0042", type: "FFP", value: "$4.2M", complete: 68 },
  { id: "W912DY-24-D-0015", type: "T&M", value: "$6.8M", complete: 42 },
  { id: "N00024-23-C-1234", type: "CPFF", value: "$3.2M", complete: 91 },
];

const sf1408Items = [
  { area: "General Ledger Structure", status: "pass" },
  { area: "Cost Accounting Standards", status: "pass" },
  { area: "Timekeeping System", status: "warning" },
  { area: "Indirect Cost Pools", status: "pass" },
  { area: "Billing System", status: "needs-review" },
];

const quickLinks = [
  "View All Contracts",
  "Submit Timesheet",
  "Indirect Rate Setup",
  "Run Reconciliation",
  "Export Audit Trail",
];

const statusLabels = {
  overdue: "Overdue",
  "due-soon": "Due Soon",
  pending: "Pending",
  submitted: "Submitted",
};

const sf1408Labels = {
  pass: "Pass",
  warning: "Warning",
  "needs-review": "Needs Review",
};

export default function GovConOverview() {
  return (
    <div className="gc-govcon-overview">
      <PolicyBanner
        policy="legal"
        context="govcon-overview"
        message="GovCon provides documentation and tracking tools for government contractors. This does not constitute DCAA compliance certification."
        dismissible
      />

      <div className="gc-kpi-grid">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="gc-kpi-card" key={kpi.label}>
              <div className="gc-kpi-icon-wrap">
                <Icon size={20} />
              </div>
              <div className="gc-kpi-info">
                <span className="gc-kpi-value">{kpi.value}</span>
                <span className="gc-kpi-label">{kpi.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gc-main-grid">
        <div className="gc-main-column">
          <div className="gc-card">
            <div className="gc-card-header">
              <h2>
                <FileText size={16} /> Documentation Queue
              </h2>
            </div>
            <table className="gc-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Contract</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {documentQueue.map((item) => (
                  <tr key={item.document}>
                    <td>{item.document}</td>
                    <td className="gc-contract-id">{item.contract}</td>
                    <td>{item.dueDate}</td>
                    <td>
                      <span
                        className={`gc-status-badge gc-status-${item.status}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="gc-card">
            <div className="gc-card-header">
              <h2>
                <TrendingUp size={16} /> Contract Performance
              </h2>
            </div>
            <div className="gc-contracts-grid">
              {contracts.map((contract) => (
                <div className="gc-contract-card" key={contract.id}>
                  <div className="gc-contract-card-header">
                    <span className="gc-contract-card-id">{contract.id}</span>
                    <span className="gc-contract-type-badge">
                      {contract.type}
                    </span>
                  </div>
                  <div className="gc-contract-card-details">
                    <span className="gc-contract-value">{contract.value}</span>
                    <span className="gc-contract-complete">
                      {contract.complete}% complete
                    </span>
                  </div>
                  <div className="gc-progress-bar-track">
                    <div
                      className="gc-progress-bar-fill"
                      style={{ width: `${contract.complete}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="gc-sidebar-column">
          <div className="gc-card">
            <div className="gc-card-header">
              <h2>
                <Shield size={16} /> SF-1408 Status
              </h2>
            </div>
            <ul className="gc-sf1408-list">
              {sf1408Items.map((item) => (
                <li className="gc-sf1408-item" key={item.area}>
                  <span className={`gc-sf1408-dot gc-sf1408-${item.status}`} />
                  <span className="gc-sf1408-area">{item.area}</span>
                  <span
                    className={`gc-sf1408-label gc-sf1408-label-${item.status}`}
                  >
                    {sf1408Labels[item.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="gc-card">
            <div className="gc-card-header">
              <h2>
                <Link2 size={16} /> Quick Links
              </h2>
            </div>
            <ul className="gc-quick-links">
              {quickLinks.map((link) => (
                <li className="gc-quick-link-item" key={link}>
                  <a href="#">
                    <ChevronRight size={14} />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
