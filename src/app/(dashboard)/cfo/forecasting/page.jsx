"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/cfo/CFOForecasting.css";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  Info,
  LayoutDashboard,
  LineChart,
  Loader2,
  Play,
  Shield,
  Sliders,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const FORECAST_PERIODS = [
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "90 Days", value: 90 },
  { label: "6 Months", value: 180 },
  { label: "12 Months", value: 365 },
];

const SCENARIOS = [
  {
    id: "baseline",
    label: "Baseline",
    description: "Current trajectory with no changes",
  },
  { id: "growth", label: "Growth", description: "+20% revenue, +10% expenses" },
  {
    id: "conservative",
    label: "Conservative",
    description: "-10% revenue, same expenses",
  },
  { id: "hiring", label: "Hiring Plan", description: "+5 headcount by Q3" },
];

const mockForecast = {
  revenue: {
    current: 847500,
    projected: 920000,
    change: 8.5,
    confidence: 0.78,
  },
  expenses: {
    current: 557850,
    projected: 595000,
    change: 6.7,
    confidence: 0.85,
  },
  netIncome: {
    current: 289650,
    projected: 325000,
    change: 12.2,
    confidence: 0.72,
  },
  cashPosition: {
    current: 2400000,
    projected: 2615000,
    change: 9.0,
    confidence: 0.8,
  },
  runway: { current: 18.5, projected: 19.2, confidence: 0.75 },
};

const quickLinks = [
  {
    label: "Executive Summary",
    path: "/cfo/executive-summary",
    icon: FileText,
  },
  { label: "CFO Overview", path: "/cfo", icon: LayoutDashboard },
  { label: "Cash Flow", path: "/cfo/cash-flow", icon: DollarSign },
  { label: "Compliance", path: "/cfo/compliance", icon: Shield },
];

