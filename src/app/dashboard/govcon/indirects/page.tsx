"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Layers,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  Lock,
  TrendingUp,
  BarChart3,
  FileText,
} from "lucide-react";

type PoolType = "overhead" | "ga" | "fringe" | "material_handling" | "other";
type AllocationBase = "direct_labor_dollars" | "direct_labor_hours" | "total_cost_input" | "direct_material";
type RateStatus = "provisional" | "final" | "negotiated" | "audited";
type AllowabilityStatus = "allowable" | "unallowable" | "pending_review" | "partially_allowable";

interface IndirectPool {
  id: string;
  pool_type: PoolType;
  pool_name: string;
  description: string;
  allocation_base: AllocationBase;
  fiscal_year: number;
  total_costs: number;
  allowable_costs: number;
  unallowable_costs: number;
  base_amount: number;
  calculated_rate: number;
  negotiated_rate: number | null;
  rate_status: RateStatus;
}

interface IndirectCost {
  id: string;
  pool_id: string;
  cost_element: string;
  description: string;
  amount: number;
  allowability: AllowabilityStatus;
  far_reference: string;
  review_notes: string | null;
}

// Demo data
const DEMO_POOLS: IndirectPool[] = [
  {
    id: "pool-001",
    pool_type: "overhead",
    pool_name: "Engineering Overhead",
    description: "Indirect costs for engineering department",
    allocation_base: "direct_labor_dollars",
    fiscal_year: 2024,
    total_costs: 850000,
    allowable_costs: 820000,
    unallowable_costs: 30000,
    base_amount: 2500000,
    calculated_rate: 0.328,
    negotiated_rate: 0.32,
    rate_status: "negotiated",
  },
  {
    id: "pool-002",
    pool_type: "ga",
    pool_name: "General & Administrative",
    description: "Corporate administrative costs",
    allocation_base: "total_cost_input",
    fiscal_year: 2024,
    total_costs: 450000,
    allowable_costs: 425000,
    unallowable_costs: 25000,
    base_amount: 4500000,
    calculated_rate: 0.0944,
    negotiated_rate: null,
    rate_status: "provisional",
  },
  {
    id: "pool-003",
    pool_type: "fringe",
    pool_name: "Fringe Benefits",
    description: "Employee benefits including health, PTO, 401k",
    allocation_base: "direct_labor_dollars",
    fiscal_year: 2024,
    total_costs: 380000,
    allowable_costs: 375000,
    unallowable_costs: 5000,
    base_amount: 2500000,
    calculated_rate: 0.15,
    negotiated_rate: 0.15,
    rate_status: "final",
  },
];

