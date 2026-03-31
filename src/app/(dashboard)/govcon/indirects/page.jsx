"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConIndirects.css";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Layers,
  Percent,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

const kpiData = [
  {
    label: "Fringe Rate",
    value: "32.5%",
    icon: Users,
    change: "+0.7%",
    direction: "up",
  },
  {
    label: "Overhead Rate",
    value: "45.2%",
    icon: Layers,
    change: "+2.1%",
    direction: "up",
  },
  {
    label: "G&A Rate",
    value: "12.8%",
    icon: DollarSign,
    change: "-0.4%",
    direction: "down",
  },
  {
    label: "Total Indirect Rate",
    value: "90.5%",
    icon: Percent,
    change: "+2.4%",
    direction: "up",
  },
];

const costPools = [
  {
    name: "Fringe Benefits",
    farRef: "FAR 31.205-6",
    baseType: "Direct Labor",
    currentRate: "32.5%",
    priorRate: "31.8%",
    variance: "+0.7%",
    varianceDir: "positive",
    allowability: "Allowable",
  },
  {
    name: "Overhead",
    farRef: "FAR 31.203",
    baseType: "Direct Labor",
    currentRate: "45.2%",
    priorRate: "43.1%",
    variance: "+2.1%",
    varianceDir: "positive",
    allowability: "Allowable",
  },
  {
    name: "G&A",
    farRef: "FAR 31.203",
    baseType: "Total Cost Input",
    currentRate: "12.8%",
    priorRate: "13.2%",
    variance: "-0.4%",
    varianceDir: "negative",
    allowability: "Allowable",
  },
  {
    name: "Material Handling",
    farRef: "FAR 31.203",
    baseType: "Direct Material",
    currentRate: "3.5%",
    priorRate: "3.2%",
    variance: "+0.3%",
    varianceDir: "positive",
    allowability: "Allowable",
  },
  {
    name: "Facilities",
    farRef: "FAR 31.205-36",
    baseType: "Direct Labor",
    currentRate: "8.4%",
    priorRate: "8.1%",
    variance: "+0.3%",
    varianceDir: "positive",
    allowability: "Under Review",
  },
];

const rateComparisonData = [
  { pool: "Fringe", current: 32.5, prior: 31.8 },
  { pool: "Overhead", current: 45.2, prior: 43.1 },
  { pool: "G&A", current: 12.8, prior: 13.2 },
  { pool: "Mat. Handling", current: 3.5, prior: 3.2 },
  { pool: "Facilities", current: 8.4, prior: 8.1 },
];

const casItems = [
  {
    standard: "CAS 401",
    title: "Consistency in Estimating",
    status: "documented",
  },
  {
    standard: "CAS 402",
    title: "Consistency in Allocating",
    status: "documented",
  },
  {
    standard: "CAS 405",
    title: "Accounting for Unallowable Costs",
    status: "documented",
  },
  { standard: "CAS 406", title: "Cost Accounting Period", status: "pending" },
  {
    standard: "CAS 410",
    title: "G&A Expense Allocation",
    status: "documented",
  },
  {
    standard: "CAS 418",
    title: "Direct & Indirect Cost Allocation",
    status: "documented",
  },
];

function getAllowabilityClass(status) {
  switch (status) {
    case "Allowable":
      return "gci-badge-allowable";
    case "Under Review":
      return "gci-badge-under-review";
    case "Unallowable":
      return "gci-badge-unallowable";
    default:
      return "";
  }
}

function getAllowabilityIcon(status) {
  switch (status) {
    case "Allowable":
      return <CheckCircle2 size={12} />;
    case "Under Review":
      return <Clock size={12} />;
    case "Unallowable":
      return <AlertTriangle size={12} />;
    default:
      return null;
  }
}

