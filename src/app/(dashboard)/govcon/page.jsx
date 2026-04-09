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
import { useCallback, useEffect, useState } from "react";

import { govconApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/govcon/GovConOverview.css";

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

function formatCurrency(value) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function GovConOverview() {
  const [kpiData, setKpiData] = useState([]);
  const [documentQueue, setDocumentQueue] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [sf1408Items, setSf1408Items] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [contractsRes, complianceRes] = await Promise.all([
        govconApi.listContracts(),
        govconApi.getComplianceStatus(),
      ]);

      const contractList = contractsRes.data ?? contractsRes;
      const compliance = complianceRes.data ?? complianceRes;

      // Build KPIs from contract data
      const activeContracts = Array.isArray(contractList)
        ? contractList.filter(
            (c) => (c.status || "").toLowerCase() === "active",
          )
        : [];
      const totalValue = Array.isArray(contractList)
        ? contractList.reduce(
            (sum, c) => sum + (c.total_value ?? c.totalValue ?? 0),
            0,
          )
        : 0;
      const readinessScore =
        compliance.dcaa_readiness_score ??
        compliance.dcaaReadinessScore ??
        compliance.readiness_score ??
        "—";
      const pendingActions =
        compliance.pending_actions ?? compliance.pendingActions ?? 0;

      setKpiData([
        {
          label: "Active Contracts",
          value: String(activeContracts.length),
          icon: ClipboardList,
        },
        {
          label: "Total Contract Value",
          value: formatCurrency(totalValue),
          icon: DollarSign,
        },
        {
          label: "DCAA Readiness Score",
          value:
            typeof readinessScore === "number"
              ? `${readinessScore}%`
              : readinessScore,
          icon: Shield,
        },
        {
          label: "Pending Actions",
          value: String(pendingActions),
          icon: Clock,
        },
      ]);

      // Build document queue from compliance data
      const docs = compliance.document_queue ?? compliance.documentQueue ?? [];
      setDocumentQueue(
        docs.map((d) => ({
          document: d.document ?? d.name ?? d.title ?? "",
          contract: d.contract ?? d.contract_number ?? "",
          dueDate: d.due_date ?? d.dueDate ?? "",
          status: d.status ?? "pending",
        })),
      );

      // Build contract performance cards
      setContracts(
        activeContracts.slice(0, 3).map((c) => ({
          id: c.contract_number ?? c.contractNumber ?? c.id,
          type: c.type ?? c.contract_type ?? "",
          value: formatCurrency(c.total_value ?? c.totalValue ?? 0),
          complete: c.percent_complete ?? c.percentComplete ?? c.complete ?? 0,
        })),
      );

      // Build SF-1408 items from compliance data
      const sf1408 =
        compliance.sf1408_items ??
        compliance.sf1408Items ??
        compliance.sf1408 ??
        [];
      setSf1408Items(
        sf1408.map((item) => ({
          area: item.area ?? item.name ?? item.title ?? "",
          status: item.status ?? "pass",
        })),
      );
    } catch (err) {
      console.warn("GovConOverview: failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="gc-govcon-overview">
        <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
          Loading...
        </p>
      </div>
    );
  }

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
                {documentQueue.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      No documents in queue.
                    </td>
                  </tr>
                )}
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
              {contracts.length === 0 && (
                <p style={{ color: "#888" }}>No active contracts.</p>
              )}
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
              {sf1408Items.length === 0 && (
                <li style={{ color: "#888", padding: "0.5rem 0" }}>
                  No SF-1408 data available.
                </li>
              )}
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
