"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/cfo/CFOOverview.css";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  HelpCircle,
  LineChart,
  Loader2,
  PresentationIcon,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

// Mock API response
const mockApiResponse = {
  cfo_version: "2.1.0",
  lifecycle: "ready",
  reason_code: null,
  reason_message: null,
  metrics: {
    totalRevenue: {
      value: 847500,
      state: METRIC_STATE.READY,
      sentiment: "positive",
    },
    totalExpenses: {
      value: 557850,
      state: METRIC_STATE.READY,
      sentiment: "negative",
    },
    netPosition: {
      value: 289650,
      state: METRIC_STATE.READY,
      sentiment: "positive",
    },
    period: { value: "Q1 2026", state: METRIC_STATE.READY },
    transactionCount: { value: 1247, state: METRIC_STATE.READY },
  },
  snapshot: {
    status: "on-track",
    highlights: [
      { text: "Revenue up 12.3% vs prior quarter", sentiment: "positive" },
      { text: "Operating margin improved to 34.2%", sentiment: "positive" },
      { text: "Cash position strong at $2.4M", sentiment: "positive" },
      { text: "AR aging exceeds 45 days for 3 accounts", sentiment: "warning" },
    ],
    boardDate: "2026-04-15",
  },
  kpis: [
    {
      id: "revenue",
      label: "Revenue",
      value: 847500,
      target: 900000,
      previous: 754200,
      format: "currency",
    },
    {
      id: "ebitda",
      label: "EBITDA",
      value: 289650,
      target: 315000,
      previous: 248400,
      format: "currency",
    },
    {
      id: "margin",
      label: "Op. Margin",
      value: 34.2,
      target: 35.0,
      previous: 32.9,
      format: "percentage",
    },
    {
      id: "runway",
      label: "Runway",
      value: 18.5,
      target: 24,
      previous: 16.2,
      format: "months",
    },
  ],
  dataSource: {
    connectedAccounts: 4,
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    institutions: ["Chase", "Bank of America", "Stripe", "QuickBooks"],
  },
};

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

const aiSignals = [
  {
    id: 1,
    type: "anomaly",
    severity: "high",
    title: "Unusual expense pattern",
    description: "Marketing spend +47% without logged campaigns.",
    timestamp: "2h ago",
    status: "pending",
  },
  {
    id: 2,
    type: "forecast",
    severity: "medium",
    title: "Revenue forecast alert",
    description: "Q2 may fall 8% below target based on pipeline.",
    timestamp: "5h ago",
    status: "pending",
  },
];

const complianceItems = [
  { id: 1, name: "Q1 Financials", status: "ready", dueDate: "2026-04-10" },
  { id: 2, name: "Tax Filing", status: "pending", dueDate: "2026-04-15" },
  { id: 3, name: "Board Deck", status: "draft", dueDate: "2026-04-15" },
];

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
  const [signals, setSignals] = useState(aiSignals);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState("Q1 2026");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLifecycle(LIFECYCLE.LOADING);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setData(mockApiResponse);
      setLifecycle(LIFECYCLE.READY);
    } catch {
      setLifecycle(LIFECYCLE.ERROR);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch
    fetchOverview();
  }, [fetchOverview]);

  const handleRefresh = async () => {
    setLifecycle(LIFECYCLE.REFRESHING);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLastUpdated(new Date());
    setLifecycle(LIFECYCLE.READY);
  };

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
