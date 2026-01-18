"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Send,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Lock,
  FileText,
  User,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";

type TimesheetStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "corrected";

interface TimeEntry {
  id: string;
  date: string;
  contract_id: string;
  contract_number: string;
  clin_number: string;
  labor_category: string;
  hours: number;
  description: string;
  billable: boolean;
}

interface Timesheet {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  total_hours: number;
  billable_hours: number;
  entries: TimeEntry[];
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

// Demo data
const CURRENT_WEEK_START = "2024-01-15";
const CURRENT_WEEK_END = "2024-01-21";

const DEMO_ENTRIES: TimeEntry[] = [
  {
    id: "te-001",
    date: "2024-01-15",
    contract_id: "c-001",
    contract_number: "FA8750-24-C-0001",
    clin_number: "0001",
    labor_category: "Senior Software Engineer",
    hours: 8,
    description: "API development and integration testing",
    billable: true,
  },
  {
    id: "te-002",
    date: "2024-01-16",
    contract_id: "c-001",
    contract_number: "FA8750-24-C-0001",
    clin_number: "0001",
    labor_category: "Senior Software Engineer",
    hours: 7.5,
    description: "Code review and documentation",
    billable: true,
  },
  {
    id: "te-003",
    date: "2024-01-16",
    contract_id: "c-002",
    contract_number: "W911NF-23-C-0042",
    clin_number: "0001",
    labor_category: "Security Analyst",
    hours: 0.5,
    description: "Security briefing attendance",
    billable: true,
  },
  {
    id: "te-004",
    date: "2024-01-17",
    contract_id: "c-001",
    contract_number: "FA8750-24-C-0001",
    clin_number: "0001",
    labor_category: "Senior Software Engineer",
    hours: 8,
    description: "Feature implementation - user authentication module",
    billable: true,
  },
  {
    id: "te-005",
    date: "2024-01-18",
    contract_id: "c-001",
    contract_number: "FA8750-24-C-0001",
    clin_number: "0002",
    labor_category: "Senior Software Engineer",
    hours: 4,
    description: "Technical support and troubleshooting",
    billable: true,
  },
  {
    id: "te-006",
    date: "2024-01-18",
    contract_id: "indirect",
    contract_number: "INDIRECT",
    clin_number: "G&A",
    labor_category: "Senior Software Engineer",
    hours: 4,
    description: "Company meeting and training",
    billable: false,
  },
  {
    id: "te-007",
    date: "2024-01-19",
    contract_id: "c-002",
    contract_number: "W911NF-23-C-0042",
    clin_number: "0001",
    labor_category: "Security Analyst",
    hours: 8,
    description: "Vulnerability assessment - Phase 2",
    billable: true,
  },
];

const DEMO_TIMESHEET: Timesheet = {
  id: "ts-001",
  employee_id: "emp-001",
  employee_name: "John Developer",
  period_start: CURRENT_WEEK_START,
  period_end: CURRENT_WEEK_END,
  status: "draft",
  total_hours: 40,
  billable_hours: 36,
  entries: DEMO_ENTRIES,
  submitted_at: null,
  approved_at: null,
  approved_by: null,
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getStatusColor(status: TimesheetStatus): string {
  switch (status) {
    case "draft":
      return "bg-muted text-foreground border-border";
    case "submitted":
      return "bg-primary/10 text-primary border-primary/20";
    case "approved":
      return "bg-primary/10 text-primary border-primary/20";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "corrected":
      return "bg-primary/10 text-primary border-primary/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function TimekeepingPage() {
  const [timesheet] = useState<Timesheet>(DEMO_TIMESHEET);
  const [selectedDate, setSelectedDate] = useState<string>(CURRENT_WEEK_START);

  // Memoize grouped entries by date
  const entriesByDate = useMemo(() => {
    return timesheet.entries.reduce(
      (acc, entry) => {
        if (!acc[entry.date]) {
          acc[entry.date] = [];
        }
        acc[entry.date].push(entry);
        return acc;
      },
      {} as Record<string, TimeEntry[]>,
    );
  }, [timesheet.entries]);

  // Memoize daily totals
  const dailyTotals = useMemo(() => {
    return Object.entries(entriesByDate).reduce(
      (acc, [date, entries]) => {
        acc[date] = entries.reduce((sum, e) => sum + e.hours, 0);
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [entriesByDate]);

  // Memoize grouped entries by contract for summary
  const entriesByContract = useMemo(() => {
    return timesheet.entries.reduce(
      (acc, entry) => {
        if (!acc[entry.contract_number]) {
          acc[entry.contract_number] = { hours: 0, entries: [] };
        }
        acc[entry.contract_number].hours += entry.hours;
        acc[entry.contract_number].entries.push(entry);
        return acc;
      },
      {} as Record<string, { hours: number; entries: TimeEntry[] }>,
    );
  }, [timesheet.entries]);

  // Memoize date selection handler
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  return (
    <RouteShell
      title="Timekeeping"
      subtitle="Daily labor tracking and approvals (manual-only)."
    >
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Timekeeping
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              DCAA-compliant labor tracking with daily time entry and approval
              workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="h-4 w-4" />
              Submit Timesheet
            </button>
          </div>
        </div>

        {/* Advisory Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <Lock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">
              DCAA Timekeeping Requirements
            </p>
            <p className="text-sm text-muted-foreground">
              Time must be recorded daily with 15-minute increments. Corrections
              require evidence and supervisory approval. All entries are logged
              to an immutable audit trail.
            </p>
          </div>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Previous Week
          </button>
          <div className="text-center">
            <p className="font-medium">
              {timesheet.period_start} to {timesheet.period_end}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(timesheet.status)}`}
              >
                {timesheet.status}
              </span>
              <span className="text-sm text-muted-foreground">
                {timesheet.total_hours} hours ({timesheet.billable_hours}{" "}
                billable)
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
            Next Week
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Total Hours</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {timesheet.total_hours}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Billable Hours</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {timesheet.billable_hours}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Contracts Charged</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {Object.keys(entriesByContract).length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Days Logged</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {Object.keys(entriesByDate).length}
            </p>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">Weekly Time Entry</h2>
          </div>
          <div className="grid grid-cols-7 divide-x">
            {DAYS_OF_WEEK.map((day, idx) => {
              const date = new Date(CURRENT_WEEK_START);
              date.setDate(date.getDate() + idx);
              const dateStr = date.toISOString().split("T")[0];
              const dayEntries = entriesByDate[dateStr] || [];
              const dayTotal = dailyTotals[dateStr] || 0;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleDateSelect(dateStr)}
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{day}</p>
                    <p className="text-sm font-medium">{date.getDate()}</p>
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`text-lg font-semibold ${dayTotal >= 8 ? "text-primary" : dayTotal > 0 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {dayTotal}h
                    </p>
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <div
                        key={entry.id}
                        className={`text-xs p-1 rounded truncate ${
                          entry.billable
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title={entry.description}
                      >
                        {entry.hours}h -{" "}
                        {entry.contract_number.split("-").pop()}
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayEntries.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contract Summary */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">Hours by Contract</h2>
          </div>
          <div className="divide-y">
            {Object.entries(entriesByContract).map(([contractNumber, data]) => (
              <div
                key={contractNumber}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-mono text-sm font-medium">
                    {contractNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.entries.length} entries across{" "}
                    {new Set(data.entries.map((e) => e.date)).size} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{data.hours}h</p>
                  <p className="text-xs text-muted-foreground">
                    {((data.hours / timesheet.total_hours) * 100).toFixed(0)}%
                    of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Entries Detail */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-medium">Entries for {selectedDate}</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-accent transition-colors">
              <Clock className="h-4 w-4" />
              Add Entry
            </button>
          </div>
          <div className="divide-y">
            {(entriesByDate[selectedDate] || []).map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {entry.contract_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        CLIN {entry.clin_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          entry.billable
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.billable ? "Billable" : "Non-Billable"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.labor_category}
                    </p>
                    <p className="mt-2">{entry.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{entry.hours}h</p>
                  </div>
                </div>
              </div>
            ))}
            {(!entriesByDate[selectedDate] ||
              entriesByDate[selectedDate].length === 0) && (
              <div className="p-8 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  No entries for this date
                </p>
                <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Add Time Entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Correction Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border border-border">
          <AlertTriangle className="h-5 w-5 text-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Timesheet Corrections
            </p>
            <p className="text-sm text-muted-foreground">
              After submission, any corrections require documented evidence and
              supervisory approval. Corrections must include confidence score ≥
              0.85 for AI-assisted changes. All modifications are permanently
              logged per DCAA requirements.
            </p>
          </div>
        </div>
      </main>{" "}
    </RouteShell>
  );
}
