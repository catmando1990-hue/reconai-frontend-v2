"use client";

import { Brain, Clock, Eye, RefreshCw, Shield, Tag, Zap } from "lucide-react";
import { useState } from "react";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/invoicing/InvoicingIntelligence.css";

const SIGNALS = [
  {
    id: "sig-001",
    title: "Overdue Invoice Concentration",
    severity: "high",
    confidence: 0.89,
    category: "Accounts Receivable",
    description:
      "One customer (Global Tech Solutions) accounts for 100% of overdue receivables ($12,350). Consider proactive outreach and review of credit terms for concentrated exposure.",
    detectedAt: "2026-03-29T14:22:00Z",
  },
  {
    id: "sig-002",
    title: "Payment Terms Mismatch",
    severity: "medium",
    confidence: 0.76,
    category: "Cash Flow",
    description:
      "Average customer payment cycle (34 days) exceeds vendor payment terms (Net 25). This timing gap may create periodic cash flow pressure.",
    detectedAt: "2026-03-28T09:15:00Z",
  },
  {
    id: "sig-003",
    title: "Invoice Aging Trend",
    severity: "low",
    confidence: 0.92,
    category: "Accounts Receivable",
    description:
      "Average days sales outstanding (DSO) has improved from 38 to 32 days over the past quarter. Collection processes are trending positively.",
    detectedAt: "2026-03-30T08:00:00Z",
  },
  {
    id: "sig-004",
    title: "Vendor Payment Optimization",
    severity: "medium",
    confidence: 0.81,
    category: "Accounts Payable",
    description:
      "2 vendors offer early payment discounts (2/10 Net 30) that are not being utilized. Potential annual savings of $1,240 if discounts are captured.",
    detectedAt: "2026-03-27T16:40:00Z",
  },
];

function SeverityBadge({ severity }) {
  return (
    <span className={`ini-severity-badge ${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : "low";
  return (
    <span className={`ini-confidence-badge ${level}`}>
      {percentage}% confidence
    </span>
  );
}

function CategoryTag({ category }) {
  return (
    <span className="ini-category-tag">
      <Tag size={11} />
      {category}
    </span>
  );
}

function formatTimeAgo(dateString) {
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

function SignalCard({ signal }) {
  const timeAgo = formatTimeAgo(signal.detectedAt);

  return (
    <div className={`ini-signal-card ${signal.severity}`}>
      <div className="ini-signal-header">
        <div className="ini-signal-badges">
          <SeverityBadge severity={signal.severity} />
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
        <span className="ini-signal-time">
          <Clock size={11} />
          {timeAgo}
        </span>
      </div>
      <h3 className="ini-signal-title">{signal.title}</h3>
      <p className="ini-signal-description">{signal.description}</p>
      <div className="ini-signal-footer">
        <CategoryTag category={signal.category} />
        <button className="ini-details-btn">
          <Eye size={12} />
          Details
        </button>
      </div>
    </div>
  );
}

export default function InvoicingIntelligence() {
  const [signals, setSignals] = useState(SIGNALS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSignals([...SIGNALS]);
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="invoicing-intelligence">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="invoicing-intelligence"
        message="Invoicing Intelligence provides AI-generated insights for accounts receivable, accounts payable, and payment optimization. These signals do not constitute financial advice."
        dismissible
      />

      {/* Header */}
      <header className="ini-header">
        <div className="ini-header-left">
          <div className="ini-header-title">
            <Brain size={22} />
            <h1>Invoicing Intelligence</h1>
          </div>
          <p className="ini-header-subtitle">
            AI-powered receivables, payables, and payment insights
          </p>
        </div>
        <div className="ini-header-right">
          <button
            className="ini-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Signals Summary */}
      <div className="ini-signals-summary">
        <div className="ini-summary-left">
          <Zap size={14} />
          <span>
            {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
          </span>
        </div>
        <div className="ini-summary-right">
          <span className="ini-summary-count high">
            {signals.filter((s) => s.severity === "high").length} High
          </span>
          <span className="ini-summary-count medium">
            {signals.filter((s) => s.severity === "medium").length} Medium
          </span>
          <span className="ini-summary-count low">
            {signals.filter((s) => s.severity === "low").length} Low
          </span>
        </div>
      </div>

      {/* Signal Cards */}
      <div className="ini-signals-grid">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Disclaimer Footer */}
      <div className="ini-disclaimer-footer">
        <Shield size={14} />
        <div>
          <strong>AI-Generated Invoicing Intelligence</strong>
          <p>
            These signals are generated from invoice, payment, and billing data.
            They are intended to support collections and payment management and
            do not constitute financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
