/**
 * Payroll Hooks
 *
 * React Query hooks for the Payroll API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditedFetch, auditedPost, auditedPatch } from "@/lib/auditedFetch";
import type {
  PayrollPerson,
  PersonCreateRequest,
  PersonUpdateRequest,
  Compensation,
  CompensationCreateRequest,
  TimeEntry,
  TimeEntryCreateRequest,
  TimeEntryUpdateRequest,
  PayRun,
  PayRunCreateRequest,
  PayRunLine,
  PayRunLineCreateRequest,
  TaxWithholding,
  TaxWithholdingCreateRequest,
  BenefitEnrollment,
  BenefitEnrollmentCreateRequest,
  JournalEntry,
  PayrollSnapshot,
  PayrollListResponse,
  PayrollItemResponse,
} from "@/lib/api/payroll-types";

const PAYROLL_BASE = "/api/payroll";

// =============================================================================
// PEOPLE HOOKS
// =============================================================================

export function usePayrollPeople(limit = 100) {
  return useQuery({
    queryKey: ["payroll", "people", limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<PayrollPerson>>(
        `${PAYROLL_BASE}/people?limit=${limit}`,
      ),
  });
}

export function usePayrollPerson(personId: string | undefined) {
  return useQuery({
    queryKey: ["payroll", "people", personId],
    queryFn: () =>
      auditedFetch<PayrollItemResponse<PayrollPerson>>(
        `${PAYROLL_BASE}/people/${personId}`,
      ),
    enabled: !!personId,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonCreateRequest) =>
      auditedPost<PayrollItemResponse<PayrollPerson>, PersonCreateRequest>(
        `${PAYROLL_BASE}/people`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "people"] });
    },
  });
}

export function useUpdatePerson(personId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonUpdateRequest) =>
      auditedPatch<PayrollItemResponse<PayrollPerson>, PersonUpdateRequest>(
        `${PAYROLL_BASE}/people/${personId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "people"] });
    },
  });
}

// =============================================================================
// COMPENSATION HOOKS
// =============================================================================

export function useCompensation(personId?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (personId) params.set("person_id", personId);

  return useQuery({
    queryKey: ["payroll", "compensation", personId, limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<Compensation>>(
        `${PAYROLL_BASE}/compensation?${params}`,
      ),
  });
}

export function useCreateCompensation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompensationCreateRequest) =>
      auditedPost<
        PayrollItemResponse<{ id: string }>,
        CompensationCreateRequest
      >(`${PAYROLL_BASE}/compensation`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "compensation"] });
    },
  });
}

// =============================================================================
// TIME ENTRY HOOKS
// =============================================================================

export function useTimeEntries(personId?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (personId) params.set("person_id", personId);

  return useQuery({
    queryKey: ["payroll", "time-entries", personId, limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<TimeEntry>>(
        `${PAYROLL_BASE}/time-entries?${params}`,
      ),
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TimeEntryCreateRequest) =>
      auditedPost<PayrollItemResponse<TimeEntry>, TimeEntryCreateRequest>(
        `${PAYROLL_BASE}/time-entries`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
    },
  });
}

export function useUpdateTimeEntry(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TimeEntryUpdateRequest) =>
      auditedPatch<PayrollItemResponse<TimeEntry>, TimeEntryUpdateRequest>(
        `${PAYROLL_BASE}/time-entries/${entryId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
    },
  });
}

// =============================================================================
// PAY RUN HOOKS
// =============================================================================

export function usePayRuns(limit = 50) {
  return useQuery({
    queryKey: ["payroll", "pay-runs", limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<PayRun>>(
        `${PAYROLL_BASE}/pay-runs?limit=${limit}`,
      ),
  });
}

export function usePayRun(runId: string | undefined) {
  return useQuery({
    queryKey: ["payroll", "pay-runs", runId],
    queryFn: () =>
      auditedFetch<PayrollItemResponse<PayRun>>(
        `${PAYROLL_BASE}/pay-runs/${runId}`,
      ),
    enabled: !!runId,
  });
}

export function usePayRunLines(runId: string | undefined) {
  return useQuery({
    queryKey: ["payroll", "pay-runs", runId, "lines"],
    queryFn: () =>
      auditedFetch<PayrollListResponse<PayRunLine>>(
        `${PAYROLL_BASE}/pay-runs/${runId}/lines`,
      ),
    enabled: !!runId,
  });
}

export function useCreatePayRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayRunCreateRequest) =>
      auditedPost<PayrollItemResponse<PayRun>, PayRunCreateRequest>(
        `${PAYROLL_BASE}/pay-runs`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "pay-runs"] });
    },
  });
}

export function useAddPayRunLine(runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayRunLineCreateRequest) =>
      auditedPost<
        PayrollItemResponse<{ id: string; pay_run_id: string }>,
        PayRunLineCreateRequest
      >(`${PAYROLL_BASE}/pay-runs/${runId}/lines`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "pay-runs", runId],
      });
    },
  });
}

export function useApprovePayRun(runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reasonCode?: string) =>
      auditedPost<PayrollItemResponse<PayRun>, { reason_code?: string }>(
        `${PAYROLL_BASE}/pay-runs/${runId}/approve`,
        { reason_code: reasonCode },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "pay-runs"] });
    },
  });
}

export function useLockPayRun(runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: {
      reason_code?: string;
      generate_snapshots?: boolean;
    }) =>
      auditedPost<
        PayrollItemResponse<PayRun> & { snapshot_ids: Record<string, string> },
        { reason_code?: string; generate_snapshots?: boolean }
      >(`${PAYROLL_BASE}/pay-runs/${runId}/lock`, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "pay-runs"] });
      queryClient.invalidateQueries({ queryKey: ["payroll", "snapshots"] });
    },
  });
}

// =============================================================================
// TAX WITHHOLDING HOOKS
// =============================================================================

export function useTaxWithholdings(personId?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (personId) params.set("person_id", personId);

  return useQuery({
    queryKey: ["payroll", "tax-withholdings", personId, limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<TaxWithholding>>(
        `${PAYROLL_BASE}/tax-withholdings?${params}`,
      ),
  });
}

export function useCreateTaxWithholding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaxWithholdingCreateRequest) =>
      auditedPost<
        PayrollItemResponse<{ id: string }>,
        TaxWithholdingCreateRequest
      >(`${PAYROLL_BASE}/tax-withholdings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "tax-withholdings"],
      });
    },
  });
}

// =============================================================================
// BENEFIT ENROLLMENT HOOKS
// =============================================================================

export function useBenefitEnrollments(personId?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (personId) params.set("person_id", personId);

  return useQuery({
    queryKey: ["payroll", "benefit-enrollments", personId, limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<BenefitEnrollment>>(
        `${PAYROLL_BASE}/benefit-enrollments?${params}`,
      ),
  });
}

export function useCreateBenefitEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BenefitEnrollmentCreateRequest) =>
      auditedPost<
        PayrollItemResponse<{ id: string }>,
        BenefitEnrollmentCreateRequest
      >(`${PAYROLL_BASE}/benefit-enrollments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payroll", "benefit-enrollments"],
      });
    },
  });
}

// =============================================================================
// JOURNAL ENTRY HOOKS
// =============================================================================

export function useJournalEntries(payRunId?: string, limit = 200) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (payRunId) params.set("pay_run_id", payRunId);

  return useQuery({
    queryKey: ["payroll", "journal-entries", payRunId, limit],
    queryFn: () =>
      auditedFetch<PayrollListResponse<JournalEntry>>(
        `${PAYROLL_BASE}/journal-entries?${params}`,
      ),
  });
}

// =============================================================================
// SNAPSHOT HOOKS
// =============================================================================

export function usePayrollSnapshots(options?: {
  snapshotType?: string;
  payRunId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.snapshotType) params.set("snapshot_type", options.snapshotType);
  if (options?.payRunId) params.set("pay_run_id", options.payRunId);
  if (options?.limit) params.set("limit", String(options.limit));

  return useQuery({
    queryKey: ["payroll", "snapshots", options],
    queryFn: () =>
      auditedFetch<PayrollListResponse<Omit<PayrollSnapshot, "data">>>(
        `${PAYROLL_BASE}/snapshots?${params}`,
      ),
  });
}

export function usePayrollSnapshot(snapshotId: string | undefined) {
  return useQuery({
    queryKey: ["payroll", "snapshots", snapshotId],
    queryFn: () =>
      auditedFetch<PayrollItemResponse<PayrollSnapshot>>(
        `${PAYROLL_BASE}/snapshots/${snapshotId}`,
      ),
    enabled: !!snapshotId,
  });
}

// =============================================================================
// AUDIT LOG HOOK
// =============================================================================

export function usePayrollAuditLog(options?: {
  entity?: string;
  entityId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.entity) params.set("entity", options.entity);
  if (options?.entityId) params.set("entity_id", options.entityId);
  if (options?.limit) params.set("limit", String(options.limit));

  return useQuery({
    queryKey: ["payroll", "audit-log", options],
    queryFn: () =>
      auditedFetch<PayrollListResponse<Record<string, unknown>>>(
        `${PAYROLL_BASE}/audit-log?${params}`,
      ),
  });
}

// =============================================================================
// COMPLIANCE CHECKS HOOK
// =============================================================================

export function useComplianceChecks(payRunId: string) {
  return useQuery({
    queryKey: ["payroll", "compliance-checks", payRunId],
    queryFn: () =>
      auditedFetch<PayrollListResponse<Record<string, unknown>>>(
        `${PAYROLL_BASE}/compliance-checks?pay_run_id=${payRunId}`,
      ),
    enabled: !!payRunId,
  });
}

// =============================================================================
// PAYROLL OVERVIEW HOOK (aggregated data for dashboard)
// =============================================================================

export function usePayrollOverview() {
  const people = usePayrollPeople(10);
  const payRuns = usePayRuns(5);
  const timeEntries = useTimeEntries(undefined, 20);

  const isLoading =
    people.isLoading || payRuns.isLoading || timeEntries.isLoading;
  const isError = people.isError || payRuns.isError || timeEntries.isError;

  const peopleItems: PayrollPerson[] = people.data?.items ?? [];
  const payRunItems: PayRun[] = payRuns.data?.items ?? [];
  const timeEntryItems: TimeEntry[] = timeEntries.data?.items ?? [];

  // Compute overview metrics
  const overview = {
    totalEmployees: people.data?.total ?? 0,
    activeEmployees: peopleItems.filter((p) => p.status === "active").length,
    recentPayRuns: payRunItems,
    pendingTimeEntries: timeEntryItems.filter((t) => t.status === "pending")
      .length,
    lastPayRun: payRunItems[0] ?? null,
  };

  return {
    data: overview,
    isLoading,
    isError,
    refetch: () => {
      people.refetch();
      payRuns.refetch();
      timeEntries.refetch();
    },
  };
}
