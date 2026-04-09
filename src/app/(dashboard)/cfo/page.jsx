"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  Filter,
  FileBarChart,
  Shield,
  Bell,
  Zap,
  Loader2,
  Building2,
  Users,
  Target,
  Briefcase,
  PresentationIcon,
  LineChart,
  Database,
  ExternalLink,
  HelpCircle,
  Activity,
} from "lucide-react";
import { cfoApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/cfo/CFOOverview.css";

// Lifecycle states
const LIFECYCLE = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  REFRESHING: "refreshing",
  ERROR: "error",
};

// Metric states for lifecycle-aware rendering
const METRIC_STATE = {
  READY: "ready",
  COMPUTING: "computing",
  STALE: "stale",
  INSUFFICIENT: "insufficient",
  NOT_CONFIGURED: "not_configured",
  AWAITING: "awaiting",
};

const METRIC_STATE_LABELS = {
  [METRIC_STATE.COMPUTING]: "Computing…",
  [METRIC_STATE.STALE]: "Stale",
  [METRIC_STATE.INSUFFICIENT]: "Insufficient data",
  [METRIC_STATE.NOT_CONFIGURED]: "Not configured",
  [METRIC_STATE.AWAITING]: "Awaiting data",
};

/**
 * Normalize the backend dashboard response into the shape the component expects.
 * Handles snake_case → camelCase and fills defaults for missing fields.
 */
function normalizeDashboard(raw) {
  const m = raw.metrics || {};
  const s = raw.snapshot || {};
  const ds = raw.data_source ?? raw.dataSource ?? {};

  // Helper: wrap a raw metric value into the { value, state, sentiment } shape
  // the MetricWidget component expects. Backend may send the object directly,
  // or may send a plain number.
  function wrapMetric(val, fallbackSentiment = "neutral") {
    if (val && typeof val === "object" && "value" in val) return val;
    if (val !== null && val !== undefined) {
      return {
        value: val,
        state: METRIC_STATE.READY,
        sentiment: fallbackSentiment,
      };
    }
    return { value: 0, state: METRIC_STATE.AWAITING, sentiment: "neutral" };
  }

  return {
    cfo_version: raw.cfo_version ?? raw.cfoVersion ?? "2.1.0",
    lifecycle: raw.lifecycle ?? "ready",
    reason_code: raw.reason_code ?? raw.reasonCode ?? null,
    reason_message: raw.reason_message ?? raw.reasonMessage ?? null,
    metrics: {
      totalRevenue: wrapMetric(m.total_revenue ?? m.totalRevenue, "positive"),
      totalExpenses: wrapMetric(
        m.total_expenses ?? m.totalExpenses,
        "negative",
      ),
      netPosition: wrapMetric(m.net_position ?? m.netPosition, "positive"),
      period: wrapMetric(m.period),
      transactionCount: wrapMetric(m.transaction_count ?? m.transactionCount),
    },
    snapshot: {
      status: s.status ?? "on-track",
      highlights: s.highlights ?? [],
      boardDate: s.board_date ?? s.boardDate ?? null,
    },
    kpis: raw.kpis ?? [],
    dataSource: {
      connectedAccounts: ds.connected_accounts ?? ds.connectedAccounts ?? 0,
      lastSync: ds.last_sync ?? ds.lastSync ?? new Date().toISOString(),
      institutions: ds.institutions ?? [],
    },
  };
}

const quickLinks = [
  {
    id: "pnl",
    label: "P&L Statement",
    icon: FileBarChart,
    href: "/reports/pnl",
  },
  {
    id: "balance",
    label: "Balance Sheet",
    icon: LineChart,
    href: "/reports/balance",
  },
  {
    id: "cashflow",
    label: "Cash Flow",
    icon: Activity,
    href: "/reports/cashflow",
  },
  { id: "board", label: "Board Pack", icon: Briefcase, href: "/exports/board" },
];

// Default empty arrays — populated from API response
const defaultSignals = [];
const defaultComplianceItems = [];

