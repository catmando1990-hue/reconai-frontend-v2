"use client";

import { Brain, Clock, Eye, RefreshCw, Shield, Tag, Zap } from "lucide-react";
import { useState } from "react";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/payroll/PayrollIntelligence.css";

const SIGNALS = [
  {
    id: "sig-001",
    title: "Overtime Threshold Alert",
    severity: "high",
    confidence: 0.87,
    category: "Labor Compliance",
    description:
      "3 employees have exceeded a 45-hour/week average over the past 4 weeks. Continued overtime may trigger additional labor compliance obligations and increased premium pay exposure.",
    detectedAt: "2026-03-29T14:22:00Z",
  },
  {
    id: "sig-002",
    title: "Compensation Below Market",
    severity: "medium",
    confidence: 0.72,
    category: "Retention Risk",
    description:
      "2 engineering roles are compensated below the 10th percentile for their market and experience band. This may increase attrition risk in the next quarter.",
    detectedAt: "2026-03-28T09:15:00Z",
  },
  {
    id: "sig-003",
    title: "Tax Withholding Variance",
    severity: "low",
    confidence: 0.91,
    category: "Tax Compliance",
    description:
      "Q1 federal tax withholding is running 3.2% above projected amounts. This may result in over-withholding and could affect employee take-home expectations.",
    detectedAt: "2026-03-30T08:00:00Z",
  },
  {
    id: "sig-004",
    title: "Benefits Enrollment Gap",
    severity: "medium",
    confidence: 0.78,
    category: "Benefits",
    description:
      "4 eligible employees have not enrolled in the company 401(k) plan despite meeting the eligibility threshold. Consider targeted outreach during the next enrollment window.",
    detectedAt: "2026-03-27T16:40:00Z",
  },
];

function SeverityBadge({ severity }) {
  return (
    <span className={`pi-severity-badge ${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : "low";
  return (
    <span className={`pi-confidence-badge ${level}`}>
      {percentage}% confidence
    </span>
  );
}

function CategoryTag({ category }) {
  return (
    <span className="pi-category-tag">
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
    <div className={`pi-signal-card ${signal.severity}`}>
      <div className="pi-signal-header">
        <div className="pi-signal-badges">
          <SeverityBadge severity={signal.severity} />
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
        <span className="pi-signal-time">
          <Clock size={11} />
          {timeAgo}
        </span>
      </div>
      <h3 className="pi-signal-title">{signal.title}</h3>
      <p className="pi-signal-description">{signal.description}</p>
      <div className="pi-signal-footer">
        <CategoryTag category={signal.category} />
        <button className="pi-details-btn">
          <Eye size={12} />
          Details
        </button>
      </div>
    </div>
  );
}

export default function PayrollIntelligence() {
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
    <div className="payroll-intelligence">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="payroll-intelligence"
        message="Payroll Intelligence provides AI-generated advisory insights only. These signals support workforce planning but do not replace professional HR or legal counsel."
        dismissible
      />

      {/* Header */}
      <header className="pi-header">
        <div className="pi-header-left">
          <div className="pi-header-title">
            <Brain size={22} />
            <h1>Payroll Intelligence</h1>
          </div>
          <p className="pi-header-subtitle">
            AI-powered workforce and compensation insights
          </p>
        </div>
        <div className="pi-header-right">
          <button
            className="pi-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Signals Summary */}
      <div className="pi-signals-summary">
        <div className="pi-summary-left">
          <Zap size={14} />
          <span>
            {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
          </span>
        </div>
        <div className="pi-summary-right">
          <span className="pi-summary-count high">
            {signals.filter((s) => s.severity === "high").length} High
          </span>
          <span className="pi-summary-count medium">
            {signals.filter((s) => s.severity === "medium").length} Medium
          </span>
          <span className="pi-summary-count low">
            {signals.filter((s) => s.severity === "low").length} Low
          </span>
        </div>
      </div>

      {/* Signal Cards */}
      <div className="pi-signals-grid">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Disclaimer Footer */}
      <div className="pi-disclaimer-footer">
        <Shield size={14} />
        <div>
          <strong>AI-Generated Workforce Intelligence</strong>
          <p>
            These signals are generated from payroll, time-tracking, and
            compensation data. They are intended as inputs for HR and management
            review and do not constitute employment, legal, or tax advice.
          </p>
        </div>
      </div>
    </div>
  );
}
