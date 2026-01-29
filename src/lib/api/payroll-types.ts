/**
 * Payroll API Types
 *
 * Types matching the backend Payroll API at /api/payroll/*
 */

// =============================================================================
// ENUMS
// =============================================================================

export type PersonStatus = "active" | "inactive" | "terminated" | "on_leave";
export type CompensationType = "salary" | "hourly" | "commission" | "bonus";
export type BenefitType =
  | "health"
  | "dental"
  | "vision"
  | "401k"
  | "hsa"
  | "fsa"
  | "life"
  | "disability"
  | "other";
export type PayRunStatus = "draft" | "approved" | "locked";
export type TimeEntryStatus = "pending" | "approved" | "rejected";

// =============================================================================
// PEOPLE
// =============================================================================

export interface PayrollPerson {
  id: string;
  organization_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string | null;
  job_title: string | null;
  hire_date: string;
  status: PersonStatus;
  created_at: string;
  updated_at: string;
}

export interface PersonCreateRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
  job_title?: string;
  hire_date: string;
  status?: PersonStatus;
}

export interface PersonUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  job_title?: string;
  status?: PersonStatus;
  reason_code?: string;
}

// =============================================================================
// COMPENSATION
// =============================================================================

export interface Compensation {
  id: string;
  organization_id: string;
  person_id: string;
  comp_type: CompensationType;
  rate: number;
  currency: string;
  effective_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompensationCreateRequest {
  person_id: string;
  comp_type: CompensationType;
  rate: number;
  currency?: string;
  effective_date: string;
  end_date?: string;
}

// =============================================================================
// TIME ENTRIES
// =============================================================================

export interface TimeEntry {
  id: string;
  organization_id: string;
  person_id: string;
  work_date: string;
  hours: number;
  cost_code: string | null;
  description: string | null;
  status: TimeEntryStatus;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryCreateRequest {
  person_id: string;
  work_date: string;
  hours: number;
  cost_code?: string;
  description?: string;
}

export interface TimeEntryUpdateRequest {
  hours?: number;
  cost_code?: string;
  description?: string;
  status?: TimeEntryStatus;
  reason_code?: string;
}

// =============================================================================
// PAY RUNS
// =============================================================================

export interface PayRun {
  id: string;
  organization_id: string;
  pay_period_start: string;
  pay_period_end: string;
  description: string | null;
  status: PayRunStatus;
  total_gross: number;
  total_tax: number;
  total_benefits: number;
  total_deductions: number;
  total_net: number;
  line_count: number;
  locked_at: string | null;
  snapshot_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayRunCreateRequest {
  pay_period_start: string;
  pay_period_end: string;
  description?: string;
}

export interface PayRunLine {
  id: string;
  organization_id: string;
  pay_run_id: string;
  person_id: string;
  gross_amount: number;
  tax_amount: number;
  benefits_amount: number;
  deductions_amount: number;
  net_amount: number;
  hours_worked: number | null;
  cost_code: string | null;
  created_at: string;
}

export interface PayRunLineCreateRequest {
  person_id: string;
  gross_amount: number;
  tax_amount: number;
  benefits_amount: number;
  deductions_amount: number;
  net_amount: number;
  hours_worked?: number;
  cost_code?: string;
}

// =============================================================================
// TAX WITHHOLDINGS
// =============================================================================

export interface TaxWithholding {
  id: string;
  organization_id: string;
  person_id: string;
  tax_type: string;
  rate: number;
  effective_date: string;
  filing_status: string | null;
  allowances: number | null;
  created_at: string;
}

export interface TaxWithholdingCreateRequest {
  person_id: string;
  tax_type: string;
  rate: number;
  effective_date: string;
  filing_status?: string;
  allowances?: number;
}

// =============================================================================
// BENEFITS
// =============================================================================

export interface BenefitEnrollment {
  id: string;
  organization_id: string;
  person_id: string;
  benefit_type: BenefitType;
  plan_name: string;
  employee_contribution: number;
  employer_contribution: number;
  effective_date: string;
  end_date: string | null;
  created_at: string;
}

export interface BenefitEnrollmentCreateRequest {
  person_id: string;
  benefit_type: BenefitType;
  plan_name: string;
  employee_contribution: number;
  employer_contribution: number;
  effective_date: string;
  end_date?: string;
}

// =============================================================================
// JOURNAL ENTRIES
// =============================================================================

export interface JournalEntry {
  id: string;
  organization_id: string;
  pay_run_id: string;
  account_code: string;
  debit: number;
  credit: number;
  description: string;
  cost_code: string | null;
  created_at: string;
}

// =============================================================================
// SNAPSHOTS
// =============================================================================

export interface PayrollSnapshot {
  id: string;
  organization_id: string;
  snapshot_type: string;
  pay_run_id: string;
  version: number;
  data_hash: string;
  data: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface PayrollListResponse<T> {
  status: "ok";
  items: T[];
  total: number;
  request_id: string;
}

export interface PayrollItemResponse<T> {
  status: "ok";
  data: T;
  request_id: string;
}
