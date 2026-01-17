"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Lock,
  FileText,
  Eye,
  Hash,
  User,
  Calendar,
  ChevronDown,
} from "lucide-react";

// Pagination constants
const INITIAL_PAGE_SIZE = 25;
const LOAD_MORE_SIZE = 25;

type AuditEventType =
  | "contract_created"
  | "contract_modified"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "time_entry_modified"
  | "rate_calculated"
  | "reconciliation_run"
  | "variance_resolved"
  | "export_generated";

type AuditSeverity = "info" | "warning" | "error" | "critical";

interface AuditEntry {
  id: string;
  timestamp: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  description: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  changes: Record<string, unknown> | null;
  evidence_hash: string | null;
  entry_hash: string;
  dcaa_relevant: boolean;
}

// Demo data
const DEMO_ENTRIES: AuditEntry[] = [
  {
    id: "audit-001",
    timestamp: "2024-01-17T14:32:15Z",
    event_type: "timesheet_submitted",
    severity: "info",
    description: "Timesheet submitted for period 2024-01-15 to 2024-01-21",
    entity_type: "timesheet",
    entity_id: "ts-001",
    user_id: "user-001",
    user_name: "John Developer",
    user_role: "employee",
    changes: { status: { from: "draft", to: "submitted" } },
    evidence_hash: null,
    entry_hash: "a3f8d2e1b9c4",
    dcaa_relevant: true,
  },
  {
    id: "audit-002",
    timestamp: "2024-01-17T15:45:22Z",
    event_type: "timesheet_approved",
    severity: "info",
    description: "Timesheet approved by supervisor",
    entity_type: "timesheet",
    entity_id: "ts-001",
    user_id: "user-002",
    user_name: "Jane Manager",
    user_role: "supervisor",
    changes: { status: { from: "submitted", to: "approved" } },
    evidence_hash: "e7b2c1a9d5f3",
    entry_hash: "b4f9e3d2c1a5",
    dcaa_relevant: true,
  },
  {
    id: "audit-003",
    timestamp: "2024-01-17T16:12:08Z",
    event_type: "time_entry_modified",
    severity: "warning",
    description: "Time entry corrected: hours changed from 8.0 to 7.5",
    entity_type: "time_entry",
    entity_id: "te-002",
    user_id: "user-002",
    user_name: "Jane Manager",
    user_role: "supervisor",
    changes: { hours: { from: 8.0, to: 7.5 }, reason: "Correction per employee request" },
    evidence_hash: "f1a2b3c4d5e6",
    entry_hash: "c5a1b2d3e4f6",
    dcaa_relevant: true,
  },
  {
    id: "audit-004",
    timestamp: "2024-01-16T09:30:00Z",
    event_type: "contract_modified",
    severity: "info",
    description: "Contract modification: funding increased by $200,000",
    entity_type: "contract",
    entity_id: "c-001",
    user_id: "user-003",
    user_name: "Bob Contracts",
    user_role: "contracts_admin",
    changes: { funded_value: { from: 1600000, to: 1800000 }, modification_number: "P00003" },
    evidence_hash: "d4e5f6a7b8c9",
    entry_hash: "d6b2c3e4f5a7",
    dcaa_relevant: true,
  },
  {
    id: "audit-005",
    timestamp: "2024-01-15T11:00:00Z",
    event_type: "rate_calculated",
    severity: "info",
    description: "Overhead rate calculated for FY2024 Q4",
    entity_type: "indirect_pool",
    entity_id: "pool-001",
    user_id: "user-004",
    user_name: "Alice Finance",
    user_role: "finance_admin",
    changes: { calculated_rate: 0.328, base_amount: 2500000 },
    evidence_hash: null,
    entry_hash: "e7c3d4f5a6b8",
    dcaa_relevant: true,
  },
  {
    id: "audit-006",
    timestamp: "2024-01-15T14:20:00Z",
    event_type: "reconciliation_run",
    severity: "info",
    description: "Labor reconciliation run completed: 12 variances identified",
    entity_type: "reconciliation",
    entity_id: "rec-001",
    user_id: "system",
    user_name: "System",
    user_role: "system",
    changes: { variances_found: 12, total_items: 450 },
    evidence_hash: null,
    entry_hash: "f8d4e5a6b7c9",
    dcaa_relevant: true,
  },
  {
    id: "audit-007",
    timestamp: "2024-01-16T10:45:00Z",
    event_type: "variance_resolved",
    severity: "info",
    description: "Variance VAR-001 resolved: rounding adjustment within tolerance",
    entity_type: "variance",
    entity_id: "var-001",
    user_id: "user-001",
    user_name: "John Developer",
    user_role: "employee",
    changes: { status: { from: "identified", to: "resolved" }, resolution: "Within tolerance" },
    evidence_hash: "a1b2c3d4e5f6",
    entry_hash: "a9e5f6b7c8d1",
    dcaa_relevant: true,
  },
  {
    id: "audit-008",
    timestamp: "2024-01-17T08:00:00Z",
    event_type: "export_generated",
    severity: "info",
    description: "Audit log exported for DCAA review",
    entity_type: "audit_export",
    entity_id: "exp-001",
    user_id: "user-003",
    user_name: "Bob Contracts",
    user_role: "contracts_admin",
    changes: { entry_count: 150, export_format: "json" },
    evidence_hash: null,
    entry_hash: "b1c2d3e4f5a6",
    dcaa_relevant: true,
  },
];

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityColor(severity: AuditSeverity): string {
  switch (severity) {
    case "info":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "warning":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "error":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "critical":
      return "bg-red-600/10 text-red-600 border-red-600/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getEventTypeLabel(type: AuditEventType): string {
  const labels: Record<AuditEventType, string> = {
    contract_created: "Contract Created",
    contract_modified: "Contract Modified",
    timesheet_submitted: "Timesheet Submitted",
    timesheet_approved: "Timesheet Approved",
    time_entry_modified: "Time Entry Modified",
    rate_calculated: "Rate Calculated",
    reconciliation_run: "Reconciliation Run",
    variance_resolved: "Variance Resolved",
    export_generated: "Export Generated",
  };
  return labels[type] || type;
}

export default function AuditPage() {
  const [entries] = useState<AuditEntry[]>(DEMO_ENTRIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_PAGE_SIZE);

  // Memoize filtered entries to avoid recomputing on every render
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.entity_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = selectedSeverity === "all" || entry.severity === selectedSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [entries, searchQuery, selectedSeverity]);

  // Memoize grouped entries - only recompute when filtered entries change
  const entriesByDate = useMemo(() => {
    // Limit to displayCount for performance
    const limitedEntries = filteredEntries.slice(0, displayCount);
    return limitedEntries.reduce((acc, entry) => {
      const date = entry.timestamp.split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, AuditEntry[]>);
  }, [filteredEntries, displayCount]);

  const hasMore = displayCount < filteredEntries.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_SIZE, filteredEntries.length));
  }, [filteredEntries.length]);

  // Reset display count when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setDisplayCount(INITIAL_PAGE_SIZE);
  }, []);

  const handleSeverityChange = useCallback((value: AuditSeverity | "all") => {
    setSelectedSeverity(value);
    setDisplayCount(INITIAL_PAGE_SIZE);
  }, []);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Audit Trail
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable DCAA-compliant audit log with hash chain integrity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <CheckCircle className="h-4 w-4" />
            Verify Integrity
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export for DCAA
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-500">Immutable Audit Trail</p>
          <p className="text-sm text-muted-foreground">
            All audit entries are cryptographically linked via hash chain. Records cannot be modified or deleted.
            Retention policy: 6 years per FAR requirements. Evidence attached where required.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Total Entries</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">{entries.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">DCAA Relevant</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-500">
            {entries.filter((e) => e.dcaa_relevant).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="text-sm">With Evidence</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {entries.filter((e) => e.evidence_hash).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Warnings/Errors</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-yellow-500">
            {entries.filter((e) => e.severity === "warning" || e.severity === "error").length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search audit entries..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={selectedSeverity}
          onChange={(e) => handleSeverityChange(e.target.value as AuditSeverity | "all")}
          className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          More Filters
        </button>
      </div>

      {/* Audit Timeline */}
      <div className="space-y-6">
        {Object.entries(entriesByDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({dateEntries.length} entries)
                </span>
              </div>
              <div className="space-y-2">
                {dateEntries
                  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-xl border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors ${
                        selectedEntry?.id === entry.id ? "border-primary" : ""
                      }`}
                      onClick={() =>
                        setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(
                                  entry.severity
                                )}`}
                              >
                                {entry.severity}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getEventTypeLabel(entry.event_type)}
                              </span>
                              {entry.dcaa_relevant && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                  DCAA
                                </span>
                              )}
                              {entry.evidence_hash && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  Evidence
                                </span>
                              )}
                            </div>
                            <p className="mt-1">{entry.description}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.user_name} ({entry.user_role})
                              </span>
                              <span>
                                {entry.entity_type}: {entry.entity_id}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground mt-1">
                            {entry.entry_hash}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedEntry?.id === entry.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Changes</p>
                              <pre className="p-2 rounded-lg bg-muted/50 text-xs overflow-x-auto">
                                {JSON.stringify(entry.changes, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Hashes</p>
                              <div className="p-2 rounded-lg bg-muted/50 space-y-1">
                                <p className="text-xs">
                                  <span className="text-muted-foreground">Entry: </span>
                                  <span className="font-mono">{entry.entry_hash}</span>
                                </p>
                                {entry.evidence_hash && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">Evidence: </span>
                                    <span className="font-mono">{entry.evidence_hash}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            Load More ({filteredEntries.length - displayCount} remaining)
          </button>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No audit entries found</p>
        </div>
      )}

      {/* Integrity Status */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Audit Log Integrity Verified</p>
              <p className="text-sm text-muted-foreground">
                Hash chain verified • {entries.length} entries • Last verified: Just now
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Latest Entry Hash</p>
            <p className="font-mono text-sm">{entries[0]?.entry_hash || "N/A"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