const exportOptions = [
  { id: "pdf", label: "Export PDF", icon: FileText },
  { id: "excel", label: "Export Excel", icon: FileBarChart },
  { id: "board", label: "Board Pack", icon: Briefcase },
  { id: "investor", label: "Investor Update", icon: Users },
];

function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatValue(value, format) {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "months":
      return `${value.toFixed(1)} mo`;
    case "number":
      return value.toLocaleString();
    default:
      return value;
  }
}

function calculateChange(current, previous) {
  return ((current - previous) / previous) * 100;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function StatusBadge({ status }) {
  const config = {
    "on-track": { label: "On Track", className: "success" },
    "at-risk": { label: "At Risk", className: "warning" },
    "off-track": { label: "Off Track", className: "danger" },
  };
  const { label, className } = config[status] || config["on-track"];
  return <span className={`status-badge ${className}`}>{label}</span>;
}

function MetricWidget({ label, metric, format = "currency" }) {
  const isReady = metric.state === METRIC_STATE.READY;
  const stateLabel = METRIC_STATE_LABELS[metric.state];
  const sentimentClass =
    metric.sentiment === "positive"
      ? "emerald"
      : metric.sentiment === "negative"
        ? "destructive"
        : "neutral";

  return (
    <div
      className={`metric-widget ${sentimentClass} ${!isReady ? "unavailable" : ""}`}
    >
      <span className="metric-label">{label}</span>
      {isReady ? (
        <span className="metric-value">
          {formatValue(metric.value, format)}
        </span>
      ) : (
        <span className="metric-state">{stateLabel}</span>
      )}
    </div>
  );
}

function OverviewSnapshot({ snapshot }) {
  return (
    <div className="overview-snapshot">
      <div className="snapshot-header">
        <div className="snapshot-title">
          <h2>Financial Overview</h2>
          <StatusBadge status={snapshot.status} />
        </div>
        <span className="board-date">
          <Briefcase size={14} />
          Board:{" "}
          {new Date(snapshot.boardDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="snapshot-highlights">
        {snapshot.highlights.map((item, index) => (
          <div key={index} className={`highlight ${item.sentiment}`}>
            {item.sentiment === "positive" ? (
              <TrendingUp size={14} />
            ) : item.sentiment === "warning" ? (
              <AlertCircle size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPICard({ kpi }) {
  const change = calculateChange(kpi.value, kpi.previous);
  const progress = (kpi.value / kpi.target) * 100;
  const isPositive = change >= 0;

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{kpi.label}</span>
        <span className={`kpi-change ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? (
            <ArrowUpRight size={10} />
          ) : (
            <ArrowDownRight size={10} />
          )}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <div className="kpi-value">{formatValue(kpi.value, kpi.format)}</div>
      <div className="kpi-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="progress-label">{progress.toFixed(0)}% of target</span>
      </div>
    </div>
  );
}

function ReportPurpose() {
  const purposes = [
    { icon: PresentationIcon, label: "Board presentations" },
    { icon: Users, label: "Investor updates" },
    { icon: Target, label: "Strategic planning" },
  ];

  return (
    <div className="report-purpose">
      <div className="panel-header">
        <HelpCircle size={14} />
        <h3>Report Purpose</h3>
      </div>
      <p className="purpose-description">
        This executive overview is designed for:
      </p>
      <ul className="purpose-list">
        {purposes.map((p, i) => (
          <li key={i}>
            <p.icon size={14} />
            <span>{p.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickLinksPanel({ links }) {
  return (
    <div className="quick-links">
      <div className="panel-header">
        <ExternalLink size={14} />
        <h3>Quick Links</h3>
      </div>
      <div className="links-grid">
        {links.map((link) => (
          <a key={link.id} href={link.href} className="quick-link">
            <link.icon size={16} />
            <span>{link.label}</span>
            <ChevronRight size={12} />
          </a>
        ))}
      </div>
    </div>
  );
}

function DataSourcePanel({ source }) {
  const lastSyncTime = new Date(source.lastSync).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="data-source">
      <div className="panel-header">
        <Database size={14} />
        <h3>Data Source</h3>
      </div>
      <div className="source-info">
        <div className="source-row">
          <span className="source-label">Connected Accounts</span>
          <span className="source-value">{source.connectedAccounts}</span>
        </div>
        <div className="source-row">
          <span className="source-label">Last Sync</span>
          <span className="source-value">{lastSyncTime}</span>
        </div>
        <div className="source-institutions">
          {source.institutions.map((inst, i) => (
            <span key={i} className="institution-tag">
              {inst}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalCard({ signal, onAction }) {
  const severityIcons = { high: AlertCircle, medium: Bell, low: Clock };
  const Icon = severityIcons[signal.severity];

  return (
    <div className={`signal-card ${signal.severity} ${signal.status}`}>
      <div className="signal-icon">
        <Icon size={14} />
      </div>
      <div className="signal-content">
        <span className="signal-title">{signal.title}</span>
        <p className="signal-description">{signal.description}</p>
        {signal.status === "pending" && (
          <div className="signal-actions">
            <button
              className="signal-btn primary"
              onClick={() => onAction(signal.id, "review")}
            >
              <Eye size={10} /> Review
            </button>
          </div>
        )}
      </div>
      <span className="signal-time">{signal.timestamp}</span>
    </div>
  );
}

function ComplianceRow({ item }) {
  const statusConfig = {
    ready: { icon: CheckCircle2, className: "ready" },
    pending: { icon: Clock, className: "pending" },
    draft: { icon: FileText, className: "draft" },
  };
  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className="compliance-row">
      <Icon size={12} className={config.className} />
      <span className="compliance-name">{item.name}</span>
      <span className={`compliance-status ${config.className}`}>
        {item.status}
      </span>
    </div>
  );
}

export default function CFOOverview() {
  const [lifecycle, setLifecycle] = useState(LIFECYCLE.LOADING);
  const [data, setData] = useState(null);
  const [signals, setSignals] = useState(defaultSignals);
  const [complianceItems, setComplianceItems] = useState(
    defaultComplianceItems,
  );
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("Q1 2026");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLifecycle(LIFECYCLE.LOADING);
    try {
      const raw = await cfoApi.getDashboard();
      const normalized = normalizeDashboard(raw);
      setData(normalized);

      // Populate AI signals from the dashboard response (if present)
      const rawSignals = raw.signals ?? raw.ai_signals ?? raw.aiSignals ?? [];
      setSignals(
        rawSignals.map((s) => ({
          id: s.id,
          type: s.type ?? s.category ?? "anomaly",
          severity: s.severity ?? "medium",
          title: s.title,
          description: s.description,
          timestamp:
            s.timestamp ??
            (s.created_at ? formatRelativeTime(s.created_at) : "recently"),
          status: s.status ?? "pending",
        })),
      );

      // Populate compliance items from the dashboard response (if present)
      const rawCompliance =
        raw.compliance ?? raw.compliance_items ?? raw.complianceItems ?? [];
      if (rawCompliance.length > 0) {
        setComplianceItems(
          rawCompliance.map((c) => ({
            id: c.id,
            name: c.name ?? c.title,
            status: c.status ?? "pending",
            dueDate: c.due_date ?? c.dueDate ?? null,
          })),
        );
      }

      setLastUpdated(new Date());
      setLifecycle(LIFECYCLE.READY);
    } catch (err) {
      console.warn("[CFOOverview] Failed to fetch dashboard:", err.message);
      setLifecycle(LIFECYCLE.ERROR);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; tracked for page migration
    fetchOverview();
  }, [fetchOverview]);

  const handleRefresh = useCallback(async () => {
    setLifecycle(LIFECYCLE.REFRESHING);
    try {
      const raw = await cfoApi.getDashboard();
      const normalized = normalizeDashboard(raw);
      setData(normalized);
      setLastUpdated(new Date());
      setLifecycle(LIFECYCLE.READY);
    } catch (err) {
      console.warn("[CFOOverview] Refresh failed:", err.message);
      // Stay on current data, just reset lifecycle
      setLifecycle(data ? LIFECYCLE.READY : LIFECYCLE.ERROR);
    }
  }, [data]);

  const handleSignalAction = (id) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "reviewed" } : s)),
    );
  };

  const handleExport = (type) => {
    console.log("Exporting:", type);
    setShowExportMenu(false);
  };

  const pendingSignals = signals.filter((s) => s.status === "pending").length;
  const isLoading = lifecycle === LIFECYCLE.LOADING;
  const isRefreshing = lifecycle === LIFECYCLE.REFRESHING;

  if (isLoading) {
    return (
      <div className="cfo-overview-loading">
        <Loader2 size={36} className="spinning" />
        <p>Loading executive overview...</p>
      </div>
    );
  }

  const { metrics, snapshot, kpis, dataSource } = data;

  return (
    <div className="cfo-overview" data-lifecycle={lifecycle}>
      <PolicyBanner
        policy="accounting"
        context="cfo-overview"
        message="Financial reports are informational only. Please consult a licensed accountant for professional advice."
        dismissible
      />

      <header className="overview-header">
        <div className="header-left">
          <div className="header-title">
            <h1>CFO Overview</h1>
            <span className="cfo-version">v{data.cfo_version}</span>
          </div>
          <p className="header-subtitle">
            Executive snapshot for {metrics.period.value}
          </p>
        </div>
        <div className="header-right">
          <div className="period-selector">
            <Calendar size={14} />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="Q1 2026">Q1 2026</option>
              <option value="Q4 2025">Q4 2025</option>
              <option value="FY 2025">FY 2025</option>
            </select>
          </div>
          <button
            className="header-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
          </button>
          <div className="export-dropdown">
            <button
              className="header-btn primary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export"
            >
              <Download size={16} />
            </button>
            {showExportMenu && (
              <div className="export-menu">
                {exportOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className="export-option"
                    onClick={() => handleExport(opt.id)}
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="overview-grid">
        <main className="primary-column">
          <OverviewSnapshot snapshot={snapshot} />

          <section className="kpi-section">
            <div className="section-header">
              <h2>Key Performance Indicators</h2>
            </div>
            <div className="kpi-grid">
              {kpis.map((kpi) => (
                <KPICard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>

          <div className="insights-row">
            <section className="compliance-section">
              <div className="section-header">
                <h2>
                  <Shield size={14} /> Compliance
                </h2>
              </div>
              <div className="compliance-list">
                {complianceItems.map((item) => (
                  <ComplianceRow key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section className="signals-section">
              <div className="section-header">
                <h2>
                  <Zap size={14} /> AI Signals{" "}
                  {pendingSignals > 0 && (
                    <span className="signal-count">{pendingSignals}</span>
                  )}
                </h2>
                <button className="section-action">
                  <Filter size={12} />
                </button>
              </div>
              <div className="signals-list">
                {signals
                  .filter((s) => s.status !== "dismissed")
                  .map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      onAction={handleSignalAction}
                    />
                  ))}
              </div>
            </section>
          </div>
        </main>

        <aside className="secondary-column">
          <section className="metrics-summary">
            <div className="panel-header">
              <Activity size={14} />
              <h3>Summary Metrics</h3>
            </div>
            <div className="metrics-list">
              <MetricWidget
                label="Total Revenue"
                metric={metrics.totalRevenue}
                format="currency"
              />
              <MetricWidget
                label="Total Expenses"
                metric={metrics.totalExpenses}
                format="currency"
              />
              <MetricWidget
                label="Net Position"
                metric={metrics.netPosition}
                format="currency"
              />
              <MetricWidget
                label="Period"
                metric={metrics.period}
                format="text"
              />
              <MetricWidget
                label="Transactions"
                metric={metrics.transactionCount}
                format="number"
              />
            </div>
          </section>

          <ReportPurpose />
          <QuickLinksPanel links={quickLinks} />
          <DataSourcePanel source={dataSource} />
        </aside>
      </div>

      <footer className="overview-footer">
        <span className="last-updated">
          <Clock size={11} /> Updated:{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="data-source-footer">
          <Building2 size={11} /> {dataSource.connectedAccounts} accounts synced
        </span>
      </footer>
    </div>
  );
}
