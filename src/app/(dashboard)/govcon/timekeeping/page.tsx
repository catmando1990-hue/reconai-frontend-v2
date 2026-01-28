"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Trash2,
  LogIn,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

interface Contract {
  id: string;
  contract_number: string;
  contract_name: string;
}

interface TimeEntry {
  id: string;
  contract_id: string;
  entry_date: string;
  hours: number;
  description: string | null;
  task_code: string | null;
  labor_category: string | null;
  status: string;
  govcon_contracts?: {
    contract_number: string;
    contract_name: string;
  };
}

interface TimeEntryFormData {
  contract_id: string;
  entry_date: string;
  hours: string;
  description: string;
  task_code: string;
  labor_category: string;
}

const EMPTY_FORM: TimeEntryFormData = {
  contract_id: "",
  entry_date: "",
  hours: "",
  description: "",
  task_code: "",
  labor_category: "",
};

const LABOR_CATEGORIES = [
  "Engineer I",
  "Engineer II",
  "Senior Engineer",
  "Project Manager",
  "Technical Lead",
  "Analyst",
  "Administrator",
];

/**
 * Get week boundaries (Sunday to Saturday)
 */
function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get days of the week
 */
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * GovCon Timekeeping Page
 *
 * DCAA-compliant labor tracking with weekly grid and time entry
 */
