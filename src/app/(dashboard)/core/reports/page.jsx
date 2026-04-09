"use client";

import { useState } from "react";
import {
  FileText,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Repeat,
  TrendingUp,
  GitCompare,
  Users,
  AlertTriangle,
  Shield,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Upload,
  Link2,
  CheckCircle,
  MessageSquare,
  X,
} from "lucide-react";
import "@/styles/core/Reports.css";

// Report definitions
const reportRegistry = [
  {
    id: "transaction-ledger",
    name: "Transaction Ledger",
    description: "Complete immutable list of all transactions",
    icon: FileText,
    available: true,
  },
  {
    id: "cash-flow",
    name: "Cash Flow Statement",
    description: "Direct method - actual money in vs out",
    icon: ArrowLeftRight,
    available: true,
  },
  {
    id: "account-activity",
    name: "Account Activity",
    description: "Per-account transaction summaries",
    icon: Wallet,
    available: true,
  },
  {
    id: "category-spend",
    name: "Category Spend",
    description: "Aggregated spending by category",
    icon: PieChart,
    available: true,
  },
  {
    id: "recurring-activity",
    name: "Recurring Activity",
    description: "Detected repeating inflows and outflows",
    icon: Repeat,
    available: true,
  },
  {
    id: "balance-history",
    name: "Balance History",
    description: "Historical balance changes over time",
    icon: TrendingUp,
    available: true,
  },
  {
    id: "statement-reconciliation",
    name: "Statement Reconciliation",
    description: "Compare uploaded statements vs ingested data",
    icon: GitCompare,
    available: true,
  },
  {
    id: "counterparties",
    name: "Counterparties",
    description: "Who money flows to and from",
    icon: Users,
    available: true,
  },
  {
    id: "exceptions",
    name: "Exceptions",
    description: "Transactions that violate normal patterns",
    icon: AlertTriangle,
    available: true,
  },
  {
    id: "data-integrity",
    name: "Data Integrity",
    description: "Source lineage and trust report",
    icon: Shield,
    available: true,
  },
];

