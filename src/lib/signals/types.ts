/**
 * Phase 3A: Signal & Anomaly Detection
 * Signal: Duplicate / Similar Charges
 *
 * Types for the duplicate detection signal only.
 */

export interface Transaction {
  id: string;
  date: string; // ISO date string
  vendor: string;
  amount: number;
  account: string;
  category?: string;
}

export interface DuplicateGroup {
  id: string;
  transactions: Transaction[];
  ruleExplanation: string;
}

export interface DuplicateSignal {
  type: "duplicate_charges";
  groups: DuplicateGroup[];
  dismissed: boolean;
}
