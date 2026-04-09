"use client";

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
import { useCallback, useEffect, useState } from "react";

import { govconApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/govcon/GovConIndirects.css";

const kpiIconMap = {
  fringe: Users,
  overhead: Layers,
  "g&a": DollarSign,
  ga: DollarSign,
  total: Percent,
};

function pickKpiIcon(label) {
  const lower = (label || "").toLowerCase();
  for (const [key, icon] of Object.entries(kpiIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return Percent;
}

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
  const [kpiData, setKpiData] = useState([]);
  const [costPools, setCostPools] = useState([]);
  const [rateComparisonData, setRateComparisonData] = useState([]);
  const [casItems, setCasItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [poolsRes, ratesRes] = await Promise.all([
        govconApi.listIndirectPools(),
        govconApi.getAllocationRates(),
      ]);

      const pools = poolsRes.data ?? poolsRes;
      const rates = ratesRes.data ?? ratesRes;

      const poolList = Array.isArray(pools) ? pools : (pools.pools ?? []);
      const rateList =
        rates.rates ??
        rates.allocation_rates ??
        (Array.isArray(rates) ? rates : []);

      // Build KPIs from rates
      const kpis = rateList.map((r) => {
        const label = r.label ?? r.name ?? r.pool ?? "";
        const value = r.current_rate ?? r.currentRate ?? r.value ?? 0;
        const change = r.change ?? r.variance ?? "";
        const direction =
          r.direction ?? (String(change).startsWith("-") ? "down" : "up");
        return {
          label: label.includes("Rate") ? label : `${label} Rate`,
          value: typeof value === "number" ? `${value}%` : value,
          icon: pickKpiIcon(label),
          change:
            typeof change === "number"
              ? `${change > 0 ? "+" : ""}${change}%`
              : change,
          direction,
        };
      });
      setKpiData(kpis);

      // Build cost pools table
      setCostPools(
        poolList.map((p) => ({
          name: p.name ?? "",
          farRef: p.far_ref ?? p.farRef ?? p.far_reference ?? "",
          baseType: p.base_type ?? p.baseType ?? "",
          currentRate: p.current_rate ?? p.currentRate ?? "",
          priorRate: p.prior_rate ?? p.priorRate ?? p.prior_year_rate ?? "",
          variance: p.variance ?? "",
          varianceDir:
            p.variance_dir ??
            p.varianceDir ??
            (String(p.variance ?? "").startsWith("-")
              ? "negative"
              : "positive"),
          allowability: p.allowability ?? p.status ?? "Allowable",
        })),
      );

      // Build rate comparison data for bar chart
      setRateComparisonData(
        poolList.map((p) => ({
          pool: p.short_name ?? p.name ?? "",
          current: parseFloat(p.current_rate ?? p.currentRate ?? 0),
          prior: parseFloat(
            p.prior_rate ?? p.priorRate ?? p.prior_year_rate ?? 0,
          ),
        })),
      );

      // Build CAS items
      const cas = rates.cas_items ?? rates.casItems ?? rates.cas ?? [];
      setCasItems(
        cas.map((item) => ({
          standard: item.standard ?? item.code ?? "",
          title: item.title ?? item.name ?? "",
          status: item.status ?? "pending",
        })),
      );
    } catch (err) {
      console.warn("GovConIndirects: failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRate =
    rateComparisonData.length > 0
      ? Math.max(...rateComparisonData.map((d) => Math.max(d.current, d.prior)))
      : 1;

  if (loading) {
    return (
      <div className="govcon-indirects">
        <p style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
          Loading...
        </p>
      </div>
    );
  }

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
              {costPools.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", color: "#888" }}
                  >
                    No cost pool data available.
                  </td>
                </tr>
              )}
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
              {rateComparisonData.length === 0 && (
                <p style={{ color: "#888", padding: "0.5rem 0" }}>
                  No rate data available.
                </p>
              )}
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
              {casItems.length === 0 && (
                <li style={{ color: "#888", padding: "0.5rem 0" }}>
                  No CAS data available.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
