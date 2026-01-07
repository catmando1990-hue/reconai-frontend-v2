'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  PiggyBank,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  Target,
} from 'lucide-react';

/**
 * Phase 16:
 * - Quick Actions block near the top
 * - Light/dark auto-switch compatible (semantic tokens)
 * - Cross-links to How it works, Packages, Security
 */

// Types
interface StatCard {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'goal';
  title: string;
  description: string;
}

// Mock Data
const statCards: StatCard[] = [
  { label: 'Net Worth', value: '$124,580', trend: 8.2, trendLabel: 'vs last month', icon: Wallet },
  { label: 'Income', value: '$11,200', trend: 14.3, trendLabel: 'this month', icon: TrendingUp },
  { label: 'Expenses', value: '$6,800', trend: -5.2, trendLabel: 'vs last month', icon: Receipt },
  { label: 'Savings', value: '$4,400', trend: 12.8, trendLabel: 'this month', icon: PiggyBank },
];

const aiInsights: AIInsight[] = [
  {
    id: '1',
    type: 'tip',
    title: 'Savings Opportunity',
    description:
      'Your dining expenses are 23% higher than last month. Consider meal prepping to save ~$180/month.',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Upcoming Bill',
    description: 'Your car insurance payment of $245 is due in 3 days. Ensure sufficient balance.',
  },
  {
    id: '3',
    type: 'goal',
    title: 'Goal Progress',
    description:
      "You're 67% towards your emergency fund goal. At this rate, you'll reach it by March.",
  },
];

// Helpers
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'tip':
      return <Lightbulb className="text-primary h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="text-yellow-500 h-5 w-5" />;
    case 'goal':
      return <Target className="text-green-500 h-5 w-5" />;
  }
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
      ease: 'easeOut' as const,
    },
  },
};

export default function DashboardPage() {
  const { user } = useUser();
  const greeting = getGreeting();

  return (
    <div className="bg-background min-h-screen p-6 lg:p-8">
      <motion.div
        className="w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase mb-2">Dashboard</p>
          <h1 className="text-foreground text-3xl font-light">
            {greeting}
            {user?.firstName && <span className="text-primary">, {user.firstName}</span>}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your financial overview for{' '}
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Quick Actions (Phase 16) */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start here</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Your next best actions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build clarity in layers: Core → Intelligence → CFO Mode. Keep the narrative defensible.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/how-it-works" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent transition">
                  How it works
                </Link>
                <Link href="/packages" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent transition">
                  Packages
                </Link>
                <Link href="/security" className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent transition">
                  Security
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <Link
                href="/connect-bank"
                className="group rounded-2xl border border-border bg-background px-4 py-4 hover:bg-accent transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">Connect a bank</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <div className="mt-1 text-muted-foreground">Start ingesting data into Core.</div>
              </Link>

              <Link
                href="/transactions"
                className="group rounded-2xl border border-border bg-background px-4 py-4 hover:bg-accent transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">Review transactions</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <div className="mt-1 text-muted-foreground">Confirm classification & cleanup.</div>
              </Link>

              <Link
                href="/upload"
                className="group rounded-2xl border border-border bg-background px-4 py-4 hover:bg-accent transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">Upload statements</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <div className="mt-1 text-muted-foreground">Import CSV or PDF statements.</div>
              </Link>

              <Link
                href="/support"
                className="group rounded-2xl border border-border bg-background px-4 py-4 hover:bg-accent transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">Talk to ReconAI</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </div>
                <div className="mt-1 text-muted-foreground">Get guided setup or review.</div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend > 0;
            const isExpense = stat.label === 'Expenses';
            const trendColor = isExpense
              ? isPositive
                ? 'text-red-500'
                : 'text-green-500'
              : isPositive
                ? 'text-green-500'
                : 'text-red-500';

            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="group hover:border-primary/20 rounded-xl border border-border/5 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card/50">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <div className={`flex items-center gap-1 ${trendColor}`}>
                    {(isExpense ? !isPositive : isPositive) ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-mono text-sm">{Math.abs(stat.trend)}%</span>
                  </div>
                </div>
                <p className="text-primary mb-1 font-mono text-3xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-sm tracking-wider uppercase">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-border/5 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-border/5 p-5">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="text-primary h-4 w-4" />
                <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase">
                  AI Powered
                </p>
              </div>
              <h2 className="text-foreground text-lg">Smart Insights</h2>
            </div>
            <div className="divide-y divide-border/5">
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 hover:bg-card/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground mb-1 font-medium">{insight.title}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
