"use client";

import { Brain, Clock, Eye, RefreshCw, Shield, Tag, Zap } from "lucide-react";
import { useState } from "react";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/core/CoreIntelligence.css";

const SIGNALS = [
  {
    id: "sig-001",
    title: "Duplicate Transaction Detected",
    severity: "high",
    confidence: 0.89,
    category: "Transaction Accuracy",
    description:
      "2 potential duplicate entries totaling $4,200 detected in the past 7 days between checking and credit card accounts.",
    detectedAt: "2026-03-29T14:22:00Z",
  },
  {
    id: "sig-002",
    title: "Uncategorized Expenses Growing",
    severity: "medium",
    confidence: 0.76,
    category: "Data Quality",
    description:
      "12 transactions totaling $3,850 remain uncategorized for more than 14 days, which may affect report accuracy.",
    detectedAt: "2026-03-28T09:15:00Z",
  },
  {
    id: "sig-003",
    title: "Bank Reconciliation Overdue",
    severity: "high",
    confidence: 0.93,
    category: "Account Health",
    description:
      "The primary checking account has not been reconciled in 32 days. Last reconciliation was completed on Feb 26, 2026.",
    detectedAt: "2026-03-30T08:00:00Z",
  },
  {
    id: "sig-004",
    title: "Tax Document Gap",
    severity: "medium",
    confidence: 0.71,
    category: "Tax Readiness",
    description:
      "3 vendors with payments exceeding $600 are missing W-9 forms, which may be needed for 1099 filing.",
    detectedAt: "2026-03-27T16:40:00Z",
  },
];

function SeverityBadge({ severity }) {
  return (
    <span className={`ci-severity-badge ${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : "low";
  return (
    <span className={`ci-confidence-badge ${level}`}>
      {percentage}% confidence
    </span>
  );
}

function CategoryTag({ category }) {
  return (
    <span className="ci-category-tag">
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
    <div className={`ci-signal-card ${signal.severity}`}>
      <div className="ci-signal-header">
        <div className="ci-signal-badges">
          <SeverityBadge severity={signal.severity} />
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
        <span className="ci-signal-time">
          <Clock size={11} />
          {timeAgo}
        </span>
      </div>
      <h3 className="ci-signal-title">{signal.title}</h3>
      <p className="ci-signal-description">{signal.description}</p>
      <div className="ci-signal-footer">
        <CategoryTag category={signal.category} />
        <button className="ci-details-btn">
          <Eye size={12} />
          Details
        </button>
      </div>
    </div>
  );
}

export default function CoreIntelligence() {
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
    <div className="core-intelligence">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="core-intelligence"
        message="Core Intelligence provides AI-generated advisory insights only. These signals support accounting accuracy but do not replace professional accounting advice."
        dismissible
      />

      {/* Header */}
      <header className="ci-header">
        <div className="ci-header-left">
          <div className="ci-header-title">
            <Brain size={22} />
            <h1>Core Intelligence</h1>
          </div>
          <p className="ci-header-subtitle">
            AI-powered bookkeeping and accounting insights
          </p>
        </div>
        <div className="ci-header-right">
          <button
            className="ci-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Signals Summary */}
      <div className="ci-signals-summary">
        <div className="ci-summary-left">
          <Zap size={14} />
          <span>
            {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
          </span>
        </div>
        <div className="ci-summary-right">
          <span className="ci-summary-count high">
            {signals.filter((s) => s.severity === "high").length} High
          </span>
          <span className="ci-summary-count medium">
            {signals.filter((s) => s.severity === "medium").length} Medium
          </span>
          <span className="ci-summary-count low">
            {signals.filter((s) => s.severity === "low").length} Low
          </span>
        </div>
      </div>

      {/* Signal Cards */}
      <div className="ci-signals-grid">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Disclaimer Footer */}
      <div className="ci-disclaimer-footer">
        <Shield size={14} />
        <div>
          <strong>AI-Generated Bookkeeping Intelligence</strong>
          <p>
            Core Intelligence provides AI-generated advisory insights into your
            bookkeeping data. These signals support accounting accuracy but do
            not replace professional accounting advice.
          </p>
        </div>
      </div>
    </div>
  );
}