export default function GovConIndirects() {
  const maxRate = Math.max(
    ...rateComparisonData.map((d) => Math.max(d.current, d.prior)),
  );

  return (
    <div className="govcon-indirects">
      <PolicyBanner
        policy="legal"
        context="govcon-indirects"
        message="Indirect cost rates shown are provisional. Final rates are subject to DCAA audit and negotiation."
        dismissible
      />

      <div className="gci-header">
        <h1 className="gci-title">Indirect Costs</h1>
        <p className="gci-subtitle">Cost Pool &amp; Rate Management</p>
      </div>

      <div className="gci-kpi-grid">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="gci-kpi-card" key={kpi.label}>
              <div className="gci-kpi-icon">
                <Icon size={20} />
              </div>
              <div className="gci-kpi-content">
                <span className="gci-kpi-label">{kpi.label}</span>
                <span className="gci-kpi-value">{kpi.value}</span>
                <span
                  className={`gci-kpi-change ${kpi.direction === "up" ? "gci-change-up" : "gci-change-down"}`}
                >
                  {kpi.direction === "up" ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {kpi.change} vs prior year
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gci-main-grid">
        <div className="gci-table-card">
          <div className="gci-card-header">
            <BarChart3 size={18} />
            <h2>Cost Pools</h2>
          </div>
          <table className="gci-table">
            <thead>
              <tr>
                <th>Pool Name</th>
                <th>FAR Reference</th>
                <th>Base Type</th>
                <th>Current Rate</th>
                <th>Prior Year Rate</th>
                <th>Variance</th>
                <th>Allowability</th>
              </tr>
            </thead>
            <tbody>
              {costPools.map((pool) => (
                <tr key={pool.name}>
                  <td className="gci-pool-name">{pool.name}</td>
                  <td className="gci-far-ref">{pool.farRef}</td>
                  <td>{pool.baseType}</td>
                  <td className="gci-rate-current">{pool.currentRate}</td>
                  <td className="gci-rate-prior">{pool.priorRate}</td>
                  <td>
                    <span
                      className={`gci-variance ${pool.varianceDir === "positive" ? "gci-variance-positive" : "gci-variance-negative"}`}
                    >
                      {pool.varianceDir === "positive" ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {pool.variance}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`gci-badge ${getAllowabilityClass(pool.allowability)}`}
                    >
                      {getAllowabilityIcon(pool.allowability)}
                      {pool.allowability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gci-sidebar">
          <div className="gci-sidebar-card">
            <div className="gci-card-header">
              <BarChart3 size={18} />
              <h2>Rate Comparison</h2>
            </div>
            <div className="gci-rate-bars">
              {rateComparisonData.map((item) => (
                <div className="gci-rate-bar-group" key={item.pool}>
                  <span className="gci-rate-bar-label">{item.pool}</span>
                  <div className="gci-rate-bar-row">
                    <div className="gci-rate-bar-track">
                      <div
                        className="gci-rate-bar gci-rate-bar-current"
                        style={{ width: `${(item.current / maxRate) * 100}%` }}
                      />
                    </div>
                    <span className="gci-rate-bar-value">{item.current}%</span>
                  </div>
                  <div className="gci-rate-bar-row">
                    <div className="gci-rate-bar-track">
                      <div
                        className="gci-rate-bar gci-rate-bar-prior"
                        style={{ width: `${(item.prior / maxRate) * 100}%` }}
                      />
                    </div>
                    <span className="gci-rate-bar-value">{item.prior}%</span>
                  </div>
                  <div className="gci-rate-bar-legend">
                    <span className="gci-legend-current">Current</span>
                    <span className="gci-legend-prior">Prior</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gci-sidebar-card">
            <div className="gci-card-header">
              <ShieldCheck size={18} />
              <h2>CAS Compliance</h2>
            </div>
            <p className="gci-cas-subtitle">Disclosure Statement Status</p>
            <ul className="gci-cas-list">
              {casItems.map((item) => (
                <li className="gci-cas-item" key={item.standard}>
                  <span
                    className={`gci-cas-dot ${item.status === "documented" ? "gci-cas-documented" : "gci-cas-pending"}`}
                  />
                  <div className="gci-cas-info">
                    <span className="gci-cas-standard">{item.standard}</span>
                    <span className="gci-cas-title">{item.title}</span>
                  </div>
                  <span
                    className={`gci-cas-status ${item.status === "documented" ? "gci-cas-status-documented" : "gci-cas-status-pending"}`}
                  >
                    {item.status === "documented" ? (
                      <FileCheck size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {item.status === "documented" ? "Documented" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