function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function ForecastCard({
  title,
  icon: Icon,
  current,
  projected,
  change,
  confidence,
  unit,
}) {
  const isPositive = change >= 0;
  const fmtCurrent =
    unit === "months" ? `${current} mo` : formatCurrency(current);
  const fmtProjected =
    unit === "months" ? `${projected} mo` : formatCurrency(projected);

  return (
    <div className="forecast-card">
      <div className="forecast-card-header">
        <div className="forecast-icon">
          <Icon size={18} />
        </div>
        <h3>{title}</h3>
        <span
          className={`forecast-change ${isPositive ? "positive" : "negative"}`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
      <div className="forecast-values">
        <div className="forecast-current">
          <span className="value-label">Current</span>
          <span className="value-amount">{fmtCurrent}</span>
        </div>
        <div className="forecast-arrow">→</div>
        <div className="forecast-projected">
          <span className="value-label">Projected</span>
          <span className="value-amount">{fmtProjected}</span>
        </div>
      </div>
      <div className="forecast-confidence">
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className="confidence-label">
          {Math.round(confidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
}

export default function CFOForecasting() {
  const [selectedPeriod, setSelectedPeriod] = useState(90);
  const [selectedScenario, setSelectedScenario] = useState("baseline");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunForecast = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRunning(false);
  };

  return (
    <div className="cfo-forecasting">
      <PolicyBanner
        policy="general"
        context="forecasting-advisory"
        message="Forecasts are projections based on historical patterns and assumptions. They do not constitute financial advice and should be validated by your finance team."
        dismissible
      />

      <div className="forecasting-layout">
        <main className="forecasting-main">
          {/* Header */}
          <header className="forecasting-header">
            <div className="header-left">
              <div className="header-title">
                <TrendingUp size={22} />
                <h1>Forecasting</h1>
              </div>
              <p className="header-subtitle">
                Revenue projections and financial modeling
              </p>
            </div>
            <div className="header-right">
              <button
                className="run-forecast-btn"
                onClick={handleRunForecast}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 size={16} className="spinning" /> Running...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Forecast
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Controls */}
          <div className="forecast-controls">
            <div className="control-group">
              <label>Forecast Period</label>
              <div className="period-buttons">
                {FORECAST_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    className={`period-btn ${selectedPeriod === period.value ? "active" : ""}`}
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <label>Scenario</label>
              <div className="scenario-buttons">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    className={`scenario-card ${selectedScenario === scenario.id ? "selected" : ""}`}
                    onClick={() => setSelectedScenario(scenario.id)}
                  >
                    <span className="scenario-label">{scenario.label}</span>
                    <span className="scenario-description">
                      {scenario.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Forecast Cards */}
          <section className="forecast-grid">
            <ForecastCard
              title="Revenue"
              icon={DollarSign}
              {...mockForecast.revenue}
            />
            <ForecastCard
              title="Expenses"
              icon={TrendingDown}
              {...mockForecast.expenses}
            />
            <ForecastCard
              title="Net Income"
              icon={BarChart3}
              {...mockForecast.netIncome}
            />
            <ForecastCard
              title="Cash Position"
              icon={LineChart}
              {...mockForecast.cashPosition}
            />
          </section>

          {/* Runway Projection */}
          <section className="runway-projection">
            <div className="runway-header">
              <Calendar size={16} />
              <h2>Runway Projection</h2>
            </div>
            <div className="runway-content">
              <div className="runway-current">
                <span className="runway-label">Current Runway</span>
                <span className="runway-value">
                  {mockForecast.runway.current} months
                </span>
              </div>
              <div className="runway-arrow">→</div>
              <div className="runway-projected">
                <span className="runway-label">
                  Projected ({selectedPeriod}d)
                </span>
                <span className="runway-value">
                  {mockForecast.runway.projected} months
                </span>
              </div>
              <div className="runway-confidence">
                <span>
                  {Math.round(mockForecast.runway.confidence * 100)}% confidence
                </span>
              </div>
            </div>
            <p className="runway-note">
              Based on{" "}
              {SCENARIOS.find(
                (s) => s.id === selectedScenario,
              )?.label.toLowerCase()}{" "}
              scenario and {selectedPeriod}-day forecast horizon.
            </p>
          </section>

          {/* Assumptions */}
          <section className="assumptions-panel">
            <div className="assumptions-header">
              <Sliders size={16} />
              <h2>Model Assumptions</h2>
            </div>
            <div className="assumptions-grid">
              <div className="assumption-item">
                <span className="assumption-label">Revenue Growth Rate</span>
                <span className="assumption-value">18.7% YoY</span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Expense Growth Rate</span>
                <span className="assumption-value">12.0% YoY</span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Pipeline Conversion</span>
                <span className="assumption-value">38% (historical: 44%)</span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Churn Rate</span>
                <span className="assumption-value">2.4% monthly</span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Avg. Deal Size</span>
                <span className="assumption-value">$18,500</span>
              </div>
              <div className="assumption-item">
                <span className="assumption-label">Collections (DSO)</span>
                <span className="assumption-value">32 days</span>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="forecasting-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Target size={14} />
              <h3>Forecast Summary</h3>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span className="summary-label">Period</span>
                <span className="summary-value">{selectedPeriod} days</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Scenario</span>
                <span className="summary-value">
                  {SCENARIOS.find((s) => s.id === selectedScenario)?.label}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Last Run</span>
                <span className="summary-value">Just now</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Data Source</span>
                <span className="summary-value">Historical (90d)</span>
              </div>
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <Info size={14} />
              <h3>About Forecasting</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Revenue Projections</strong>
                <br />
                Based on pipeline, historical conversion rates, and seasonal
                patterns.
              </p>
              <p>
                <strong>Expense Modeling</strong>
                <br />
                Projects operational costs based on planned headcount and
                historical trends.
              </p>
              <p>
                <strong>Scenario Analysis</strong>
                <br />
                Compare baseline, growth, and conservative scenarios to plan for
                uncertainty.
              </p>
              <p>
                <strong>Confidence Levels</strong>
                <br />
                Higher confidence indicates more historical data supporting the
                projection.
              </p>
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <ChevronRight size={14} />
              <h3>Quick Links</h3>
            </div>
            <div className="quick-links">
              {quickLinks.map((link, index) => (
                <Link key={index} href={link.path} className="quick-link">
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
