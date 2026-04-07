"use client";

import {
  Calendar,
  CheckCircle,
  ClipboardList,
  DollarSign,
  Heart,
  Percent,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/payroll/PayrollBenefits.css';

const benefitsPlans = [
  {
    name: 'Medical PPO',
    type: 'Medical',
    enrolled: 38,
    monthlyCost: '$450/mo',
    contribution: '80%',
  },
  {
    name: 'Dental',
    type: 'Dental',
    enrolled: 35,
    monthlyCost: '$45/mo',
    contribution: '100%',
  },
  {
    name: 'Vision',
    type: 'Vision',
    enrolled: 32,
    monthlyCost: '$18/mo',
    contribution: '100%',
  },
  {
    name: '401(k)',
    type: 'Retirement',
    enrolled: 41,
    monthlyCost: '6% match',
    contribution: '6% match',
  },
  {
    name: 'FSA',
    type: 'Spending Account',
    enrolled: 22,
    monthlyCost: '$2,850 limit',
    contribution: 'N/A',
  },
  {
    name: 'Life Insurance',
    type: 'Insurance',
    enrolled: 47,
    monthlyCost: '$12/mo',
    contribution: '100%',
  },
];

const openEnrollment = [
  { label: 'Enrollment Window', value: 'Nov 1 \u2013 Nov 30' },
  { label: 'Plan Year', value: 'Jan 1 \u2013 Dec 31' },
  { label: 'Status', value: 'Closed' },
  { label: 'Next Open Enrollment', value: 'Nov 2026' },
];

const benefitsSummary = [
  { label: 'Medical & Dental', value: '$198,600' },
  { label: 'Vision', value: '$6,912' },
  { label: 'Retirement (401k)', value: '$86,400' },
  { label: 'Life & Other', value: '$20,488' },
];

export default function PayrollBenefits() {
  return (
    <div className="payroll-benefits">
      <PolicyBanner
        policy="general"
        context="benefits-advisory"
        message="Benefits data shown is for planning purposes. Always verify with your benefits administrator before making enrollment decisions."
        dismissible
      />

      <header className="benefits-header">
        <div className="header-left">
          <div className="header-title">
            <Heart size={22} />
            <h1>Benefits</h1>
          </div>
          <p className="header-subtitle">Employee benefits and deductions</p>
        </div>
      </header>

      <div className="benefits-layout">
        <main className="benefits-main">
          {/* KPI Cards */}
          <section className="benefits-kpi-grid">
            <div className="benefits-kpi-card">
              <div className="benefits-kpi-icon">
                <DollarSign size={18} />
              </div>
              <div className="benefits-kpi-content">
                <span className="benefits-kpi-label">Total Benefits Cost</span>
                <span className="benefits-kpi-value">$312,400/yr</span>
              </div>
            </div>
            <div className="benefits-kpi-card">
              <div className="benefits-kpi-icon">
                <UserCheck size={18} />
              </div>
              <div className="benefits-kpi-content">
                <span className="benefits-kpi-label">Enrollment Rate</span>
                <span className="benefits-kpi-value">92%</span>
              </div>
            </div>
            <div className="benefits-kpi-card">
              <div className="benefits-kpi-icon">
                <ClipboardList size={18} />
              </div>
              <div className="benefits-kpi-content">
                <span className="benefits-kpi-label">Plans Offered</span>
                <span className="benefits-kpi-value">6</span>
              </div>
            </div>
            <div className="benefits-kpi-card">
              <div className="benefits-kpi-icon">
                <Users size={18} />
              </div>
              <div className="benefits-kpi-content">
                <span className="benefits-kpi-label">Avg Cost/Employee</span>
                <span className="benefits-kpi-value">$6,647</span>
              </div>
            </div>
          </section>

          {/* Benefits Plans Table */}
          <section className="benefits-panel">
            <div className="panel-header">
              <Shield size={16} />
              <h2>Benefits Plans</h2>
            </div>
            <div className="benefits-table">
              <div className="benefits-table-header">
                <span>Plan Name</span>
                <span>Type</span>
                <span>Enrolled</span>
                <span>Monthly Cost</span>
                <span>Employer Contribution</span>
              </div>
              {benefitsPlans.map((plan) => (
                <div key={plan.name} className="benefits-table-row">
                  <span className="plan-name">
                    <Heart size={14} />
                    {plan.name}
                  </span>
                  <span className="plan-type">{plan.type}</span>
                  <span className="plan-enrolled">
                    <Users size={12} />
                    {plan.enrolled}
                  </span>
                  <span className="plan-cost">{plan.monthlyCost}</span>
                  <span className="plan-contribution">
                    {plan.contribution === 'N/A' ? (
                      <span className="contribution-na">{plan.contribution}</span>
                    ) : (
                      <span className="contribution-badge">
                        {plan.contribution === '100%' && <CheckCircle size={12} />}
                        {plan.contribution !== '100%' && plan.contribution !== '6% match' && <Percent size={12} />}
                        {plan.contribution}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="benefits-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Calendar size={14} />
              <h3>Open Enrollment</h3>
            </div>
            <div className="sidebar-list">
              {openEnrollment.map((item) => (
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
              <h3>Benefits Summary</h3>
            </div>
            <div className="sidebar-list">
              {benefitsSummary.map((item) => (
                <div key={item.label} className="sidebar-row">
                  <span className="sidebar-label">{item.label}</span>
                  <span className="sidebar-value">{item.value}</span>
                </div>
              ))}
              <div className="sidebar-row total">
                <span className="sidebar-label">Total</span>
                <span className="sidebar-value">$312,400</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