const DEMO_COSTS: IndirectCost[] = [
  {
    id: "cost-001",
    pool_id: "pool-001",
    cost_element: "Rent",
    description: "Office space allocation for engineering",
    amount: 180000,
    allowability: "allowable",
    far_reference: "FAR 31.205-36",
    review_notes: null,
  },
  {
    id: "cost-002",
    pool_id: "pool-001",
    cost_element: "Utilities",
    description: "Electric, gas, water for engineering area",
    amount: 45000,
    allowability: "allowable",
    far_reference: "FAR 31.201-2",
    review_notes: null,
  },
  {
    id: "cost-003",
    pool_id: "pool-001",
    cost_element: "Entertainment",
    description: "Team building events",
    amount: 30000,
    allowability: "unallowable",
    far_reference: "FAR 31.205-14",
    review_notes: "Entertainment costs are unallowable per FAR",
  },
  {
    id: "cost-004",
    pool_id: "pool-002",
    cost_element: "Executive Compensation",
    description: "C-suite salaries",
    amount: 250000,
    allowability: "partially_allowable",
    far_reference: "FAR 31.205-6",
    review_notes: "Subject to compensation cap analysis",
  },
  {
    id: "cost-005",
    pool_id: "pool-003",
    cost_element: "Health Insurance",
    description: "Employee health plan premiums",
    amount: 220000,
    allowability: "allowable",
    far_reference: "FAR 31.205-6(m)",
    review_notes: null,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function getPoolTypeColor(type: PoolType): string {
  switch (type) {
    case "overhead":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "ga":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "fringe":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "material_handling":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getRateStatusColor(status: RateStatus): string {
  switch (status) {
    case "provisional":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "final":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "negotiated":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "audited":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getAllowabilityColor(status: AllowabilityStatus): string {
  switch (status) {
    case "allowable":
      return "bg-green-500/10 text-green-500";
    case "unallowable":
      return "bg-red-500/10 text-red-500";
    case "pending_review":
      return "bg-yellow-500/10 text-yellow-500";
    case "partially_allowable":
      return "bg-orange-500/10 text-orange-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
}

export default function IndirectsPage() {
  const [pools] = useState<IndirectPool[]>(DEMO_POOLS);
  const [costs] = useState<IndirectCost[]>(DEMO_COSTS);
  const [selectedPool, setSelectedPool] = useState<IndirectPool | null>(null);

  // Memoize summary totals
  const { totalIndirects, totalAllowable, totalUnallowable } = useMemo(() => ({
    totalIndirects: pools.reduce((sum, p) => sum + p.total_costs, 0),
    totalAllowable: pools.reduce((sum, p) => sum + p.allowable_costs, 0),
    totalUnallowable: pools.reduce((sum, p) => sum + p.unallowable_costs, 0),
  }), [pools]);

  // Memoize filtered costs
  const poolCosts = useMemo(() => {
    return selectedPool
      ? costs.filter((c) => c.pool_id === selectedPool.id)
      : costs;
  }, [costs, selectedPool]);

  // Memoize pool selection handler
  const handlePoolSelect = useCallback((pool: IndirectPool | null) => {
    setSelectedPool(pool);
  }, []);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Indirect Cost Pools
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            DCAA-compliant indirect rate management with allowability tracking per FAR 31.201
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
            Export Rates
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Calculator className="h-4 w-4" />
            Calculate Rates
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-500">FAR 31.201 Compliance</p>
          <p className="text-sm text-muted-foreground">
            All indirect costs are reviewed against FAR 31.201-2 through 31.205-52 for allowability determination.
            Rate changes require evidence and are logged to the audit trail.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Total Pools</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{pools.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Indirect Costs</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalIndirects)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Allowable</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-500">{formatCurrency(totalAllowable)}</p>
          <p className="text-xs text-muted-foreground">
            {((totalAllowable / totalIndirects) * 100).toFixed(1)}% of total
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Unallowable</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-red-500">{formatCurrency(totalUnallowable)}</p>
          <p className="text-xs text-muted-foreground">
            {((totalUnallowable / totalIndirects) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className={`rounded-xl border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors ${
              selectedPool?.id === pool.id ? "border-primary" : ""
            }`}
            onClick={() => handlePoolSelect(selectedPool?.id === pool.id ? null : pool)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getPoolTypeColor(pool.pool_type)}`}>
                    {pool.pool_type.toUpperCase().replace("_", " ")}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getRateStatusColor(pool.rate_status)}`}>
                    {pool.rate_status}
                  </span>
                </div>
                <h3 className="mt-2 font-medium">{pool.pool_name}</h3>
                <p className="text-sm text-muted-foreground">{pool.description}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Costs</p>
                <p className="font-medium">{formatCurrency(pool.total_costs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Allowable</p>
                <p className="font-medium text-green-500">{formatCurrency(pool.allowable_costs)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Calculated Rate</p>
                  <p className="text-lg font-semibold">{formatPercent(pool.calculated_rate)}</p>
                </div>
                {pool.negotiated_rate !== null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Negotiated Rate</p>
                    <p className="text-lg font-semibold text-primary">{formatPercent(pool.negotiated_rate)}</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Base: {pool.allocation_base.replace(/_/g, " ")} ({formatCurrency(pool.base_amount)})
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Detail Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-medium">
              {selectedPool ? `${selectedPool.pool_name} - Cost Elements` : "All Indirect Costs"}
            </h2>
            <p className="text-sm text-muted-foreground">
              FAR 31.201 allowability determination
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-accent transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cost Element
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Allowability
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  FAR Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {poolCosts.map((cost) => (
                <tr key={cost.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{cost.cost_element}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{cost.description}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(cost.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${getAllowabilityColor(cost.allowability)}`}>
                      {cost.allowability.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{cost.far_reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAR Reference Card */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-medium">FAR 31 Cost Principles Quick Reference</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">FAR 31.205-6</p>
            <p className="text-muted-foreground">Compensation for personal services (subject to reasonableness)</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">FAR 31.205-14</p>
            <p className="text-muted-foreground">Entertainment costs (generally unallowable)</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">FAR 31.205-36</p>
            <p className="text-muted-foreground">Rental costs (allowable if reasonable)</p>
          </div>
        </div>
      </div>
    </main>
  );
}
