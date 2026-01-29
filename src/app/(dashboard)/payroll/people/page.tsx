"use client";

import { useState, useMemo } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
} from "lucide-react";
import { usePayrollPeople } from "@/hooks/usePayroll";
import type { PersonStatus, PayrollPerson } from "@/lib/api/payroll-types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: PersonStatus) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
          Active
        </span>
      );
    case "inactive":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-600">
          Inactive
        </span>
      );
    case "on_leave":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
          On Leave
        </span>
      );
    case "terminated":
      return (
        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
          Terminated
        </span>
      );
    default:
      return null;
  }
}

function PayrollPeopleBody() {
  const { data, isLoading, isError } = usePayrollPeople(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "all">("all");

  const people: PayrollPerson[] = data?.items ?? [];

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesSearch =
        searchQuery === "" ||
        `${person.first_name} ${person.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.employee_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [people, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      active: people.filter((p) => p.status === "active").length,
      inactive: people.filter((p) => p.status === "inactive").length,
      on_leave: people.filter((p) => p.status === "on_leave").length,
      terminated: people.filter((p) => p.status === "terminated").length,
    };
  }, [people]);

  if (isLoading) {
    return (
      <RouteShell title="People" subtitle="Workforce directory">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RouteShell>
    );
  }

  if (isError) {
    return (
      <RouteShell title="People" subtitle="Workforce directory">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">Failed to load people</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </RouteShell>
    );
  }

  return (
    <RouteShell title="People" subtitle="Workforce directory">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PersonStatus | "all")
              }
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <PrimaryPanel
            title="Workforce Directory"
            subtitle={`${filteredPeople.length} of ${people.length} people`}
          >
            {people.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No workforce records"
                description="Employee and contractor records will appear here once they are added to the payroll system."
              />
            ) : filteredPeople.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No people match your search criteria</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {person.first_name} {person.last_name}
                        </span>
                        {getStatusBadge(person.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {person.employee_id}
                        {person.job_title && ` · ${person.job_title}`}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {person.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {person.email}
                          </span>
                        )}
                        {person.department && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {person.department}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Hired {formatDate(person.hire_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Directory Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Headcount
                </span>
                <span className="text-sm font-medium">{data?.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-medium text-green-600">
                  {statusCounts.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Leave</span>
                <span className="text-sm font-medium text-amber-600">
                  {statusCounts.on_leave}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <span className="text-sm font-medium text-gray-500">
                  {statusCounts.inactive}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Terminated
                </span>
                <span className="text-sm font-medium text-red-600">
                  {statusCounts.terminated}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Actions">
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Add Employee
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Add Contractor
              </button>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollPeoplePage() {
  return (
    <TierGate
      tier="payroll"
      title="People"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollPeopleBody />
    </TierGate>
  );
}
