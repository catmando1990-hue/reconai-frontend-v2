"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronDown,
  Eye,
  Sparkles,
  Shield,
  Building2,
  Briefcase,
  PiggyBank,
  Receipt,
  FileCheck,
  AlertTriangle,
  Link2,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  accountData,
  transactionData,
  calculateTaxSummary,
  getAllAccounts,
  hasConnectedAccounts as checkHasConnectedAccounts,
  getInstitutionCount,
} from '@/data/financialData';
import '@/styles/core/TaxDocuments.css';

// Tax years available
const TAX_YEARS = ['2024', '2023', '2022', '2021'];

// Document status types
const DOC_STATUS = {
  READY: { label: 'Ready', icon: CheckCircle, className: 'ready' },
  GENERATING: { label: 'Generating', icon: Loader2, className: 'generating' },
  PENDING_DATA: { label: 'Pending Data', icon: Clock, className: 'pending' },
  ERROR: { label: 'Error', icon: AlertCircle, className: 'error' },
  NOT_APPLICABLE: { label: 'N/A', icon: null, className: 'na' },
};

// Format currency helper
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Tax document generator - creates documents with real data from accounts
function generateTaxDocuments(taxYear, taxSummary, accounts) {
  const documents = [];

  // Helper to get relevant accounts
  const savingsAccounts = accounts.filter(a => a.subtype === 'savings');
  const investmentAccounts = accounts.filter(a => a.type === 'investment');
  const iraAccounts = accounts.filter(a => a.subtype === 'ira');
  const hasBusinessIncome = taxSummary.business.grossIncome > 0;

  // ===== INCOME DOCUMENTS =====
  documents.push({
    id: 'w2',
    name: 'Form W-2',
    description: 'Wage and Tax Statement',
    fullName: 'Wage and Tax Statement from Employers',
    category: 'Income Documents',
    categoryIcon: Briefcase,
    autoGenerate: false,
    status: DOC_STATUS.PENDING_DATA,
    sources: ['employer'],
    lastUpdated: null,
    generatedData: null,
    note: 'Awaiting W-2 from employer',
  });

  // 1099-INT for interest income
  const interestTotal = taxSummary.income.interest;
  if (savingsAccounts.length > 0 && interestTotal > 0) {
    documents.push({
      id: '1099-int',
      name: 'Form 1099-INT',
      description: 'Interest Income',
      fullName: 'Interest Income from Banks and Investments',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['bank_accounts'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: interestTotal,
        itemCount: savingsAccounts.length,
        details: savingsAccounts.map(acc => ({
          institution: acc.institution,
          account: `****${acc.mask}`,
          interest: acc.interestEarned || (interestTotal / savingsAccounts.length),
        })),
      },
    });
  } else {
    documents.push({
      id: '1099-int',
      name: 'Form 1099-INT',
      description: 'Interest Income',
      fullName: 'Interest Income from Banks and Investments',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: savingsAccounts.length > 0 ? DOC_STATUS.READY : DOC_STATUS.NOT_APPLICABLE,
      sources: ['bank_accounts'],
      lastUpdated: savingsAccounts.length > 0 ? new Date() : null,
      generatedData: savingsAccounts.length > 0 ? { totalAmount: 0, itemCount: 0 } : null,
    });
  }

  // 1099-DIV for dividend income
  const dividendTotal = taxSummary.income.dividends;
  if (investmentAccounts.length > 0 && dividendTotal > 0) {
    documents.push({
      id: '1099-div',
      name: 'Form 1099-DIV',
      description: 'Dividend Income',
      fullName: 'Dividend and Distribution Income',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['investment_accounts'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: dividendTotal,
        itemCount: transactionData.income.dividends.length,
        qualifiedDividends: dividendTotal, // All qualified in our mock data
        details: investmentAccounts.map(acc => ({
          institution: acc.institution,
          account: `****${acc.mask}`,
          dividends: acc.dividends || dividendTotal,
        })),
      },
    });
  } else {
    documents.push({
      id: '1099-div',
      name: 'Form 1099-DIV',
      description: 'Dividend Income',
      fullName: 'Dividend and Distribution Income',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: investmentAccounts.length > 0 ? DOC_STATUS.PENDING_DATA : DOC_STATUS.NOT_APPLICABLE,
      sources: ['investment_accounts'],
      lastUpdated: null,
      generatedData: null,
    });
  }

  // 1099-NEC for freelance income
  if (hasBusinessIncome) {
    documents.push({
      id: '1099-nec',
      name: 'Form 1099-NEC',
      description: 'Nonemployee Compensation',
      fullName: 'Self-Employment and Freelance Income',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['transactions'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: taxSummary.business.grossIncome,
        itemCount: transactionData.income.freelance.length,
        payers: [...new Set(transactionData.income.freelance.map(t => t.source))],
        details: transactionData.income.freelance.map(t => ({
          payer: t.source,
          date: t.date,
          amount: t.amount,
        })),
      },
    });
  } else {
    documents.push({
      id: '1099-nec',
      name: 'Form 1099-NEC',
      description: 'Nonemployee Compensation',
      fullName: 'Self-Employment and Freelance Income',
      category: 'Income Documents',
      categoryIcon: Briefcase,
      autoGenerate: true,
      status: DOC_STATUS.NOT_APPLICABLE,
      sources: ['transactions'],
      lastUpdated: null,
      generatedData: null,
      note: 'No freelance income detected',
    });
  }

  documents.push({
    id: '1099-misc',
    name: 'Form 1099-MISC',
    description: 'Miscellaneous Income',
    fullName: 'Miscellaneous Income (Rent, Prizes, etc.)',
    category: 'Income Documents',
    categoryIcon: Briefcase,
    autoGenerate: false,
    status: DOC_STATUS.NOT_APPLICABLE,
    sources: ['manual'],
    lastUpdated: null,
    generatedData: null,
  });

  // ===== DEDUCTION DOCUMENTS =====
  documents.push({
    id: '1098',
    name: 'Form 1098',
    description: 'Mortgage Interest',
    fullName: 'Mortgage Interest Statement',
    category: 'Deduction Documents',
    categoryIcon: Receipt,
    autoGenerate: false,
    status: taxSummary.deductions.mortgageInterest > 0 ? DOC_STATUS.READY : DOC_STATUS.NOT_APPLICABLE,
    sources: ['lender'],
    lastUpdated: taxSummary.deductions.mortgageInterest > 0 ? new Date() : null,
    generatedData: taxSummary.deductions.mortgageInterest > 0 ? {
      totalAmount: taxSummary.deductions.mortgageInterest,
      lender: transactionData.deductions.mortgage.lender,
      property: transactionData.deductions.mortgage.propertyAddress,
      propertyTax: transactionData.deductions.mortgage.totalPropertyTax,
    } : null,
  });

  documents.push({
    id: '1098-e',
    name: 'Form 1098-E',
    description: 'Student Loan Interest',
    fullName: 'Student Loan Interest Statement',
    category: 'Deduction Documents',
    categoryIcon: Receipt,
    autoGenerate: false,
    status: taxSummary.deductions.studentLoanInterest > 0 ? DOC_STATUS.READY : DOC_STATUS.NOT_APPLICABLE,
    sources: ['loan_servicer'],
    lastUpdated: taxSummary.deductions.studentLoanInterest > 0 ? new Date() : null,
    generatedData: taxSummary.deductions.studentLoanInterest > 0 ? {
      totalAmount: taxSummary.deductions.studentLoanInterest,
      servicer: transactionData.deductions.studentLoans.servicer,
    } : null,
  });

  documents.push({
    id: '1098-t',
    name: 'Form 1098-T',
    description: 'Tuition Statement',
    fullName: 'Tuition Payments Statement',
    category: 'Deduction Documents',
    categoryIcon: Receipt,
    autoGenerate: false,
    status: DOC_STATUS.NOT_APPLICABLE,
    sources: ['educational_institution'],
    lastUpdated: null,
    generatedData: null,
  });

  // Charitable donations summary
  const charitableTotal = taxSummary.deductions.charitable;
  documents.push({
    id: 'charity-summary',
    name: 'Charitable Donations',
    description: 'Donation Summary',
    fullName: 'Summary of Charitable Contributions',
    category: 'Deduction Documents',
    categoryIcon: Receipt,
    autoGenerate: true,
    status: charitableTotal > 0 ? DOC_STATUS.READY : DOC_STATUS.NOT_APPLICABLE,
    sources: ['transactions'],
    lastUpdated: charitableTotal > 0 ? new Date() : null,
    generatedData: charitableTotal > 0 ? {
      totalAmount: charitableTotal,
      itemCount: transactionData.deductions.charitable.length,
      cashDonations: transactionData.deductions.charitable
        .filter(d => d.cashOrProperty === 'cash')
        .reduce((sum, d) => sum + d.amount, 0),
      propertyDonations: transactionData.deductions.charitable
        .filter(d => d.cashOrProperty === 'property')
        .reduce((sum, d) => sum + d.amount, 0),
      recipients: transactionData.deductions.charitable.map(d => ({
        name: d.recipient,
        amount: d.amount,
        date: d.date,
        type: d.cashOrProperty,
      })),
    } : null,
  });

  // Medical expenses summary
  const medicalTotal = taxSummary.deductions.medical;
  documents.push({
    id: 'medical-summary',
    name: 'Medical Expenses',
    description: 'Healthcare Costs',
    fullName: 'Medical and Healthcare Expense Summary',
    category: 'Deduction Documents',
    categoryIcon: Receipt,
    autoGenerate: true,
    status: medicalTotal > 0 ? DOC_STATUS.READY : DOC_STATUS.NOT_APPLICABLE,
    sources: ['transactions'],
    lastUpdated: medicalTotal > 0 ? new Date() : null,
    generatedData: medicalTotal > 0 ? {
      totalAmount: medicalTotal,
      itemCount: transactionData.deductions.medical.length,
      expenses: transactionData.deductions.medical.map(m => ({
        provider: m.provider,
        description: m.description,
        amount: m.amount,
        date: m.date,
      })),
    } : null,
  });

  // ===== BUSINESS & SELF-EMPLOYMENT =====
  if (hasBusinessIncome) {
    // Schedule C
    documents.push({
      id: 'schedule-c',
      name: 'Schedule C',
      description: 'Profit or Loss',
      fullName: 'Profit or Loss from Business (Sole Proprietorship)',
      category: 'Business & Self-Employment',
      categoryIcon: Building2,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['transactions', 'accounts'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: taxSummary.business.netProfit,
        grossIncome: taxSummary.business.grossIncome,
        totalExpenses: taxSummary.business.totalExpenses,
        expenses: {
          advertising: taxSummary.business.advertising,
          supplies: taxSummary.business.supplies,
          software: taxSummary.business.software,
          travel: taxSummary.business.travel,
          meals: taxSummary.business.meals,
          mileage: taxSummary.business.mileage,
          homeOffice: taxSummary.business.homeOffice,
        },
      },
    });

    // Schedule SE
    const selfEmploymentTax = taxSummary.business.netProfit * 0.9235 * 0.153;
    documents.push({
      id: 'schedule-se',
      name: 'Schedule SE',
      description: 'Self-Employment Tax',
      fullName: 'Self-Employment Tax Calculation',
      category: 'Business & Self-Employment',
      categoryIcon: Building2,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['schedule-c'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: selfEmploymentTax,
        netEarnings: taxSummary.business.netProfit,
        taxableAmount: taxSummary.business.netProfit * 0.9235,
        taxRate: '15.3%',
        deductiblePortion: selfEmploymentTax / 2,
      },
    });

    // Home Office
    documents.push({
      id: 'home-office',
      name: 'Home Office',
      description: 'Form 8829',
      fullName: 'Expenses for Business Use of Your Home',
      category: 'Business & Self-Employment',
      categoryIcon: Building2,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['manual', 'transactions'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: taxSummary.business.homeOffice,
        totalSquareFeet: transactionData.business.homeOffice.totalSquareFeet,
        officeSquareFeet: transactionData.business.homeOffice.officeSquareFeet,
        percentage: ((transactionData.business.homeOffice.officeSquareFeet /
          transactionData.business.homeOffice.totalSquareFeet) * 100).toFixed(1) + '%',
        breakdown: {
          mortgage: transactionData.business.homeOffice.annualMortgageInterest *
            (transactionData.business.homeOffice.officeSquareFeet / transactionData.business.homeOffice.totalSquareFeet),
          utilities: transactionData.business.homeOffice.annualUtilities *
            (transactionData.business.homeOffice.officeSquareFeet / transactionData.business.homeOffice.totalSquareFeet),
          insurance: transactionData.business.homeOffice.annualInsurance *
            (transactionData.business.homeOffice.officeSquareFeet / transactionData.business.homeOffice.totalSquareFeet),
          repairs: transactionData.business.homeOffice.annualRepairs *
            (transactionData.business.homeOffice.officeSquareFeet / transactionData.business.homeOffice.totalSquareFeet),
        },
      },
    });

    // Mileage Log
    const totalMiles = transactionData.business.mileage.reduce((sum, m) => sum + m.miles, 0);
    documents.push({
      id: 'mileage-log',
      name: 'Mileage Log',
      description: 'Vehicle Expenses',
      fullName: 'Business Mileage and Vehicle Expense Log',
      category: 'Business & Self-Employment',
      categoryIcon: Building2,
      autoGenerate: true,
      status: DOC_STATUS.READY,
      sources: ['manual'],
      lastUpdated: new Date(),
      generatedData: {
        totalAmount: taxSummary.business.mileage,
        totalMiles,
        ratePerMile: '$0.67',
        trips: transactionData.business.mileage.length,
        log: transactionData.business.mileage,
      },
    });
  } else {
    // No business income - show N/A for business forms
    ['schedule-c', 'schedule-se', 'home-office', 'mileage-log'].forEach(formId => {
      const formNames = {
        'schedule-c': { name: 'Schedule C', desc: 'Profit or Loss', full: 'Profit or Loss from Business' },
        'schedule-se': { name: 'Schedule SE', desc: 'Self-Employment Tax', full: 'Self-Employment Tax Calculation' },
        'home-office': { name: 'Home Office', desc: 'Form 8829', full: 'Expenses for Business Use of Your Home' },
        'mileage-log': { name: 'Mileage Log', desc: 'Vehicle Expenses', full: 'Business Mileage and Vehicle Expense Log' },
      };
      documents.push({
        id: formId,
        name: formNames[formId].name,
        description: formNames[formId].desc,
        fullName: formNames[formId].full,
        category: 'Business & Self-Employment',
        categoryIcon: Building2,
        autoGenerate: true,
        status: DOC_STATUS.NOT_APPLICABLE,
        sources: ['transactions'],
        lastUpdated: null,
        generatedData: null,
        note: 'No business income detected',
      });
    });
  }

  // ===== INVESTMENT DOCUMENTS =====
  documents.push({
    id: '1099-b',
    name: 'Form 1099-B',
    description: 'Brokerage Sales',
    fullName: 'Proceeds from Broker and Barter Exchange',
    category: 'Investment Documents',
    categoryIcon: PiggyBank,
    autoGenerate: false,
    status: investmentAccounts.length > 0 ? DOC_STATUS.PENDING_DATA : DOC_STATUS.NOT_APPLICABLE,
    sources: ['brokerage'],
    lastUpdated: null,
    generatedData: null,
    note: investmentAccounts.length > 0 ? 'Awaiting 1099-B from brokerage' : null,
  });

  // Schedule D - Capital Gains
  const capitalGains = investmentAccounts.reduce((sum, acc) => sum + (acc.capitalGains || 0), 0);
  documents.push({
    id: 'schedule-d',
    name: 'Schedule D',
    description: 'Capital Gains',
    fullName: 'Capital Gains and Losses Summary',
    category: 'Investment Documents',
    categoryIcon: PiggyBank,
    autoGenerate: true,
    status: capitalGains > 0 ? DOC_STATUS.READY : (investmentAccounts.length > 0 ? DOC_STATUS.PENDING_DATA : DOC_STATUS.NOT_APPLICABLE),
    sources: ['1099-b', 'transactions'],
    lastUpdated: capitalGains > 0 ? new Date() : null,
    generatedData: capitalGains > 0 ? {
      totalAmount: capitalGains,
      shortTerm: capitalGains * 0.3,
      longTerm: capitalGains * 0.7,
      accounts: investmentAccounts.map(acc => ({
        institution: acc.institution,
        account: `****${acc.mask}`,
        gains: acc.capitalGains || 0,
      })),
    } : null,
  });

  documents.push({
    id: '1099-r',
    name: 'Form 1099-R',
    description: 'Retirement Distributions',
    fullName: 'Distributions from Pensions, Annuities, IRAs',
    category: 'Investment Documents',
    categoryIcon: PiggyBank,
    autoGenerate: false,
    status: DOC_STATUS.NOT_APPLICABLE,
    sources: ['retirement_accounts'],
    lastUpdated: null,
    generatedData: null,
    note: 'No retirement distributions this year',
  });

  // Form 5498 - IRA Contributions
  const iraContributions = iraAccounts.reduce((sum, acc) => sum + (acc.contributions || 0), 0);
  documents.push({
    id: '5498',
    name: 'Form 5498',
    description: 'IRA Contributions',
    fullName: 'IRA Contribution Information',
    category: 'Investment Documents',
    categoryIcon: PiggyBank,
    autoGenerate: false,
    status: iraContributions > 0 ? DOC_STATUS.READY : (iraAccounts.length > 0 ? DOC_STATUS.PENDING_DATA : DOC_STATUS.NOT_APPLICABLE),
    sources: ['retirement_accounts'],
    lastUpdated: iraContributions > 0 ? new Date() : null,
    generatedData: iraContributions > 0 ? {
      totalAmount: iraContributions,
      accountType: 'Traditional IRA',
      contributions: iraAccounts.map(acc => ({
        institution: acc.institution,
        account: `****${acc.mask}`,
        amount: acc.contributions || 0,
      })),
    } : null,
  });

  // ===== SUMMARY REPORTS =====
  documents.push({
    id: 'tax-summary',
    name: 'Tax Summary',
    description: 'Annual Overview',
    fullName: 'Complete Annual Tax Summary for Tax Professional',
    category: 'Summary Reports',
    categoryIcon: FileCheck,
    autoGenerate: true,
    status: DOC_STATUS.READY,
    sources: ['all'],
    lastUpdated: new Date(),
    generatedData: {
      totalIncome: taxSummary.income.totalIncome,
      totalDeductions: taxSummary.deductions.totalItemized,
      businessProfit: taxSummary.business.netProfit,
      estimatedPayments: taxSummary.estimatedPayments,
      accounts: accounts.length,
      institutions: getInstitutionCount(),
    },
  });

  documents.push({
    id: 'income-summary',
    name: 'Income Summary',
    description: 'All Income Sources',
    fullName: 'Consolidated Income from All Sources',
    category: 'Summary Reports',
    categoryIcon: FileCheck,
    autoGenerate: true,
    status: DOC_STATUS.READY,
    sources: ['transactions', 'accounts'],
    lastUpdated: new Date(),
    generatedData: {
      totalAmount: taxSummary.income.totalIncome,
      wages: taxSummary.income.wages,
      freelance: taxSummary.income.freelance,
      interest: taxSummary.income.interest,
      dividends: taxSummary.income.dividends,
    },
  });

  documents.push({
    id: 'deduction-summary',
    name: 'Deduction Summary',
    description: 'All Deductions',
    fullName: 'Itemized Deduction Summary',
    category: 'Summary Reports',
    categoryIcon: FileCheck,
    autoGenerate: true,
    status: DOC_STATUS.READY,
    sources: ['transactions'],
    lastUpdated: new Date(),
    generatedData: {
      totalAmount: taxSummary.deductions.totalItemized,
      charitable: taxSummary.deductions.charitable,
      medical: taxSummary.deductions.medical,
      mortgageInterest: taxSummary.deductions.mortgageInterest,
      studentLoanInterest: taxSummary.deductions.studentLoanInterest,
      standardDeduction: 14600, // 2024 single filer
      recommendation: taxSummary.deductions.totalItemized > 14600 ? 'Itemize' : 'Standard',
    },
  });

  documents.push({
    id: 'quarterly-estimates',
    name: 'Quarterly Estimates',
    description: 'Estimated Tax Payments',
    fullName: 'Record of Quarterly Estimated Tax Payments',
    category: 'Summary Reports',
    categoryIcon: FileCheck,
    autoGenerate: true,
    status: DOC_STATUS.READY,
    sources: ['transactions'],
    lastUpdated: new Date(),
    generatedData: {
      totalAmount: taxSummary.estimatedPayments,
      payments: transactionData.estimatedPayments.map(p => ({
        quarter: p.quarter,
        date: p.date,
        amount: p.amount,
      })),
    },
  });

  return documents;
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = status;
  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className}`}>
      {Icon && <Icon size={12} className={config.className === 'generating' ? 'spinning' : ''} />}
      <span>{config.label}</span>
    </span>
  );
}

// Document Card Component
function DocumentCard({ document, onGenerate, onDownload, onPrint, isGenerating }) {
  return (
    <div className={`document-card ${document.status.className}`}>
      <div className="doc-header">
        <div className="doc-icon">
          <FileText size={20} />
        </div>
        <div className="doc-info">
          <h4>{document.name}</h4>
          <p>{document.description}</p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      <div className="doc-details">
        <span className="doc-full-name">{document.fullName}</span>
        {document.generatedData && document.status === DOC_STATUS.READY && (
          <div className="doc-stats">
            <span className="doc-amount">
              <DollarSign size={12} />
              {formatCurrency(document.generatedData.totalAmount)}
            </span>
            {document.generatedData.itemCount !== undefined && (
              <span className="doc-items">{document.generatedData.itemCount} items</span>
            )}
          </div>
        )}
        {document.note && document.status !== DOC_STATUS.READY && (
          <span className="doc-note">{document.note}</span>
        )}
        {document.lastUpdated && (
          <span className="doc-updated">
            Updated: {document.lastUpdated.toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="doc-actions">
        {document.autoGenerate && document.status !== DOC_STATUS.GENERATING &&
         document.status !== DOC_STATUS.NOT_APPLICABLE && (
          <button
            className="action-btn icon-only generate"
            onClick={() => onGenerate(document.id)}
            disabled={isGenerating}
            title={document.status === DOC_STATUS.READY ? 'Regenerate' : 'Generate'}
          >
            <Sparkles size={14} />
          </button>
        )}

        {document.status === DOC_STATUS.GENERATING && (
          <button className="action-btn icon-only generating" disabled title="Generating...">
            <Loader2 size={14} className="spinning" />
          </button>
        )}

        {document.status === DOC_STATUS.READY && (
          <>
            <button
              className="action-btn icon-only view"
              onClick={() => onDownload(document.id, 'view')}
              title="Preview document"
            >
              <Eye size={14} />
            </button>
            <button
              className="action-btn icon-only download"
              onClick={() => onDownload(document.id, 'download')}
              title="Download PDF"
            >
              <Download size={14} />
            </button>
            <button
              className="action-btn icon-only print"
              onClick={() => onPrint(document.id)}
              title="Print document"
            >
              <Printer size={14} />
            </button>
          </>
        )}

        {document.status === DOC_STATUS.PENDING_DATA && (
          <span className="pending-note">
            <AlertTriangle size={12} />
            Awaiting external data
          </span>
        )}
      </div>
    </div>
  );
}

// Data Sources Panel
function DataSourcesPanel({ accounts, institutions }) {
  return (
    <div className="data-sources-panel">
      <div className="sources-header">
        <Link2 size={16} />
        <h3>Connected Data Sources</h3>
      </div>
      <div className="sources-stats">
        <div className="source-stat">
          <Building2 size={18} />
          <span className="stat-value">{institutions}</span>
          <span className="stat-label">Institutions</span>
        </div>
        <div className="source-stat">
          <Users size={18} />
          <span className="stat-value">{accounts.length}</span>
          <span className="stat-label">Accounts</span>
        </div>
        <div className="source-stat">
          <TrendingUp size={18} />
          <span className="stat-value">{accounts.filter(a => a.type === 'investment').length}</span>
          <span className="stat-label">Investment</span>
        </div>
      </div>
      <p className="sources-note">
        Tax documents are auto-filled from your synced account data and categorized transactions.
      </p>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="tax-docs-state loading">
      <Loader2 size={40} className="spinning" />
      <p>Loading tax documents...</p>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="tax-docs-state empty">
      <div className="empty-icon">
        <FileText size={32} />
      </div>
      <h3>No data sources connected</h3>
      <p>Connect bank accounts and import transactions to auto-generate tax documents.</p>
      <a href="/core/bank-connections" className="connect-btn">
        <Link2 size={16} />
        Connect Accounts
      </a>
    </div>
  );
}

export default function TaxDocuments() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get accounts and tax summary from shared data
  const accounts = useMemo(() => getAllAccounts(), []);
  const taxSummary = useMemo(() => calculateTaxSummary(selectedYear), [selectedYear]);
  const hasData = checkHasConnectedAccounts();
  const institutionCount = getInstitutionCount();

  // Load documents based on real account data
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const docs = generateTaxDocuments(selectedYear, taxSummary, accounts);
      setDocuments(docs);
      setLoading(false);
    };

    loadDocuments();
  }, [selectedYear, taxSummary, accounts]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const docs = generateTaxDocuments(selectedYear, taxSummary, accounts);
    setDocuments(docs);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Handle generate - regenerates document with latest data
  const handleGenerate = async (docId) => {
    setGeneratingIds(prev => new Set([...prev, docId]));

    // Update status to generating
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? { ...doc, status: DOC_STATUS.GENERATING }
          : doc
      )
    );

    // Simulate generation with real data calculation
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Regenerate all documents to get fresh data
    const freshDocs = generateTaxDocuments(selectedYear, taxSummary, accounts);
    const freshDoc = freshDocs.find(d => d.id === docId);

    // Update document with fresh data
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId && freshDoc
          ? { ...freshDoc, lastUpdated: new Date() }
          : doc
      )
    );

    setGeneratingIds(prev => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
  };

  // Handle download
  const handleDownload = (docId, action) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      console.log(`${action === 'view' ? 'Viewing' : 'Downloading'}: ${doc.name}`, doc.generatedData);
      // In real app, would generate PDF with filled data and trigger download/preview
      alert(`${action === 'view' ? 'Preview' : 'Download'}: ${doc.name}\n\nThis document contains ${formatCurrency(doc.generatedData?.totalAmount || 0)} in ${doc.description.toLowerCase()}.`);
    }
  };

  // Handle print
  const handlePrint = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      console.log(`Printing: ${doc.name}`, doc.generatedData);
      window.print();
    }
  };

  // Handle generate all
  const handleGenerateAll = async () => {
    const autoGenDocs = documents.filter(d =>
      d.autoGenerate &&
      d.status !== DOC_STATUS.GENERATING &&
      d.status !== DOC_STATUS.NOT_APPLICABLE
    );

    for (const doc of autoGenDocs) {
      await handleGenerate(doc.id);
    }
  };

  // Handle download all
  const handleDownloadAll = () => {
    const readyDocs = documents.filter(d => d.status === DOC_STATUS.READY);
    console.log(`Downloading ${readyDocs.length} documents as ZIP`, readyDocs);
    alert(`Downloading ${readyDocs.length} tax documents as a ZIP file.\n\nTotal documented income: ${formatCurrency(taxSummary.income.totalIncome)}\nTotal deductions: ${formatCurrency(taxSummary.deductions.totalItemized)}`);
  };

  // Group documents by category
  const categories = ['Income Documents', 'Deduction Documents', 'Business & Self-Employment', 'Investment Documents', 'Summary Reports'];
  const groupedDocuments = categories.map(category => ({
    category,
    icon: documents.find(d => d.category === category)?.categoryIcon || FileText,
    documents: documents.filter(d => d.category === category),
  }));

  // Stats
  const readyCount = documents.filter(d => d.status === DOC_STATUS.READY).length;
  const pendingCount = documents.filter(d => d.status === DOC_STATUS.PENDING_DATA).length;
  const generatingCount = documents.filter(d => d.status === DOC_STATUS.GENERATING).length;

  if (loading) {
    return (
      <div className="tax-documents-page">
        <div className="page-header">
          <div>
            <h1>Tax Documents</h1>
            <p>Auto-generate and manage tax forms</p>
          </div>
        </div>
        <LoadingState />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="tax-documents-page">
        <div className="page-header">
          <div>
            <h1>Tax Documents</h1>
            <p>Auto-generate and manage tax forms</p>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="tax-documents-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Tax Documents</h1>
          <p>Auto-generate and manage tax forms for your tax professional</p>
        </div>
        <div className="header-actions">
          <div className="year-selector">
            <Calendar size={16} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {TAX_YEARS.map(year => (
                <option key={year} value={year}>Tax Year {year}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="tax-advisory-banner">
        <Shield size={16} />
        <div>
          <strong>For Tax Professional Use</strong>
          <p>These documents are auto-generated from your {institutionCount} connected institutions and {accounts.length} synced accounts. Always verify accuracy before filing.</p>
        </div>
      </div>

      {/* Data Sources Panel */}
      <DataSourcesPanel accounts={accounts} institutions={institutionCount} />

      {/* Stats Bar */}
      <div className="tax-stats-bar">
        <div className="stat-item">
          <CheckCircle size={16} />
          <span className="stat-value">{readyCount}</span>
          <span className="stat-label">Ready</span>
        </div>
        <div className="stat-item pending">
          <Clock size={16} />
          <span className="stat-value">{pendingCount}</span>
          <span className="stat-label">Pending Data</span>
        </div>
        <div className="stat-item generating">
          <Loader2 size={16} className={generatingCount > 0 ? 'spinning' : ''} />
          <span className="stat-value">{generatingCount}</span>
          <span className="stat-label">Generating</span>
        </div>
        <div className="stat-actions">
          <button
            className="action-btn refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh All"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
          </button>
          <button
            className="action-btn generate-all"
            onClick={handleGenerateAll}
            disabled={generatingIds.size > 0}
            title="Generate All"
          >
            <Sparkles size={16} />
          </button>
          <button
            className="action-btn download-all"
            onClick={handleDownloadAll}
            disabled={readyCount === 0}
            title="Download All"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Document Categories */}
      <div className="document-categories">
        {groupedDocuments.map(category => {
          const CategoryIcon = category.icon;
          const readyInCategory = category.documents.filter(d => d.status === DOC_STATUS.READY).length;

          return (
            <div key={category.category} className="category-section">
              <div className="category-header">
                <CategoryIcon size={20} />
                <h3>{category.category}</h3>
                <span className="category-count">
                  {readyInCategory} / {category.documents.length} ready
                </span>
              </div>
              <div className="documents-grid">
                {category.documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onGenerate={handleGenerate}
                    onDownload={handleDownload}
                    onPrint={handlePrint}
                    isGenerating={generatingIds.has(doc.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="tax-docs-footer">
        <span className="refresh-time">
          <Clock size={12} />
          Last refreshed: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="tax-year-note">
          Showing documents for Tax Year {selectedYear}
        </span>
      </div>
    </div>
  );
}