export default function TimekeepingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const { start } = getWeekBounds(new Date());
    return start;
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<TimeEntryFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => getWeekDays(currentWeekStart),
    [currentWeekStart],
  );
  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    try {
      const data = await auditedFetch<{ contracts: Contract[] }>(
        "/api/govcon/contracts",
        { skipBodyValidation: true },
      );
      setContracts(data.contracts || []);
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
    }
  }, []);

  // Fetch time entries for current week
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsAuthError(false);
    try {
      const startDate = formatDateISO(currentWeekStart);
      const endDate = formatDateISO(weekEnd);

      const data = await auditedFetch<{ entries: TimeEntry[] }>(
        `/api/govcon/timekeeping?start_date=${startDate}&end_date=${endDate}`,
        { skipBodyValidation: true },
      );
      setEntries(data.entries || []);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          // P1 FIX: Track auth errors to show sign-in button
          setIsAuthError(true);
          setError("Not authenticated. Please sign in.");
        } else {
          setError(`Failed to load time entries: ${err.status}`);
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load time entries",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, weekEnd]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const { start } = getWeekBounds(new Date());
    setCurrentWeekStart(start);
  };

  // Open modal for new entry
  const handleAddEntry = (date?: Date) => {
    setFormData({
      ...EMPTY_FORM,
      entry_date: date ? formatDateISO(date) : formatDateISO(new Date()),
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  // Submit time entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contract_id || !formData.entry_date || !formData.hours) {
      setFormError("Contract, date, and hours are required");
      return;
    }

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setFormError("Hours must be between 0 and 24");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await auditedFetch("/api/govcon/timekeeping", {
        method: "POST",
        body: JSON.stringify({
          contract_id: formData.contract_id,
          entry_date: formData.entry_date,
          hours,
          description: formData.description || null,
          task_code: formData.task_code || null,
          labor_category: formData.labor_category || null,
        }),
        skipBodyValidation: true,
      });

      handleCloseModal();
      await fetchEntries();
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setFormError(body?.error || `Error: ${err.status}`);
      } else {
        setFormError(
          err instanceof Error ? err.message : "Failed to save entry",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await auditedFetch(`/api/govcon/timekeeping?id=${deleteId}`, {
        method: "DELETE",
        skipBodyValidation: true,
      });
      setDeleteId(null);
      await fetchEntries();
    } catch (err) {
      // P2 FIX: Show user-visible error instead of silent console.error
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setDeleteError(body?.error || `Delete failed: ${err.status}`);
      } else {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete time entry",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  // Close delete modal and reset error
  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setDeleteError(null);
  };

  // Group entries by date and contract
  const entriesByDate = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {};
    for (const entry of entries) {
      const date = entry.entry_date;
      if (!map[date]) {
        map[date] = [];
      }
      map[date].push(entry);
    }
    return map;
  }, [entries]);

  // Calculate totals
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + e.hours, 0),
    [entries],
  );

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const day of weekDays) {
      const dateStr = formatDateISO(day);
      const dayEntries = entriesByDate[dateStr] || [];
      totals[dateStr] = dayEntries.reduce((sum, e) => sum + e.hours, 0);
    }
    return totals;
  }, [weekDays, entriesByDate]);

  // Format week range
  const weekRangeLabel = `${currentWeekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <RouteShell
      title="Timekeeping"
      subtitle="DCAA-compliant labor tracking with daily time entry"
    >
      <PolicyBanner
        policy="accounting"
        message="Time must be recorded daily with 15-minute increments. Corrections require evidence and supervisory approval."
        context="govcon"
      />

      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-6">
        {/* Header with week navigation */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly Timesheet</h2>
            <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">{weekRangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => handleAddEntry()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b7280] dark:text-[#a1a1aa]" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              {isAuthError && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/sign-in")}
                  className="ml-4"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && contracts.length === 0 && (
          <EmptyState
            icon={Clock}
            title="No contracts configured"
            description="Add contracts first to start tracking time."
          />
        )}

        {!loading && !error && contracts.length > 0 && (
          <>
            {/* Weekly Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] dark:border-[#27272a]">
                    <th className="pb-3 text-left font-medium w-24">Day</th>
                    <th className="pb-3 text-left font-medium">Entries</th>
                    <th className="pb-3 text-right font-medium w-20">Hours</th>
                    <th className="pb-3 text-right font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {weekDays.map((day) => {
                    const dateStr = formatDateISO(day);
                    const dayEntries = entriesByDate[dateStr] || [];
                    const isToday = formatDateISO(new Date()) === dateStr;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <tr
                        key={dateStr}
                        className={[
                          "border-b border-[#e5e7eb] dark:border-[#27272a]/50",
                          isToday ? "bg-primary/5" : "",
                          isWeekend ? "bg-[#f9fafb] dark:bg-[#27272a]/30" : "",
                        ].join(" ")}
                      >
                        <td className="py-3">
                          <div className="font-medium">
                            {day.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </div>
                          <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                            {day.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-3">
                          {dayEntries.length === 0 ? (
                            <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                              No entries
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {dayEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="font-mono">
                                    {entry.hours}h
                                  </span>
                                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">
                                    {entry.govcon_contracts?.contract_number ||
                                      "Unknown"}
                                  </span>
                                  {entry.description && (
                                    <span className="truncate max-w-50 text-[#6b7280] dark:text-[#a1a1aa]">
                                      - {entry.description}
                                    </span>
                                  )}
                                  <StatusChip
                                    variant={
                                      entry.status === "submitted"
                                        ? "ok"
                                        : "muted"
                                    }
                                  >
                                    {entry.status.toUpperCase()}
                                  </StatusChip>
                                  {entry.status === "draft" && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteId(entry.id)}
                                      className="p-0.5 rounded hover:bg-destructive/10 text-[#6b7280] dark:text-[#a1a1aa] hover:text-destructive transition-colors"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right tabular-nums font-medium">
                          {dailyTotals[dateStr] > 0
                            ? `${dailyTotals[dateStr]}h`
                            : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAddEntry(day)}
                            className="p-1.5 rounded hover:bg-[#f9fafb] dark:bg-[#27272a]/50 text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:text-[#f9fafb] transition-colors"
                            title="Add entry for this day"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#e5e7eb] dark:border-[#27272a]">
                    <td className="py-3 font-semibold">Total</td>
                    <td className="py-3 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                      {entries.length} entries
                    </td>
                    <td className="py-3 text-right tabular-nums font-semibold">
                      {totalHours}h
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#27272a]">
          <div className="flex gap-2">
            <Link
              href={ROUTES.GOVCON_CONTRACTS}
              className="text-xs text-primary hover:underline"
            >
              Manage contracts
            </Link>
            <span className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">•</span>
            <Link
              href={ROUTES.GOVCON_AUDIT}
              className="text-xs text-primary hover:underline"
            >
              Audit trail
            </Link>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] dark:border-[#27272a] p-4">
              <h2 className="text-base font-semibold">Add Time Entry</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Contract *
                </label>
                <select
                  value={formData.contract_id}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, contract_id: e.target.value }))
                  }
                  className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select contract...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contract_number} - {c.contract_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, entry_date: e.target.value }))
                    }
                    className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Hours * (15-min increments)
                  </label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, hours: e.target.value }))
                    }
                    className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                    placeholder="8"
                    min="0.25"
                    max="24"
                    step="0.25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Task Code
                  </label>
                  <input
                    type="text"
                    value={formData.task_code}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, task_code: e.target.value }))
                    }
                    className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                    placeholder="e.g., CLIN 0001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Labor Category
                  </label>
                  <select
                    value={formData.labor_category}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        labor_category: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    {LABOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded border border-[#e5e7eb] dark:border-[#27272a] bg-background px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Work performed..."
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-6 shadow-xl">
            <h3 className="font-semibold mb-2">Delete Time Entry?</h3>
            <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa] mb-4">
              This action cannot be undone.
            </p>
            {/* P2 FIX: Show delete error with retry ability */}
            {deleteError && (
              <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : deleteError ? (
                  "Retry"
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
