"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Wallet,
  PiggyBank,
  Receipt,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Zap,
  Lightbulb,
  AlertTriangle,
  Target,
  X,
  Building2,
  CreditCard,
  Landmark,
  DollarSign,
  TrendingUp as TrendUp,
  Minus,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Coffee,
  Pizza,
  ShieldCheck,
  FileText,
  Users,
  Store,
} from "lucide-react";
import PageHelp from "@/components/dashboard/PageHelp";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Types
interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  icon: React.ComponentType<{ className?: string }>;
}

interface StatCard {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AIInsight {
  id: string;
  type: "tip" | "warning" | "goal";
  title: string;
  description: string;
  detailedInfo: {
    summary: string;
    stats?: { label: string; value: string; change?: number }[];
    breakdown?: {
      item: string;
      amount: number;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
    recommendations?: string[];
    actionButton?: { label: string; href: string };
    timeline?: { date: string; event: string; completed?: boolean }[];
    dueDate?: string;
    progress?: number;
    targetAmount?: number;
    currentAmount?: number;
  };
}

// Mock Data
const cashFlowData = [
  { month: "Jul", income: 8200, expenses: 5400 },
  { month: "Aug", income: 9100, expenses: 6200 },
  { month: "Sep", income: 7800, expenses: 5800 },
  { month: "Oct", income: 10500, expenses: 6100 },
  { month: "Nov", income: 9800, expenses: 5900 },
  { month: "Dec", income: 11200, expenses: 6800 },
];

const spendingData = [
  { name: "Housing", value: 2400, color: "#d4a855" },
  { name: "Transportation", value: 800, color: "#f0c060" },
  { name: "Food & Dining", value: 650, color: "#a07830" },
  { name: "Utilities", value: 350, color: "#4ade80" },
  { name: "Shopping", value: 520, color: "#60a5fa" },
  { name: "Other", value: 380, color: "#888888" },
];

const transactions: Transaction[] = [
  {
    id: "1",
    merchant: "Whole Foods Market",
    date: "Today",
    amount: -127.43,
    category: "Groceries",
    type: "expense",
    icon: ShoppingCart,
  },
  {
    id: "2",
    merchant: "Salary Deposit",
    date: "Yesterday",
    amount: 4500.0,
    category: "Income",
    type: "income",
    icon: Wallet,
  },
  {
    id: "3",
    merchant: "Shell Gas Station",
    date: "Dec 28",
    amount: -54.99,
    category: "Transportation",
    type: "expense",
    icon: Car,
  },
  {
    id: "4",
    merchant: "Netflix",
    date: "Dec 27",
    amount: -15.99,
    category: "Entertainment",
    type: "expense",
    icon: Zap,
  },
  {
    id: "5",
    merchant: "Electric Company",
    date: "Dec 26",
    amount: -142.5,
    category: "Utilities",
    type: "expense",
    icon: Home,
  },
];

const aiInsights: AIInsight[] = [
  {
    id: "1",
    type: "tip",
    title: "Savings Opportunity",
    description:
      "Your dining expenses are 23% higher than last month. Consider meal prepping to save ~$180/month.",
    detailedInfo: {
      summary:
        "Your food and dining spending has increased significantly this month. Here's a detailed breakdown and actionable tips to reduce costs.",
      stats: [
        { label: "This Month", value: "$847", change: 23 },
        { label: "Last Month", value: "$689", change: 0 },
        { label: "Monthly Average", value: "$712", change: 0 },
        { label: "Potential Savings", value: "$180/mo", change: 0 },
      ],
      breakdown: [
        { item: "Restaurants", amount: 412, icon: Utensils },
        { item: "Coffee Shops", amount: 156, icon: Coffee },
        { item: "Food Delivery", amount: 189, icon: Pizza },
        { item: "Groceries", amount: 90, icon: ShoppingCart },
      ],
      recommendations: [
        "Meal prep on Sundays to reduce weekday restaurant visits",
        "Brew coffee at home - potential savings of $120/month",
        "Limit food delivery to once per week maximum",
        "Use cashback apps when dining out (average 5% back)",
        "Set a weekly dining budget of $150 in the app",
      ],
      actionButton: { label: "Set Dining Budget", href: "/budgets" },
    },
  },
  {
    id: "2",
    type: "warning",
    title: "Upcoming Bill",
    description:
      "Your car insurance payment of $245 is due in 3 days. Ensure sufficient balance.",
    detailedInfo: {
      summary:
        "You have an upcoming car insurance payment. Here's what you need to know to avoid late fees.",
      stats: [
        { label: "Amount Due", value: "$245.00", change: 0 },
        { label: "Due Date", value: "Jan 2, 2025", change: 0 },
        { label: "Account Balance", value: "$12,450", change: 0 },
        { label: "After Payment", value: "$12,205", change: 0 },
      ],
      dueDate: "2025-01-02",
      timeline: [
        { date: "Dec 2", event: "Previous payment processed", completed: true },
        { date: "Dec 15", event: "Statement generated", completed: true },
        { date: "Dec 30", event: "Payment reminder sent", completed: true },
        { date: "Jan 2", event: "Payment due", completed: false },
        { date: "Jan 3", event: "Late fee applies ($25)", completed: false },
      ],
      recommendations: [
        "Set up autopay to never miss a payment",
        "Consider paying bi-annually for 5% discount",
        "Shop around for better rates - you may save $300/year",
        "Bundle with home/renters insurance for additional savings",
      ],
      actionButton: { label: "Pay Now", href: "/bills" },
    },
  },
  {
    id: "3",
    type: "goal",
    title: "Goal Progress",
    description:
      "You're 67% towards your emergency fund goal. At this rate, you'll reach it by March.",
    detailedInfo: {
      summary:
        "Great progress on your emergency fund! You're on track to reach your goal ahead of schedule.",
      stats: [
        { label: "Target Amount", value: "$15,000", change: 0 },
        { label: "Current Balance", value: "$10,050", change: 12 },
        { label: "Monthly Contribution", value: "$850", change: 5 },
        { label: "Months Remaining", value: "~6 months", change: 0 },
      ],
      progress: 67,
      targetAmount: 15000,
      currentAmount: 10050,
      timeline: [
        { date: "Jul 2024", event: "Goal created - $0", completed: true },
        { date: "Sep 2024", event: "Reached 25% - $3,750", completed: true },
        { date: "Nov 2024", event: "Reached 50% - $7,500", completed: true },
        { date: "Dec 2024", event: "Current - $10,050 (67%)", completed: true },
        { date: "Mar 2025", event: "Projected completion", completed: false },
      ],
      recommendations: [
        "Increase monthly contribution by $50 to finish in February",
        "Consider a high-yield savings account (4.5% APY)",
        "Set up automatic transfers on payday",
        "Once complete, start investing the surplus",
      ],
      actionButton: { label: "Adjust Goal", href: "/goals" },
    },
  },
];

// Net Worth Breakdown Data
interface Asset {
  name: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  category: "cash" | "investments" | "property";
  description?: string;
}

interface Liability {
  name: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  category: "credit" | "loans" | "mortgage";
  interestRate?: number;
  description?: string;
}

const assets: Asset[] = [
  {
    name: "Chase Checking",
    value: 12450,
    icon: Landmark,
    category: "cash",
    description: "Primary checking account",
  },
  {
    name: "Chase Savings",
    value: 28500,
    icon: PiggyBank,
    category: "cash",
    description: "Emergency fund",
  },
  {
    name: "Fidelity 401(k)",
    value: 67800,
    icon: TrendUp,
    category: "investments",
    description: "Employer-sponsored retirement",
  },
  {
    name: "Robinhood Brokerage",
    value: 15200,
    icon: TrendUp,
    category: "investments",
    description: "Individual stocks & ETFs",
  },
  {
    name: "Crypto Holdings",
    value: 8500,
    icon: DollarSign,
    category: "investments",
    description: "Bitcoin & Ethereum",
  },
  {
    name: "Vehicle (2021 Honda)",
    value: 18500,
    icon: Car,
    category: "property",
    description: "Estimated market value",
  },
  {
    name: "Personal Property",
    value: 5000,
    icon: Home,
    category: "property",
    description: "Furniture, electronics, etc.",
  },
];

const liabilities: Liability[] = [
  {
    name: "Chase Credit Card",
    value: 3420,
    icon: CreditCard,
    category: "credit",
    interestRate: 24.99,
    description: "Current balance",
  },
  {
    name: "Amex Blue Cash",
    value: 1850,
    icon: CreditCard,
    category: "credit",
    interestRate: 21.24,
    description: "Current balance",
  },
  {
    name: "Auto Loan",
    value: 12400,
    icon: Car,
    category: "loans",
    interestRate: 5.9,
    description: "36 months remaining",
  },
  {
    name: "Student Loans",
    value: 13700,
    icon: Building2,
    category: "loans",
    interestRate: 4.5,
    description: "Federal loans",
  },
];

const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
const totalLiabilities = liabilities.reduce(
  (sum, liability) => sum + liability.value,
  0,
);
const calculatedNetWorth = totalAssets - totalLiabilities;

const statCards: StatCard[] = [
  {
    label: "Net Worth",
    value: "$124,580",
    trend: 8.2,
    trendLabel: "vs last month",
    icon: Wallet,
  },
  {
    label: "Income",
    value: "$11,200",
    trend: 14.3,
    trendLabel: "this month",
    icon: TrendingUp,
  },
  {
    label: "Expenses",
    value: "$6,800",
    trend: -5.2,
    trendLabel: "vs last month",
    icon: Receipt,
  },
  {
    label: "Savings",
    value: "$4,400",
    trend: 12.8,
    trendLabel: "this month",
    icon: PiggyBank,
  },
];

// Helpers
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getInsightIcon = (type: AIInsight["type"]) => {
  switch (type) {
    case "tip":
      return <Lightbulb className="text-primary h-5 w-5" />;
    case "warning":
      return <AlertTriangle className="text-reconai-warning h-5 w-5" />;
    case "goal":
      return <Target className="text-reconai-success h-5 w-5" />;
  }
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Groceries: "bg-green-500/20 text-green-400",
    Income: "bg-primary/20 text-primary",
    Transportation: "bg-blue-500/20 text-blue-400",
    Entertainment: "bg-purple-500/20 text-purple-400",
    Utilities: "bg-orange-500/20 text-orange-400",
  };
  return colors[category] || "bg-card/20 text-muted-foreground";
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

// Custom Tooltip for charts
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="border-border rounded-lg border bg-card/70 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-muted-foreground mb-1 text-xs">{label}</p>
        {payload.map((entry, index: number) => (
          <p
            key={index}
            className="font-mono text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: ${(entry.value ?? 0).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useUser();
  const { metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const greeting = getGreeting();
  const totalSpending = spendingData.reduce((acc, item) => acc + item.value, 0);
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);
  const [expandedAssetCategory, setExpandedAssetCategory] = useState<
    string | null
  >(null);
  const [expandedLiabilityCategory, setExpandedLiabilityCategory] = useState<
    string | null
  >(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(
    null,
  );
  // Prevent recharts negative dimension warnings - charts render after hydration
  // Use lazy initial state to detect client-side rendering
  const [chartsMounted] = useState(() => typeof window !== "undefined");

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Group assets by category
  const assetsByCategory = assets.reduce(
    (acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    },
    {} as Record<string, Asset[]>,
  );

  // Group liabilities by category
  const liabilitiesByCategory = liabilities.reduce(
    (acc, liability) => {
      if (!acc[liability.category]) acc[liability.category] = [];
      acc[liability.category].push(liability);
      return acc;
    },
    {} as Record<string, Liability[]>,
  );

  const getCategoryTotal = (items: (Asset | Liability)[]) =>
    items.reduce((sum, item) => sum + item.value, 0);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cash: "Cash & Bank Accounts",
      investments: "Investments",
      property: "Property & Assets",
      credit: "Credit Cards",
      loans: "Loans",
      mortgage: "Mortgage",
    };
    return labels[category] || category;
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-3xl -translate-x-1/2 rounded-full bg-linear-to-r from-primary/25 via-purple-500/10 to-cyan-500/15 blur-3xl dark:from-primary/20 dark:via-purple-500/10 dark:to-cyan-500/10" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-linear-to-tr from-cyan-500/15 via-primary/10 to-transparent blur-3xl dark:from-cyan-500/10 dark:via-primary/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-linear-to-tr from-purple-500/15 via-primary/10 to-transparent blur-3xl dark:from-purple-500/10 dark:via-primary/10" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <motion.div
          className="w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Greeting Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase">
                Dashboard
              </p>
              <PageHelp
                title="Dashboard"
                description="Your central hub for financial intelligence. Get a complete snapshot of your finances including net worth, spending trends, and AI-powered insights."
                features={[
                  "Real-time net worth tracking across all accounts",
                  "Spending analysis with category breakdown",
                  "AI-generated insights and recommendations",
                  "Cash flow trends and projections",
                ]}
                tips={[
                  "Click on stat cards to see detailed breakdowns",
                  "AI insights are personalized based on your spending patterns",
                ]}
              />
            </div>
            <h1 className="text-foreground text-3xl font-light">
              {greeting}
              {user?.firstName && (
                <span className="text-primary">, {user.firstName}</span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s your financial overview for{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </motion.div>

          {/* Stat Cards */}
          <motion.div
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
          >
            {statCards.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.trend > 0;
              const isExpense = stat.label === "Expenses";
              const isNetWorth = stat.label === "Net Worth";
              const trendColor = isExpense
                ? isPositive
                  ? "text-reconai-error"
                  : "text-reconai-success"
                : isPositive
                  ? "text-reconai-success"
                  : "text-reconai-error";

              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  onClick={
                    isNetWorth ? () => setShowNetWorthModal(true) : undefined
                  }
                  className={`group hover:border-primary/20 hover:shadow-lg rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm transition-all duration-300 ${
                    isNetWorth ? "cursor-pointer" : ""
                  }`}
                  whileHover={isNetWorth ? { scale: 1.02 } : undefined}
                  whileTap={isNetWorth ? { scale: 0.98 } : undefined}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/60">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      {(isExpense ? !isPositive : isPositive) ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-mono text-sm">
                        {Math.abs(stat.trend)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-primary mb-1 font-mono text-3xl font-bold">
                    {stat.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm tracking-wider uppercase">
                      {stat.label}
                    </p>
                    {isNetWorth && (
                      <span className="text-primary/60 group-hover:text-primary font-mono text-[10px] tracking-wider uppercase transition-colors">
                        Click for details
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Financial Overview - Real Data from Database */}
          <div aria-live="polite" aria-busy={metricsLoading}>
            {metricsLoading ? (
              <motion.div
                variants={itemVariants}
                className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                role="status"
              >
                <div className="animate-pulse rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm">
                  <div className="mb-4 h-10 rounded bg-card/10"></div>
                  <div className="mb-2 h-8 rounded bg-card/20"></div>
                  <div className="h-4 rounded bg-card/10"></div>
                  <span className="sr-only">Loading financial metrics...</span>
                </div>
              </motion.div>
            ) : (
              metrics && (
                <motion.div
                  variants={itemVariants}
                  className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                  {/* Accounts Receivable */}
                  <Link href="/invoices" className="group">
                    <div className="hover:border-primary/20 rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm transition-all duration-300">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                          <FileText className="h-5 w-5 text-green-400" />
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {metrics.counts.invoices} invoices
                        </span>
                      </div>
                      <p className="mb-1 font-mono text-2xl font-bold text-green-400">
                        {formatCurrency(metrics.summary.totalInvoiceDue)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm tracking-wider uppercase">
                          Receivables
                        </p>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                      <div className="mt-3 flex gap-2 text-xs">
                        {metrics.invoicesByStatus.overdue > 0 && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-400">
                            {metrics.invoicesByStatus.overdue} overdue
                          </span>
                        )}
                        {metrics.invoicesByStatus.pending > 0 && (
                          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
                            {metrics.invoicesByStatus.pending} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Accounts Payable */}
                  <Link href="/bills" className="group">
                    <div className="hover:border-primary/20 rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm transition-all duration-300">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                          <Receipt className="h-5 w-5 text-red-400" />
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {metrics.counts.bills} bills
                        </span>
                      </div>
                      <p className="mb-1 font-mono text-2xl font-bold text-red-400">
                        {formatCurrency(metrics.summary.totalBillDue)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm tracking-wider uppercase">
                          Payables
                        </p>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                      <div className="mt-3 flex gap-2 text-xs">
                        {metrics.billsByStatus.overdue > 0 && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-400">
                            {metrics.billsByStatus.overdue} overdue
                          </span>
                        )}
                        {metrics.billsByStatus.pending > 0 && (
                          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
                            {metrics.billsByStatus.pending} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Customers */}
                  <Link href="/customers" className="group">
                    <div className="hover:border-primary/20 rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm transition-all duration-300">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {metrics.counts.customers} total
                        </span>
                      </div>
                      <p className="mb-1 font-mono text-2xl font-bold text-blue-400">
                        {formatCurrency(metrics.summary.totalInvoiced)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm tracking-wider uppercase">
                          Customers
                        </p>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                      <p className="text-muted-foreground mt-3 text-xs">
                        {formatCurrency(metrics.summary.totalInvoicePaid)}{" "}
                        collected
                      </p>
                    </div>
                  </Link>

                  {/* Vendors */}
                  <Link href="/vendors" className="group">
                    <div className="hover:border-primary/20 rounded-xl border border-white/5 bg-card/70 p-5 backdrop-blur-sm transition-all duration-300">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                          <Store className="h-5 w-5 text-purple-400" />
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {metrics.counts.vendors} total
                        </span>
                      </div>
                      <p className="mb-1 font-mono text-2xl font-bold text-purple-400">
                        {formatCurrency(metrics.summary.totalBilled)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm tracking-wider uppercase">
                          Vendors
                        </p>
                        <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                      </div>
                      <p className="text-muted-foreground mt-3 text-xs">
                        {formatCurrency(metrics.summary.totalBillPaid)} paid
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            )}
          </div>

          {/* Charts Section */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Cash Flow Chart */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-white/5 bg-card/70 p-6 backdrop-blur-sm"
              role="img"
              aria-label="Cash flow chart showing income and expenses trends from July to December. Income ranges from $7,800 to $11,200, while expenses range from $5,400 to $6,800."
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-primary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
                    Overview
                  </p>
                  <h2 className="text-foreground text-lg">Cash Flow</h2>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary h-3 w-3 rounded-full" />
                    <span className="text-muted-foreground">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-3 w-3 rounded-full" />
                    <span className="text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                {chartsMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#d4a855"
                        strokeWidth={2}
                        dot={{ fill: "#d4a855", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: "#f0c060" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke="#888888"
                        strokeWidth={2}
                        dot={{ fill: "#888888", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: "#aaaaaa" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Spending Breakdown Chart */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-white/5 bg-card/70 p-6 backdrop-blur-sm"
              role="img"
              aria-label="Spending breakdown pie chart. Housing: $2,400 (largest category), Transportation: $800, Food and Dining: $650, Utilities: $350, Shopping: $520, Other: $380."
            >
              <div className="mb-6">
                <p className="text-primary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
                  Breakdown
                </p>
                <h2 className="text-foreground text-lg">
                  Spending by Category
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48">
                  {chartsMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {spendingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="border-border rounded-lg border bg-card/70 p-3 shadow-xl backdrop-blur-sm">
                                  <p className="text-foreground text-sm font-medium">
                                    {data.name}
                                  </p>
                                  <p className="text-primary font-mono text-sm">
                                    ${data.value.toLocaleString()}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {(
                                      (data.value / totalSpending) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {spendingData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-foreground text-sm">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-foreground font-mono text-sm">
                        ${item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Transactions */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <div>
                  <p className="text-primary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
                    Recent Activity
                  </p>
                  <h2 className="text-foreground text-lg">Transactions</h2>
                </div>
                <Link
                  href="/receipts"
                  className="text-primary hover:text-primary-bright flex items-center gap-1 font-mono text-sm tracking-wider uppercase transition-colors"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const Icon = tx.icon;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-white/2"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            tx.type === "income"
                              ? "bg-primary/10"
                              : "bg-card/10"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              tx.type === "income"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {tx.merchant}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${getCategoryColor(
                                tx.category,
                              )}`}
                            >
                              {tx.category}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {tx.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`font-mono font-semibold ${
                          tx.amount > 0
                            ? "text-reconai-success"
                            : "text-foreground"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}$
                        {Math.abs(tx.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-xl border border-white/5 bg-card/70 backdrop-blur-sm"
            >
              <div className="border-b border-white/5 p-5">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" />
                  <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase">
                    AI Powered
                  </p>
                </div>
                <h2 className="text-foreground text-lg">Smart Insights</h2>
              </div>
              <div className="space-y-3 p-4">
                {aiInsights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedInsight(insight)}
                    className="hover:border-primary/20 group cursor-pointer rounded-lg border border-white/5 bg-card/60 p-4 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground mb-1 font-medium">
                            {insight.title}
                          </p>
                          <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Net Worth Breakdown Modal */}
        <AnimatePresence>
          {showNetWorthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
              onClick={() => setShowNetWorthModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="border-border max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border bg-card/70 shadow-2xl backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/5 p-6">
                  <div>
                    <p className="text-primary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
                      Breakdown
                    </p>
                    <h2 className="text-foreground text-2xl font-light">
                      Net Worth
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNetWorthModal(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-card/10"
                  >
                    <X className="text-muted-foreground h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="max-h-[calc(85vh-180px)] overflow-y-auto p-6">
                  {/* Net Worth Summary */}
                  <div className="mb-6 rounded-xl border border-white/5 bg-card/60 p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-wider uppercase">
                          Total Assets
                        </p>
                        <p className="text-reconai-success font-mono text-2xl font-bold">
                          ${totalAssets.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <Minus className="text-muted-foreground mb-2 h-6 w-6" />
                        <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                          Minus
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-wider uppercase">
                          Total Liabilities
                        </p>
                        <p className="text-reconai-error font-mono text-2xl font-bold">
                          ${totalLiabilities.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="border-border mt-6 border-t pt-4 text-center">
                      <p className="text-muted-foreground mb-2 font-mono text-xs tracking-wider uppercase">
                        Net Worth
                      </p>
                      <p className="text-primary font-mono text-4xl font-bold">
                        ${calculatedNetWorth.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Assets Section */}
                  <div className="mb-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Plus className="text-reconai-success h-5 w-5" />
                      <h3 className="text-foreground text-lg font-medium">
                        Assets
                      </h3>
                      <span className="text-reconai-success ml-auto font-mono text-sm">
                        ${totalAssets.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(assetsByCategory).map(
                        ([category, items]) => (
                          <div
                            key={category}
                            className="overflow-hidden rounded-lg border border-white/5 bg-card/60"
                          >
                            <button
                              onClick={() =>
                                setExpandedAssetCategory(
                                  expandedAssetCategory === category
                                    ? null
                                    : category,
                                )
                              }
                              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-card/10"
                            >
                              <span className="text-foreground text-sm font-medium">
                                {getCategoryLabel(category)}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-reconai-success font-mono text-sm">
                                  ${getCategoryTotal(items).toLocaleString()}
                                </span>
                                <motion.div
                                  animate={{
                                    rotate:
                                      expandedAssetCategory === category
                                        ? 180
                                        : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                                </motion.div>
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedAssetCategory === category && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 px-4 pb-3">
                                    {items.map((asset, idx) => {
                                      const AssetIcon = asset.icon;
                                      return (
                                        <div
                                          key={idx}
                                          className="bg-background/50 flex items-center justify-between rounded-lg px-3 py-2"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="bg-reconai-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                              <AssetIcon className="text-reconai-success h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-foreground text-sm">
                                                {asset.name}
                                              </p>
                                              {asset.description && (
                                                <p className="text-muted-foreground text-xs">
                                                  {asset.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <p className="text-reconai-success font-mono text-sm">
                                            ${asset.value.toLocaleString()}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Liabilities Section */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Minus className="text-reconai-error h-5 w-5" />
                      <h3 className="text-foreground text-lg font-medium">
                        Liabilities
                      </h3>
                      <span className="text-reconai-error ml-auto font-mono text-sm">
                        ${totalLiabilities.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(liabilitiesByCategory).map(
                        ([category, items]) => (
                          <div
                            key={category}
                            className="overflow-hidden rounded-lg border border-white/5 bg-card/60"
                          >
                            <button
                              onClick={() =>
                                setExpandedLiabilityCategory(
                                  expandedLiabilityCategory === category
                                    ? null
                                    : category,
                                )
                              }
                              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-card/10"
                            >
                              <span className="text-foreground text-sm font-medium">
                                {getCategoryLabel(category)}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-reconai-error font-mono text-sm">
                                  ${getCategoryTotal(items).toLocaleString()}
                                </span>
                                <motion.div
                                  animate={{
                                    rotate:
                                      expandedLiabilityCategory === category
                                        ? 180
                                        : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                                </motion.div>
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedLiabilityCategory === category && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 px-4 pb-3">
                                    {items.map((liability, idx) => {
                                      const LiabilityIcon = liability.icon;
                                      return (
                                        <div
                                          key={idx}
                                          className="bg-background/50 flex items-center justify-between rounded-lg px-3 py-2"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="bg-reconai-error/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                              <LiabilityIcon className="text-reconai-error h-4 w-4" />
                                            </div>
                                            <div>
                                              <p className="text-foreground text-sm">
                                                {liability.name}
                                              </p>
                                              <div className="flex items-center gap-2">
                                                {liability.description && (
                                                  <p className="text-muted-foreground text-xs">
                                                    {liability.description}
                                                  </p>
                                                )}
                                                {liability.interestRate && (
                                                  <span className="bg-reconai-error/20 text-reconai-error rounded px-1.5 py-0.5 font-mono text-[10px]">
                                                    {liability.interestRate}%
                                                    APR
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <p className="text-reconai-error font-mono text-sm">
                                            ${liability.value.toLocaleString()}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-card/60 border-t border-white/5 p-4">
                  <p className="text-muted-foreground text-center text-xs">
                    Last updated:{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Insight Detail Modal */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
              onClick={() => setSelectedInsight(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="border-border max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border bg-card/70 shadow-2xl backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/5 p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        selectedInsight.type === "tip"
                          ? "bg-primary/10"
                          : selectedInsight.type === "warning"
                            ? "bg-reconai-warning/10"
                            : "bg-reconai-success/10"
                      }`}
                    >
                      {getInsightIcon(selectedInsight.type)}
                    </div>
                    <div>
                      <p className="text-primary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
                        {selectedInsight.type === "tip"
                          ? "AI Recommendation"
                          : selectedInsight.type === "warning"
                            ? "Alert"
                            : "Goal Tracking"}
                      </p>
                      <h2 className="text-foreground text-xl font-medium">
                        {selectedInsight.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="rounded-lg p-2 transition-colors hover:bg-card/10"
                  >
                    <X className="text-muted-foreground h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="max-h-[calc(85vh-180px)] overflow-y-auto p-6">
                  {/* Summary */}
                  <p className="text-foreground mb-6 leading-relaxed">
                    {selectedInsight.detailedInfo.summary}
                  </p>

                  {/* Stats Grid */}
                  {selectedInsight.detailedInfo.stats && (
                    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {selectedInsight.detailedInfo.stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/5 bg-card/60 p-4"
                        >
                          <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                            {stat.label}
                          </p>
                          <p className="text-foreground font-mono text-lg font-semibold">
                            {stat.value}
                          </p>
                          {stat.change !== undefined && stat.change !== 0 && (
                            <div
                              className={`mt-1 flex items-center gap-1 text-xs ${stat.change > 0 ? "text-reconai-error" : "text-reconai-success"}`}
                            >
                              {stat.change > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span>{Math.abs(stat.change)}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Progress Bar for Goals */}
                  {selectedInsight.detailedInfo.progress !== undefined && (
                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Progress
                        </span>
                        <span className="text-primary font-mono text-sm">
                          {selectedInsight.detailedInfo.progress}%
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-card/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${selectedInsight.detailedInfo.progress}%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-linear-to-r from-primary to-primary/60"
                        />
                      </div>
                      {selectedInsight.detailedInfo.currentAmount &&
                        selectedInsight.detailedInfo.targetAmount && (
                          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                            <span>
                              $
                              {selectedInsight.detailedInfo.currentAmount.toLocaleString()}{" "}
                              saved
                            </span>
                            <span>
                              $
                              {selectedInsight.detailedInfo.targetAmount.toLocaleString()}{" "}
                              goal
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Breakdown Section */}
                  {selectedInsight.detailedInfo.breakdown && (
                    <div className="mb-6">
                      <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
                        <Receipt className="text-primary h-4 w-4" />
                        Spending Breakdown
                      </h3>
                      <div className="space-y-2">
                        {selectedInsight.detailedInfo.breakdown.map(
                          (item, idx) => {
                            const ItemIcon = item.icon || Receipt;
                            const total =
                              selectedInsight.detailedInfo.breakdown!.reduce(
                                (sum, i) => sum + i.amount,
                                0,
                              );
                            const percentage = (
                              (item.amount / total) *
                              100
                            ).toFixed(0);
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-3 rounded-lg bg-card/60 p-3"
                              >
                                <div className="bg-background flex h-8 w-8 items-center justify-center rounded-lg">
                                  <ItemIcon className="text-primary h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="text-foreground text-sm">
                                      {item.item}
                                    </span>
                                    <span className="text-primary font-mono text-sm">
                                      ${item.amount}
                                    </span>
                                  </div>
                                  <div className="bg-background h-1.5 overflow-hidden rounded-full">
                                    <div
                                      className="bg-primary/20 h-full rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-muted-foreground w-10 text-right text-xs">
                                  {percentage}%
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {selectedInsight.detailedInfo.timeline && (
                    <div className="mb-6">
                      <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
                        <Clock className="text-primary h-4 w-4" />
                        Timeline
                      </h3>
                      <div className="space-y-0">
                        {selectedInsight.detailedInfo.timeline.map(
                          (event, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                    event.completed
                                      ? "bg-reconai-success/20"
                                      : "bg-card/60"
                                  }`}
                                >
                                  {event.completed ? (
                                    <CheckCircle2 className="text-reconai-success h-4 w-4" />
                                  ) : (
                                    <div className="bg-muted h-2 w-2 rounded-full" />
                                  )}
                                </div>
                                {idx <
                                  selectedInsight.detailedInfo.timeline!
                                    .length -
                                    1 && (
                                  <div
                                    className={`h-8 w-0.5 ${event.completed ? "bg-reconai-success/30" : "bg-card/20"}`}
                                  />
                                )}
                              </div>
                              <div className="pb-6">
                                <p className="text-muted-foreground text-xs">
                                  {event.date}
                                </p>
                                <p
                                  className={`text-sm ${event.completed ? "text-foreground" : "text-muted-foreground"}`}
                                >
                                  {event.event}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedInsight.detailedInfo.recommendations && (
                    <div className="mb-6">
                      <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
                        <Lightbulb className="text-primary h-4 w-4" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {selectedInsight.detailedInfo.recommendations.map(
                          (rec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 rounded-lg bg-card/60 p-3"
                            >
                              <ShieldCheck className="text-reconai-success mt-0.5 h-4 w-4 shrink-0" />
                              <span className="text-foreground text-sm">
                                {rec}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                {selectedInsight.detailedInfo.actionButton && (
                  <div className="bg-card/60 border-t border-white/5 p-4">
                    <Link
                      href={selectedInsight.detailedInfo.actionButton.href}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
                      onClick={() => setSelectedInsight(null)}
                    >
                      {selectedInsight.detailedInfo.actionButton.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
