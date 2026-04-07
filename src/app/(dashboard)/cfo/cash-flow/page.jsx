"use client";

import Link from "next/link";

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Info,
  Loader2,
  Shield,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  LineChart,
  Building2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  FileBarChart,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';

import { cfoApi, reportsApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/cfo/CFOCashFlow.css';

// Cash flow sections configuration
const cashFlowSections = [
  {
    id: 'position',
    title: 'Cash Position',
    icon: Wallet,
    description: 'Current cash balances across all connected accounts, updated in real-time.',
    status: 'awaiting',
  },
  {
    id: 'inflows',
    title: 'Inflows',
    icon: ArrowDownLeft,
    description: 'Incoming cash from revenue, receivables, investments, and other sources.',
    status: 'awaiting',
  },
  {
    id: 'outflows',
    title: 'Outflows',
    icon: ArrowUpRight,
    description: 'Outgoing cash for expenses, payables, payroll, and operational costs.',
    status: 'awaiting',
  },
  {
    id: 'projections',
    title: 'Projections',
    icon: LineChart,
    description: 'Forward-looking cash flow forecasts based on historical patterns and scheduled transactions.',
    status: 'awaiting',
  },
];

// Cash summary rows
const cashSummaryRows = [
  { label: 'Current Balance', icon: DollarSign },
  { label: '30-Day Inflows', icon: TrendingUp },
  { label: '30-Day Outflows', icon: TrendingDown },
  { label: 'Net Cash Flow', icon: BarChart3 },
];

// Quick links
const quickLinks = [
  { label: 'Executive Summary', path: '/cfo/executive-summary', icon: FileText },
  { label: 'CFO Overview', path: '/cfo', icon: LayoutDashboard },
  { label: 'Financial Reports', path: '/core/reports', icon: FileBarChart },
  { label: 'Compliance', path: '/cfo', icon: CheckSquare },
];

function SectionCard({ section, hasData }) {
  const Icon = section.icon;

  return (
    <div className="cashflow-section-card">
      <div className="section-icon">
        <Icon size={20} />
      </div>
      <div className="section-content">
        <h3>{section.title}</h3>
        <p>{section.description}</p>
      </div>
      {hasData ? (
        <div className="section-status ready">
          <CheckSquare size={12} />
          <span>Data available</span>
        </div>
      ) : (
        <div className="section-status awaiting">
          <Clock size={12} />
          <span>Awaiting data</span>
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return null;
  if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function CashSummaryRow({ row, value }) {
  const Icon = row.icon;
  const displayValue = value !== null && value !== undefined ? formatCurrency(value) : null;

  return (
    <div className="summary-row">
      <div className="summary-label">
        <Icon size={14} />
        <span>{row.label}</span>
      </div>
      {displayValue ? (
        <div className="summary-value">
          <span>{displayValue}</span>
        </div>
      ) : (
        <div className="summary-value awaiting">
          <Clock size={11} />
          <span>Awaiting data</span>
        </div>
      )}
    </div>
  );
}

export default function CFOCashFlow() {
  const [loading, setLoading] = useState(true);
  const [cashData, setCashData] = useState(null);

  const fetchCashFlow = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from both cash-flow endpoints in parallel
      const [cfInsights, cfReport] = await Promise.all([
        cfoApi.getCashflowInsights().catch(err => {
          console.warn('[CFOCashFlow] Failed to fetch cashflow insights:', err.message);
          return null;
        }),
        reportsApi.getCashFlow({
          startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
        }).catch(err => {
          console.warn('[CFOCashFlow] Failed to fetch cash flow report:', err.message);
          return null;
        }),
      ]);

      // Normalize whichever source(s) responded
      const insights = cfInsights || {};
      const report = cfReport || {};

      setCashData({
        currentBalance: insights.current_balance ?? insights.currentBalance ?? report.current_balance ?? report.currentBalance ?? null,
        inflows30d: insights.inflows_30d ?? insights.inflows30d ?? report.total_inflows ?? report.totalInflows ?? null,
        outflows30d: insights.outflows_30d ?? insights.outflows30d ?? report.total_outflows ?? report.totalOutflows ?? null,
        netCashFlow: insights.net_cash_flow ?? insights.netCashFlow ?? report.net_cash_flow ?? report.netCashFlow ?? null,
        hasPosition: !!(insights.current_balance ?? insights.currentBalance ?? report.current_balance ?? report.currentBalance),
        hasInflows: !!(insights.inflows_30d ?? insights.inflows30d ?? report.total_inflows ?? report.totalInflows),
        hasOutflows: !!(insights.outflows_30d ?? insights.outflows30d ?? report.total_outflows ?? report.totalOutflows),
        hasProjections: !!(insights.projections ?? insights.forecast ?? report.projections),
      });
    } catch (err) {
      console.warn('[CFOCashFlow] Failed to fetch cash flow data:', err.message);
      // Keep null — page shows awaiting-data state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  // Map summary row labels to cashData fields
  const summaryValues = cashData ? [
    cashData.currentBalance,
    cashData.inflows30d,
    cashData.outflows30d,
    cashData.netCashFlow,
  ] : [null, null, null, null];

  // Determine which sections have data
  const sectionHasData = cashData ? {
    position: cashData.hasPosition,
    inflows: cashData.hasInflows,
    outflows: cashData.hasOutflows,
    projections: cashData.hasProjections,
  } : {};

  const hasAnyData = cashData && (cashData.hasPosition || cashData.hasInflows || cashData.hasOutflows);

  return (
    <div className="cfo-cashflow">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="general"
        context="cashflow-advisory"
        message="Insights are advisory and explainable. Projections are based on historical patterns. This does not constitute financial advice. No writes or auto-actions are performed."
        dismissible
      />

      <div className="cashflow-layout">
        {/* Main Content */}
        <main className="cashflow-main">
          {/* Header */}
          <header className="cashflow-header">
            <div className="header-title">
              <h1>Cash Flow</h1>
              <span className="header-badge">Analysis</span>
            </div>
            <p className="header-subtitle">
              Track cash movement, monitor liquidity, and forecast short-term cash needs.
            </p>
          </header>

          {loading ? (
            <div className="cashflow-loading">
              <Loader2 size={28} className="spinning" />
              <p>Loading cash flow data...</p>
            </div>
          ) : (
            <>
              {/* Cash Flow Sections */}
              <section className="cashflow-sections">
                <div className="sections-header">
                  <h2>Cash Flow Analysis</h2>
                </div>
                <div className="sections-grid">
                  {cashFlowSections.map(section => (
                    <SectionCard key={section.id} section={section} hasData={!!sectionHasData[section.id]} />
                  ))}
                </div>
              </section>

              {/* Empty State - only show when there is truly no data */}
              {!hasAnyData && (
                <div className="cashflow-empty">
                  <div className="empty-icon">
                    <Building2 size={32} />
                  </div>
                  <h3>No cash flow data available</h3>
                  <p>Connect your bank accounts to see cash flow analysis, track inflows and outflows, and generate projections.</p>
                  <Link to="/cfo/connections" className="empty-action">
                    Connect Bank Accounts
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="cashflow-sidebar">
          {/* Cash Summary Panel */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Wallet size={14} />
              <h3>Cash Summary</h3>
            </div>
            <div className="summary-list">
              {cashSummaryRows.map((row, index) => (
                <CashSummaryRow key={index} row={row} value={summaryValues[index]} />
              ))}
            </div>
          </div>

          {/* About Cash Flow Panel */}
          <div className="sidebar-panel about-panel">
            <div className="panel-header">
              <Info size={14} />
              <h3>About Cash Flow</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Cash Movement Visibility</strong><br />
                Track all cash inflows and outflows across your connected accounts in real-time.
              </p>
              <p>
                <strong>Short-Horizon Projections</strong><br />
                Forecast cash positions for the next 30, 60, or 90 days based on historical patterns and scheduled transactions.
              </p>
              <p>
                <strong>Advisory Use Only</strong><br />
                All insights and projections are for informational purposes. Consult your financial advisor for decisions.
              </p>
            </div>
          </div>

          {/* Quick Links Panel */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <ChevronRight size={14} />
              <h3>Quick Links</h3>
            </div>
            <div className="quick-links">
              {quickLinks.map((link, index) => (
                <Link key={index} to={link.path} className="quick-link">
                  <link.icon size={14} />
                  <span>{link.label}</span>
                  <ChevronRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
