"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Building2,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  Lock,
  ChevronDown,
} from "lucide-react";

// Pagination constants
const INITIAL_CONTRACT_COUNT = 10;
const LOAD_MORE_COUNT = 10;

// DCAA Contract Types
type ContractType =
  | "FFP"
  | "CPFF"
  | "CPIF"
  | "CPAF"
  | "T&M"
  | "LH"
  | "IDIQ"
  | "BPA";

type ContractStatus = "draft" | "active" | "completed" | "closed" | "terminated";

interface Contract {
  id: string;
  contract_number: string;
  contract_type: ContractType;
  status: ContractStatus;
  title: string;
  prime_contractor: string | null;
  contracting_officer: string;
  awarded_date: string;
  pop_start: string;
  pop_end: string;
  total_value: number;
  funded_value: number;
  clins: CLIN[];
}

interface CLIN {
  clin_number: string;
  description: string;
  clin_type: "FFP" | "CPFF" | "T&M" | "LH";
  total_value: number;
  funded_value: number;
  billed_to_date: number;
}

// Demo data
const DEMO_CONTRACTS: Contract[] = [
  {
    id: "c-001",
    contract_number: "FA8750-24-C-0001",
    contract_type: "CPFF",
    status: "active",
    title: "Advanced Analytics Platform Development",
    prime_contractor: null,
    contracting_officer: "John Smith",
    awarded_date: "2024-01-15",
    pop_start: "2024-02-01",
    pop_end: "2026-01-31",
    total_value: 2500000,
    funded_value: 1800000,
    clins: [
      {
        clin_number: "0001",
        description: "Software Development Labor",
        clin_type: "CPFF",
        total_value: 1500000,
        funded_value: 1200000,
        billed_to_date: 450000,
      },
      {
        clin_number: "0002",
        description: "Technical Support",
        clin_type: "T&M",
        total_value: 500000,
        funded_value: 400000,
        billed_to_date: 120000,
      },
      {
        clin_number: "0003",
        description: "Data Rights",
        clin_type: "FFP",
        total_value: 500000,
        funded_value: 200000,
        billed_to_date: 0,
      },
    ],
  },
  {
    id: "c-002",
    contract_number: "W911NF-23-C-0042",
    contract_type: "T&M",
    status: "active",
    title: "Cybersecurity Assessment Services",
    prime_contractor: "Acme Defense Corp",
    contracting_officer: "Jane Doe",
    awarded_date: "2023-06-01",
    pop_start: "2023-07-01",
    pop_end: "2024-12-31",
    total_value: 750000,
    funded_value: 600000,
    clins: [
      {
        clin_number: "0001",
        description: "Vulnerability Assessment",
        clin_type: "T&M",
        total_value: 400000,
        funded_value: 350000,
        billed_to_date: 280000,
      },
      {
        clin_number: "0002",
        description: "Penetration Testing",
        clin_type: "T&M",
        total_value: 350000,
        funded_value: 250000,
        billed_to_date: 95000,
      },
    ],
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

function getStatusColor(status: ContractStatus): string {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "draft":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "completed":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "closed":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "terminated":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getFundingStatus(funded: number, total: number): {
  label: string;
  color: string;
  icon: typeof CheckCircle;
} {
  const ratio = funded / total;
  if (ratio >= 0.9) {
    return { label: "Fully Funded", color: "text-green-500", icon: CheckCircle };
  } else if (ratio >= 0.5) {
    return { label: "Partially Funded", color: "text-yellow-500", icon: Clock };
  } else {
    return { label: "Low Funding", color: "text-red-500", icon: AlertTriangle };
  }
}

export default function ContractsPage() {
  const [contracts] = useState<Contract[]>(DEMO_CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(INITIAL_CONTRACT_COUNT);

  // Memoize filtered contracts
  const allFilteredContracts = useMemo(() => {
    return contracts.filter(
      (c) =>
        c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contracts, searchQuery]);

  // Paginated contracts for display
  const filteredContracts = useMemo(() => {
    return allFilteredContracts.slice(0, displayCount);
  }, [allFilteredContracts, displayCount]);

  const hasMore = displayCount < allFilteredContracts.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, allFilteredContracts.length));
  }, [allFilteredContracts.length]);

  // Reset pagination when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setDisplayCount(INITIAL_CONTRACT_COUNT);
  }, []);

  // Memoize summary stats
  const { totalValue, totalFunded, totalBilled } = useMemo(() => ({
    totalValue: contracts.reduce((sum, c) => sum + c.total_value, 0),
    totalFunded: contracts.reduce((sum, c) => sum + c.funded_value, 0),
    totalBilled: contracts.reduce(
      (sum, c) => sum + c.clins.reduce((s, clin) => s + clin.billed_to_date, 0),
      0
    ),
  }), [contracts]);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Contract Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            DCAA-compliant contract tracking with CLIN management and funding status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Contract
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-500">Advisory Mode</p>
          <p className="text-sm text-muted-foreground">
            All contract modifications require manual approval and evidence attachment per DCAA requirements.
            Changes are logged to an immutable audit trail.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Active Contracts</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {contracts.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Funded</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalFunded)}</p>
          <p className="text-xs text-muted-foreground">
            {((totalFunded / totalValue) * 100).toFixed(1)}% of total
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Billed to Date</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalBilled)}</p>
          <p className="text-xs text-muted-foreground">
            {((totalBilled / totalFunded) * 100).toFixed(1)}% of funded
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => {
          const fundingStatus = getFundingStatus(contract.funded_value, contract.total_value);
          const FundingIcon = fundingStatus.icon;

          return (
            <div
              key={contract.id}
              className="rounded-xl border bg-card overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedContract(contract)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {contract.contract_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        {contract.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                        {contract.contract_type}
                      </span>
                    </div>
                    <h3 className="mt-1 font-medium">{contract.title}</h3>
                    {contract.prime_contractor && (
                      <p className="text-sm text-muted-foreground">
                        Prime: {contract.prime_contractor}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="font-medium">{formatCurrency(contract.total_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Funded</p>
                    <p className="font-medium">{formatCurrency(contract.funded_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Period of Performance</p>
                    <p className="font-medium">
                      {contract.pop_start} to {contract.pop_end}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Funding Status</p>
                    <p className={`font-medium flex items-center gap-1 ${fundingStatus.color}`}>
                      <FundingIcon className="h-4 w-4" />
                      {fundingStatus.label}
                    </p>
                  </div>
                </div>

                {/* CLINs */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Contract Line Items (CLINs)</p>
                  <div className="grid gap-2">
                    {contract.clins.map((clin) => (
                      <div
                        key={clin.clin_number}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                            CLIN {clin.clin_number}
                          </span>
                          <span className="text-sm">{clin.description}</span>
                          <span className="text-xs text-muted-foreground">{clin.clin_type}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-muted-foreground text-xs">Funded</p>
                            <p>{formatCurrency(clin.funded_value)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground text-xs">Billed</p>
                            <p>{formatCurrency(clin.billed_to_date)}</p>
                          </div>
                          <div className="w-24">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(clin.billed_to_date / clin.funded_value) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              {((clin.billed_to_date / clin.funded_value) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              Load More ({allFilteredContracts.length - displayCount} remaining)
            </button>
          </div>
        )}
      </div>

      {allFilteredContracts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No contracts found</p>
        </div>
      )}
    </main>
  );
}
