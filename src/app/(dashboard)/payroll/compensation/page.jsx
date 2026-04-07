"use client";

import {
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/payroll/PayrollCompensation.css';

const salaryBands = [
  {
    department: 'Engineering',
    headcount: 18,
    min: 120000,
    max: 180000,
    avg: 155000,
    change: '+3.2%',
    trend: 'up',
  },
  {
    department: 'Design',
    headcount: 10,
    min: 95000,
    max: 140000,
    avg: 118000,
    change: '+2.8%',
    trend: 'up',
  },
  {
    department: 'Marketing',
    headcount: 11,
    min: 85000,
    max: 130000,
    avg: 108000,
    change: '+1.5%',
    trend: 'up',
  },
  {
    department: 'Operations',
    headcount: 8,
    min: 75000,
    max: 115000,
    avg: 95000,
    change: '-0.4%',
    trend: 'down',
  },
];

const payrollCalendar = [
  { label: 'Next Pay Date', value: 'Apr 15, 2026' },
  { label: 'Review Cycle', value: 'Jul 2026' },
  { label: 'Bonus Payout', value: 'Dec 2026' },
  { label: 'Open Enrollment', value: 'Nov 2026' },
];

const compensationSummary = [
  { label: 'Base Salary', value: '$3,840,000' },
  { label: 'Bonuses', value: '$384,000' },
  { label: 'Benefits', value: '$312,400' },
  { label: 'Equity/Stock', value: '$86,000' },
];

function formatCurrency(amount) {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function bandPercent(min, max, avg, globalMax) {
  const left = (min / globalMax) * 100;
  const width = ((max - min) / globalMax) * 100;
  const marker = ((avg - min) / (max - min)) * 100;
  return { left, width, marker };
}

export default function PayrollCompensation() {
  const globalMax = Math.max(...salaryBands.map((b) => b.max));

  return (
    <div className="payroll-compensation">
      <PolicyBanner
        policy="general"
        context="compensation-advisory"
        message="Compensation data shown is for planning purposes. Always verify with HR before communicating salary information."
        dismissible
      />

      <header className="comp-header">
        <div className="header-left">
          <div className="header-title">
            <DollarSign size={22} />
            <h1>Compensation</h1>
          </div>
          <p className="header-subtitle">Salary bands and compensation management</p>
        </div>
      </header>

      <div className="comp-layout">
        <main className="comp-main">
          {/* KPI Cards */}
          <section className="comp-kpi-grid">
            <div className="comp-kpi-card">
              <div className="comp-kpi-icon">
                <DollarSign size={18} />
              </div>
              <div className="comp-kpi-content">
                <span className="comp-kpi-label">Total Annual Payroll</span>
                <span className="comp-kpi-value">$4,622,400</span>
                <span className="comp-kpi-change up">
                  <TrendingUp size={12} />
                  +6.1% YoY
                </span>
              </div>
            </div>
            <div className="comp-kpi-card">
              <div className="comp-kpi-icon">
                <BarChart3 size={18} />
              </div>
              <div className="comp-kpi-content">
                <span className="comp-kpi-label">Average Salary</span>
                <span className="comp-kpi-value">$98,350</span>
                <span className="comp-kpi-change up">
                  <TrendingUp size={12} />
                  +2.4% YoY
                </span>
              </div>
            </div>
            <div className="comp-kpi-card">
              <div className="comp-kpi-icon">
                <Users size={18} />
              </div>
              <div className="comp-kpi-content">
                <span className="comp-kpi-label">Departments</span>
                <span className="comp-kpi-value">4</span>
                <span className="comp-kpi-change neutral">47 employees</span>
              </div>
            </div>
            <div className="comp-kpi-card">
              <div className="comp-kpi-icon">
                <Award size={18} />
              </div>
              <div className="comp-kpi-content">
                <span className="comp-kpi-label">Median Salary</span>
                <span className="comp-kpi-value">$112,500</span>
                <span className="comp-kpi-change up">
                  <TrendingUp size={12} />
                  +1.8% YoY
                </span>
              </div>
            </div>
          </section>

          {/* Salary Bands */}
          <section className="comp-panel">
            <div className="panel-header">
              <BarChart3 size={16} />
              <h2>Salary Bands by Department</h2>
            </div>
            <div className="band-table">
              <div className="band-table-header">
                <span>Department</span>
                <span>Headcount</span>
                <span>Range</span>
                <span>Average</span>
                <span>Band</span>
                <span>Change</span>
              </div>
              {salaryBands.map((band) => {
                const pct = bandPercent(band.min, band.max, band.avg, globalMax);
                return (
                  <div key={band.department} className="band-table-row">
                    <span className="band-dept">
                      <Briefcase size={14} />
                      {band.department}
                    </span>
                    <span className="band-headcount">{band.headcount}</span>
                    <span className="band-range">
                      {formatCurrency(band.min)} &ndash; {formatCurrency(band.max)}
                    </span>
                    <span className="band-avg">{formatCurrency(band.avg)}</span>
                    <span className="band-visual">
                      <div className="band-bar-track">
                        <div
                          className="band-bar-fill"
                          style={{ left: `${pct.left}%`, width: `${pct.width}%` }}
                        >
                          <div
                            className="band-bar-marker"
                            style={{ left: `${pct.marker}%` }}
                            title={`Avg: ${formatCurrency(band.avg)}`}
                          />
                        </div>
                      </div>
                    </span>
                    <span className={`band-change ${band.trend}`}>
                      {band.trend === 'up' && <TrendingUp size={12} />}
                      {band.trend === 'down' && <TrendingDown size={12} />}
                      {band.change}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Department Breakdown */}
          <section className="comp-panel">
            <div className="panel-header">
              <Users size={16} />
              <h2>Department Breakdown</h2>
            </div>
            <div className="dept-grid">
              {salaryBands.map((band) => (
                <div key={band.department} className="dept-card">
                  <div className="dept-card-header">
                    <Briefcase size={14} />
                    <span className="dept-card-name">{band.department}</span>
                    <span className="dept-card-count">{band.headcount} people</span>
                  </div>
                  <div className="dept-card-body">
                    <div className="dept-stat">
                      <span className="dept-stat-label">Min</span>
                      <span className="dept-stat-value">{formatCurrency(band.min)}</span>
                    </div>
                    <div className="dept-stat">
                      <span className="dept-stat-label">Avg</span>
                      <span className="dept-stat-value highlight">{formatCurrency(band.avg)}</span>
                    </div>
                    <div className="dept-stat">
                      <span className="dept-stat-label">Max</span>
                      <span className="dept-stat-value">{formatCurrency(band.max)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="comp-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Calendar size={14} />
              <h3>Payroll Calendar</h3>
            </div>
            <div className="sidebar-list">
              {payrollCalendar.map((item) => (
                <div key={item.label} className="sidebar-row">
                  <span className="sidebar-label">{item.label}</span>
                  <span className="sidebar-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-panel">
            <div className="panel-header">
              <DollarSign size={14} />
              <h3>Compensation Summary</h3>
            </div>
            <div className="sidebar-list">
              {compensationSummary.map((item) => (
                <div key={item.label} className="sidebar-row">
                  <span className="sidebar-label">{item.label}</span>
                  <span className="sidebar-value">{item.value}</span>
                </div>
              ))}
              <div className="sidebar-row total">
                <span className="sidebar-label">Total</span>
                <span className="sidebar-value">$4,622,400</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