// Empty state component
function ReportEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}) {
  return (
    <div className="report-empty-state">
      <div className="empty-icon">
        <Icon size={32} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && (
        <button className="empty-action-btn" onClick={onAction}>
          {ActionIcon && <ActionIcon size={16} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Transaction Ledger Report
function TransactionLedgerReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={FileText}
            title="No transactions imported"
            description="Connect a bank account or upload statements to see your transaction ledger."
            actionLabel="Connect Bank"
            actionIcon={Link2}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-only" title="Filter">
            <Filter size={16} />
          </button>
          <button className="toolbar-btn icon-only" title="Date Range">
            <Calendar size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="immutable-notice">
          <Shield size={14} />
          <span>
            Immutable ledger - transactions cannot be modified after import
          </span>
        </div>
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mar 25, 2024</td>
              <td>STARBUCKS STORE #12345</td>
              <td>Chase Checking</td>
              <td>Food & Drink</td>
              <td className="amount outflow">-$5.75</td>
            </tr>
            <tr>
              <td>Mar 25, 2024</td>
              <td>AMAZON.COM*1A2B3C4D5</td>
              <td>Chase Checking</td>
              <td>Shopping</td>
              <td className="amount outflow">-$127.43</td>
            </tr>
            <tr>
              <td>Mar 25, 2024</td>
              <td>ACH DEPOSIT - PAYROLL</td>
              <td>Chase Checking</td>
              <td>Income</td>
              <td className="amount inflow">+$3,250.00</td>
            </tr>
            <tr>
              <td>Mar 24, 2024</td>
              <td>UBER *TRIP</td>
              <td>Amex Platinum</td>
              <td>Transportation</td>
              <td className="amount outflow">-$24.50</td>
            </tr>
            <tr>
              <td>Mar 24, 2024</td>
              <td>TARGET 00012345</td>
              <td>Chase Checking</td>
              <td>Shopping</td>
              <td className="amount outflow">-$89.32</td>
            </tr>
          </tbody>
        </table>
        <div className="report-footer">
          <span className="record-count">Showing 5 of 3,842 transactions</span>
        </div>
      </div>
    </div>
  );
}

// Cash Flow Report - Direct method (actual money in vs out)
function CashFlowReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={ArrowLeftRight}
            title="No cash flow data"
            description="Import transactions to generate your cash flow statement."
            actionLabel="Import Transactions"
            actionIcon={Upload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-only" title="Select Month">
            <Calendar size={16} />
          </button>
          <span className="toolbar-badge">Direct Method</span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="cash-flow-summary">
          <div className="cf-card inflows">
            <span className="cf-label">Actual Inflows</span>
            <span className="cf-value">$12,450.00</span>
          </div>
          <div className="cf-card outflows">
            <span className="cf-label">Actual Outflows</span>
            <span className="cf-value">$8,234.56</span>
          </div>
          <div className="cf-card net">
            <span className="cf-label">Net Cash Flow</span>
            <span className="cf-value positive">+$4,215.44</span>
          </div>
        </div>
        <div className="cf-section">
          <h4>Operating Activities</h4>
          <div className="cf-line">
            <span>Cash received from customers</span>
            <span className="inflow">$10,500.00</span>
          </div>
          <div className="cf-line">
            <span>Other cash receipts</span>
            <span className="inflow">$1,950.00</span>
          </div>
          <div className="cf-line">
            <span>Cash paid for operating expenses</span>
            <span className="outflow">-$6,234.56</span>
          </div>
          <div className="cf-line total">
            <span>Net Cash from Operations</span>
            <span>$6,215.44</span>
          </div>
        </div>
        <div className="cf-section">
          <h4>Financing Activities</h4>
          <div className="cf-line">
            <span>Loan principal payments</span>
            <span className="outflow">-$2,000.00</span>
          </div>
          <div className="cf-line total">
            <span>Net Cash from Financing</span>
            <span>-$2,000.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Activity Report
function AccountActivityReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={Wallet}
            title="No account activity"
            description="Connect bank accounts to view activity summaries."
            actionLabel="Connect Bank"
            actionIcon={Link2}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <select className="toolbar-select">
            <option>All Accounts</option>
            <option>Chase Checking</option>
            <option>Bank of America Savings</option>
            <option>Amex Platinum</option>
          </select>
          <button className="toolbar-btn icon-only" title="Select Month">
            <Calendar size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="account-cards">
          <div className="account-summary-card">
            <h4>Chase Checking (...4521)</h4>
            <div className="account-stats">
              <div className="stat">
                <span className="label">Opening Balance</span>
                <span className="value">$42,150.00</span>
              </div>
              <div className="stat">
                <span className="label">Total Deposits</span>
                <span className="value inflow">+$8,500.00</span>
              </div>
              <div className="stat">
                <span className="label">Total Withdrawals</span>
                <span className="value outflow">-$5,419.50</span>
              </div>
              <div className="stat">
                <span className="label">Closing Balance</span>
                <span className="value">$45,230.50</span>
              </div>
            </div>
            <div className="account-txn-summary">
              <span>156 transactions this period</span>
            </div>
          </div>
          <div className="account-summary-card">
            <h4>Bank of America Savings (...8834)</h4>
            <div className="account-stats">
              <div className="stat">
                <span className="label">Opening Balance</span>
                <span className="value">$28,500.00</span>
              </div>
              <div className="stat">
                <span className="label">Total Deposits</span>
                <span className="value inflow">+$250.00</span>
              </div>
              <div className="stat">
                <span className="label">Total Withdrawals</span>
                <span className="value outflow">-$0.00</span>
              </div>
              <div className="stat">
                <span className="label">Closing Balance</span>
                <span className="value">$28,750.00</span>
              </div>
            </div>
            <div className="account-txn-summary">
              <span>3 transactions this period</span>
            </div>
          </div>
          <div className="account-summary-card">
            <h4>American Express Platinum (...1004)</h4>
            <div className="account-stats">
              <div className="stat">
                <span className="label">Opening Balance</span>
                <span className="value outflow">-$1,890.00</span>
              </div>
              <div className="stat">
                <span className="label">Payments</span>
                <span className="value inflow">+$1,890.00</span>
              </div>
              <div className="stat">
                <span className="label">New Charges</span>
                <span className="value outflow">-$2,340.00</span>
              </div>
              <div className="stat">
                <span className="label">Current Balance</span>
                <span className="value outflow">-$2,340.00</span>
              </div>
            </div>
            <div className="account-txn-summary">
              <span>42 transactions this period</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Spend Report
function CategorySpendReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={PieChart}
            title="No spending data"
            description="Import transactions to see spending by category."
            actionLabel="Import Transactions"
            actionIcon={Upload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-only" title="Date Range">
            <Calendar size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="spend-total">
          <span className="spend-label">Total Spending</span>
          <span className="spend-value">$5,198.63</span>
        </div>
        <div className="category-list">
          <div className="category-row">
            <div className="category-info">
              <span
                className="category-color"
                style={{ background: "#4680ff" }}
              ></span>
              <span className="category-name">Shopping</span>
            </div>
            <div className="category-bar">
              <div
                className="bar-fill"
                style={{ width: "47%", background: "#4680ff" }}
              ></div>
            </div>
            <span className="category-amount">$2,456.78</span>
            <span className="category-percent">47%</span>
          </div>
          <div className="category-row">
            <div className="category-info">
              <span
                className="category-color"
                style={{ background: "#1abc9c" }}
              ></span>
              <span className="category-name">Food & Drink</span>
            </div>
            <div className="category-bar">
              <div
                className="bar-fill"
                style={{ width: "24%", background: "#1abc9c" }}
              ></div>
            </div>
            <span className="category-amount">$1,234.56</span>
            <span className="category-percent">24%</span>
          </div>
          <div className="category-row">
            <div className="category-info">
              <span
                className="category-color"
                style={{ background: "#f39c12" }}
              ></span>
              <span className="category-name">Transportation</span>
            </div>
            <div className="category-bar">
              <div
                className="bar-fill"
                style={{ width: "17%", background: "#f39c12" }}
              ></div>
            </div>
            <span className="category-amount">$892.30</span>
            <span className="category-percent">17%</span>
          </div>
          <div className="category-row">
            <div className="category-info">
              <span
                className="category-color"
                style={{ background: "#9b59b6" }}
              ></span>
              <span className="category-name">Utilities</span>
            </div>
            <div className="category-bar">
              <div
                className="bar-fill"
                style={{ width: "8%", background: "#9b59b6" }}
              ></div>
            </div>
            <span className="category-amount">$425.00</span>
            <span className="category-percent">8%</span>
          </div>
          <div className="category-row">
            <div className="category-info">
              <span
                className="category-color"
                style={{ background: "#e74c3c" }}
              ></span>
              <span className="category-name">Entertainment</span>
            </div>
            <div className="category-bar">
              <div
                className="bar-fill"
                style={{ width: "4%", background: "#e74c3c" }}
              ></div>
            </div>
            <span className="category-amount">$189.99</span>
            <span className="category-percent">4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recurring Activity Report
function RecurringActivityReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={Repeat}
            title="No recurring patterns detected"
            description="As more transactions are imported, recurring patterns like subscriptions, payroll, and rent will be identified."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">
            Detected subscriptions, payroll, and recurring payments
          </span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="recurring-summary">
          <div className="recurring-card inflow">
            <span className="recurring-label">Monthly Inflows</span>
            <span className="recurring-value">$6,500.00</span>
          </div>
          <div className="recurring-card outflow">
            <span className="recurring-label">Monthly Outflows</span>
            <span className="recurring-value">$2,245.98</span>
          </div>
        </div>
        <table className="report-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Frequency</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Next Expected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PAYROLL DEPOSIT</td>
              <td>Bi-weekly</td>
              <td>
                <span className="type-badge inflow">Inflow</span>
              </td>
              <td className="amount inflow">+$3,250.00</td>
              <td>Apr 5, 2024</td>
            </tr>
            <tr>
              <td>RENT PAYMENT</td>
              <td>Monthly</td>
              <td>
                <span className="type-badge outflow">Outflow</span>
              </td>
              <td className="amount outflow">-$2,100.00</td>
              <td>Apr 1, 2024</td>
            </tr>
            <tr>
              <td>NETFLIX.COM</td>
              <td>Monthly</td>
              <td>
                <span className="type-badge outflow">Outflow</span>
              </td>
              <td className="amount outflow">-$15.99</td>
              <td>Apr 1, 2024</td>
            </tr>
            <tr>
              <td>SPOTIFY USA</td>
              <td>Monthly</td>
              <td>
                <span className="type-badge outflow">Outflow</span>
              </td>
              <td className="amount outflow">-$9.99</td>
              <td>Apr 3, 2024</td>
            </tr>
            <tr>
              <td>AT&T WIRELESS</td>
              <td>Monthly</td>
              <td>
                <span className="type-badge outflow">Outflow</span>
              </td>
              <td className="amount outflow">-$120.00</td>
              <td>Apr 15, 2024</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Balance History Report
function BalanceHistoryReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={TrendingUp}
            title="No balance history"
            description="Connect bank accounts to track balance changes over time."
            actionLabel="Connect Bank"
            actionIcon={Link2}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-only" title="Date Range">
            <Calendar size={16} />
          </button>
          <select className="toolbar-select">
            <option>All Accounts</option>
            <option>Chase Checking</option>
            <option>Bank of America Savings</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="balance-chart-placeholder">
          <TrendingUp size={48} />
          <p>Historical balance trend</p>
          <span className="placeholder-note">
            Daily closing balances over selected period
          </span>
        </div>
        <table className="report-table compact">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Balance</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mar 25, 2024</td>
              <td>Chase Checking</td>
              <td>$45,230.50</td>
              <td className="change positive">+$3,080.50</td>
            </tr>
            <tr>
              <td>Mar 24, 2024</td>
              <td>Chase Checking</td>
              <td>$42,150.00</td>
              <td className="change negative">-$113.82</td>
            </tr>
            <tr>
              <td>Mar 23, 2024</td>
              <td>Chase Checking</td>
              <td>$42,263.82</td>
              <td className="change positive">+$247.88</td>
            </tr>
            <tr>
              <td>Mar 22, 2024</td>
              <td>Chase Checking</td>
              <td>$42,015.94</td>
              <td className="change negative">-$892.30</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Statement Reconciliation Report
function StatementReconciliationReport({ hasStatements = true }) {
  if (!hasStatements) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={GitCompare}
            title="No statements uploaded"
            description="Upload bank statements to compare against imported transaction data."
            actionLabel="Upload Statement"
            actionIcon={Upload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <select className="toolbar-select">
            <option>Chase Checking - March 2024</option>
            <option>Chase Checking - February 2024</option>
            <option>BofA Savings - March 2024</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only" title="Upload Statement">
            <Upload size={16} />
          </button>
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="recon-summary">
          <div className="recon-card matched">
            <span className="recon-value">142</span>
            <span className="recon-label">Matched</span>
          </div>
          <div className="recon-card unmatched">
            <span className="recon-value">3</span>
            <span className="recon-label">Unmatched</span>
          </div>
          <div className="recon-card difference">
            <span className="recon-value">$12.45</span>
            <span className="recon-label">Difference</span>
          </div>
        </div>
        <div className="recon-details">
          <h4>Unmatched Transactions</h4>
          <table className="report-table compact">
            <thead>
              <tr>
                <th>Source</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="source-badge statement">Statement</span>
                </td>
                <td>Mar 15</td>
                <td>CHECK #1234</td>
                <td>-$500.00</td>
                <td>
                  <button className="table-action-btn">Match</button>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="source-badge plaid">Ingested</span>
                </td>
                <td>Mar 18</td>
                <td>PENDING CHARGE</td>
                <td>-$12.45</td>
                <td>
                  <button className="table-action-btn">Investigate</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Counterparties Report
function CounterpartiesReport({ hasData = true }) {
  if (!hasData) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={Users}
            title="No counterparties found"
            description="Import transactions to identify who money flows to and from."
            actionLabel="Import Transactions"
            actionIcon={Upload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn icon-only" title="Date Range">
            <Calendar size={16} />
          </button>
          <button className="toolbar-btn icon-only" title="Filter">
            <Filter size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <table className="report-table">
          <thead>
            <tr>
              <th>Counterparty</th>
              <th>Transactions</th>
              <th>Total Inflow</th>
              <th>Total Outflow</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="counterparty-name">Employer Inc.</td>
              <td>24</td>
              <td className="amount inflow">+$78,000.00</td>
              <td className="amount muted">$0.00</td>
              <td className="amount inflow">+$78,000.00</td>
            </tr>
            <tr>
              <td className="counterparty-name">Landlord LLC</td>
              <td>12</td>
              <td className="amount muted">$0.00</td>
              <td className="amount outflow">-$25,200.00</td>
              <td className="amount outflow">-$25,200.00</td>
            </tr>
            <tr>
              <td className="counterparty-name">Amazon</td>
              <td>47</td>
              <td className="amount inflow">+$150.00</td>
              <td className="amount outflow">-$3,456.78</td>
              <td className="amount outflow">-$3,306.78</td>
            </tr>
            <tr>
              <td className="counterparty-name">Whole Foods</td>
              <td>28</td>
              <td className="amount muted">$0.00</td>
              <td className="amount outflow">-$1,892.45</td>
              <td className="amount outflow">-$1,892.45</td>
            </tr>
            <tr>
              <td className="counterparty-name">Uber</td>
              <td>34</td>
              <td className="amount muted">$0.00</td>
              <td className="amount outflow">-$892.30</td>
              <td className="amount outflow">-$892.30</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Exceptions Report - Manual refresh, no polling, resolution notes
function ExceptionsReport({ hasExceptions = true }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState("2 minutes ago");
  const [expandedNote, setExpandedNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    setLastRefresh("just now");
  };

  const handleAddNote = (exceptionId) => {
    // In real app, would save note to backend
    setExpandedNote(null);
    setNoteText("");
  };

  if (!hasExceptions) {
    return (
      <div className="report-content">
        <div className="report-toolbar">
          <div className="toolbar-left">
            <span className="toolbar-label">Last checked: {lastRefresh}</span>
          </div>
          <div className="toolbar-right">
            <button
              className="toolbar-btn icon-only"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Check for Exceptions"
            >
              <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            </button>
          </div>
        </div>
        <div className="report-body">
          <ReportEmptyState
            icon={CheckCircle}
            title="No exceptions detected"
            description="All transactions are within normal patterns. Check back later or refresh to scan for new exceptions."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Last checked: {lastRefresh}</span>
          <span className="toolbar-badge warning">3 unresolved</span>
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-btn icon-only"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
          </button>
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="exceptions-list">
          <div className="exception-card high">
            <div className="exception-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="exception-info">
              <h4>Unusual Large Transaction</h4>
              <p>
                $4,500.00 payment to UNKNOWN VENDOR on Mar 22 is 340% above your
                typical spending pattern.
              </p>
              <span className="exception-meta">
                Mar 22, 2024 · Chase Checking
              </span>
              {expandedNote === 1 ? (
                <div className="resolution-note-input">
                  <textarea
                    placeholder="Add resolution note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <div className="note-actions">
                    <button
                      className="note-btn cancel"
                      onClick={() => setExpandedNote(null)}
                    >
                      <X size={14} />
                    </button>
                    <button
                      className="note-btn save"
                      onClick={() => handleAddNote(1)}
                    >
                      <CheckCircle size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="add-note-btn"
                  onClick={() => setExpandedNote(1)}
                >
                  <MessageSquare size={14} />
                  Add Resolution Note
                </button>
              )}
            </div>
            <span className="severity-badge high">High</span>
          </div>
          <div className="exception-card medium">
            <div className="exception-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="exception-info">
              <h4>Duplicate Transaction Detected</h4>
              <p>
                Two identical charges of $89.32 to TARGET found within 2
                minutes.
              </p>
              <span className="exception-meta">
                Mar 24, 2024 · Chase Checking
              </span>
              {expandedNote === 2 ? (
                <div className="resolution-note-input">
                  <textarea
                    placeholder="Add resolution note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <div className="note-actions">
                    <button
                      className="note-btn cancel"
                      onClick={() => setExpandedNote(null)}
                    >
                      <X size={14} />
                    </button>
                    <button
                      className="note-btn save"
                      onClick={() => handleAddNote(2)}
                    >
                      <CheckCircle size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="add-note-btn"
                  onClick={() => setExpandedNote(2)}
                >
                  <MessageSquare size={14} />
                  Add Resolution Note
                </button>
              )}
            </div>
            <span className="severity-badge medium">Medium</span>
          </div>
          <div className="exception-card low resolved">
            <div className="exception-icon">
              <CheckCircle size={18} />
            </div>
            <div className="exception-info">
              <h4>Recurring Payment Missed</h4>
              <p>
                Expected Netflix charge of $15.99 was not detected this month.
              </p>
              <span className="exception-meta">Expected: Mar 1, 2024</span>
              <div className="resolution-note">
                <MessageSquare size={12} />
                <span>Resolved: Subscription was cancelled on Feb 28.</span>
              </div>
            </div>
            <span className="severity-badge resolved">Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data Integrity Report
function DataIntegrityReport({ hasDataSources = true }) {
  if (!hasDataSources) {
    return (
      <div className="report-content">
        <div className="report-body">
          <ReportEmptyState
            icon={Shield}
            title="No data sources connected"
            description="Connect bank accounts or upload statements to view data integrity and provenance information."
            actionLabel="Connect Data Source"
            actionIcon={Link2}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="report-content">
      <div className="report-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Provenance and trust metrics</span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn icon-only primary" title="Export">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="report-body">
        <div className="integrity-summary">
          <div className="integrity-score">
            <span className="score-value">98.2%</span>
            <span className="score-label">Data Trust Score</span>
          </div>
        </div>
        <div className="integrity-metrics">
          <div className="metric-row">
            <span className="metric-name">Plaid-sourced transactions</span>
            <span className="metric-value">3,842</span>
            <span className="metric-status verified">Verified</span>
          </div>
          <div className="metric-row">
            <span className="metric-name">Statement-matched</span>
            <span className="metric-value">3,785</span>
            <span className="metric-status verified">98.5%</span>
          </div>
          <div className="metric-row">
            <span className="metric-name">Manual entries</span>
            <span className="metric-value">12</span>
            <span className="metric-status manual">Manual</span>
          </div>
          <div className="metric-row">
            <span className="metric-name">Unverified transactions</span>
            <span className="metric-value">45</span>
            <span className="metric-status pending">Pending</span>
          </div>
        </div>
        <div className="lineage-section">
          <h4>Data Sources</h4>
          <div className="source-row">
            <div className="source-icon connected">
              <CheckCircle size={14} />
            </div>
            <span className="source-name">Plaid API</span>
            <span className="source-records">3,842 records</span>
            <span className="source-date">Last sync: 12m ago</span>
          </div>
          <div className="source-row">
            <div className="source-icon connected">
              <CheckCircle size={14} />
            </div>
            <span className="source-name">Chase Statement Upload</span>
            <span className="source-records">145 records</span>
            <span className="source-date">Uploaded: Mar 20, 2024</span>
          </div>
          <div className="source-row">
            <div className="source-icon manual">
              <FileText size={14} />
            </div>
            <span className="source-name">Manual Entry</span>
            <span className="source-records">12 records</span>
            <span className="source-date">Last entry: Mar 18, 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Report content renderer
function ReportContent({ reportId }) {
  switch (reportId) {
    case "transaction-ledger":
      return <TransactionLedgerReport hasData={true} />;
    case "cash-flow":
      return <CashFlowReport hasData={true} />;
    case "account-activity":
      return <AccountActivityReport hasData={true} />;
    case "category-spend":
      return <CategorySpendReport hasData={true} />;
    case "recurring-activity":
      return <RecurringActivityReport hasData={true} />;
    case "balance-history":
      return <BalanceHistoryReport hasData={true} />;
    case "statement-reconciliation":
      return <StatementReconciliationReport hasStatements={true} />;
    case "counterparties":
      return <CounterpartiesReport hasData={true} />;
    case "exceptions":
      return <ExceptionsReport hasExceptions={true} />;
    case "data-integrity":
      return <DataIntegrityReport hasDataSources={true} />;
    default:
      return null;
  }
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState("transaction-ledger");

  const activeReportData = reportRegistry.find((r) => r.id === activeReport);

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Financial reports and analytics</p>
        </div>
      </div>

      {/* Report Switchboard */}
      <div className="report-switchboard">
        {/* Left Nav */}
        <nav className="report-nav">
          {reportRegistry.map((report) => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;

            return (
              <button
                key={report.id}
                className={`report-nav-item ${isActive ? "active" : ""} ${!report.available ? "disabled" : ""}`}
                onClick={() => report.available && setActiveReport(report.id)}
                disabled={!report.available}
              >
                <Icon size={18} />
                <span className="nav-label">{report.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Main Pane */}
        <div className="report-main">
          <div className="report-header">
            <div className="report-title-section">
              {activeReportData && (
                <>
                  <h2>{activeReportData.name}</h2>
                  <p>{activeReportData.description}</p>
                </>
              )}
            </div>
          </div>
          <ReportContent reportId={activeReport} />
        </div>
      </div>
    </div>
  );
}
