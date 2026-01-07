export type DashboardNavItem = {
  label: string;
  href: string;
  badge?: string;
};

export type DashboardNavSection = {
  section: string;
  items: DashboardNavItem[];
};

/**
 * Single source of truth for dashboard navigation.
 * Built from your /(dashboard).zip routes + added /dashboard/connect-bank.
 */
export const DASHBOARD_NAV: DashboardNavSection[] = [
  {
    section: "Core",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Connect Bank", href: "/dashboard/connect-bank" },
      { label: "Accounts", href: "/accounts" },
      { label: "Transactions", href: "/transactions" },
      { label: "Reconciliation", href: "/reconciliation" },
      { label: "Ledger", href: "/ledger" },
      { label: "Journal", href: "/journal" },
    ],
  },
  {
    section: "Reports",
    items: [
      { label: "Trial Balance", href: "/trial-balance" },
      { label: "Financial Reports", href: "/financial-reports" },
      { label: "Cash Flow", href: "/cash-flow" },
      { label: "Aging Reports", href: "/aging-reports" },
    ],
  },
  {
    section: "Money In / Out",
    items: [
      { label: "Invoices", href: "/invoices" },
      { label: "Bills", href: "/bills" },
      { label: "Receipts", href: "/receipts" },
    ],
  },
  {
    section: "CRM",
    items: [
      { label: "Customers", href: "/customers" },
      { label: "Vendors", href: "/vendors" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Payroll", href: "/payroll" },
      { label: "Tax", href: "/tax" },
      { label: "Credit", href: "/credit" },
      { label: "Leases", href: "/leases" },
      { label: "Maintenance", href: "/maintenance" },
      { label: "Testing", href: "/testing" },
    ],
  },
  {
    section: "Property",
    items: [
      { label: "Properties", href: "/properties" },
      { label: "Units", href: "/units" },
      { label: "Tenants", href: "/tenants" },
      { label: "Rent Collection", href: "/rent-collection" },
    ],
  },
  {
    section: "Compliance",
    items: [
      { label: "DCAA", href: "/dcaa" },
      { label: "Compliance", href: "/compliance" },
      { label: "Certifications", href: "/certifications" },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Alerts", href: "/alerts" },
      { label: "Settings", href: "/settings" },
      { label: "QuickBooks Migration", href: "/quickbooks-migration" },
      { label: "CFO Mode", href: "/cfo-mode" },
      { label: "AI Worker", href: "/ai-worker" },
      // Route exists in zip under /dashboard/tax-optimization, but keep it as a deep link:
      { label: "Tax Optimization", href: "/dashboard/tax-optimization" },
    ],
  },
];
