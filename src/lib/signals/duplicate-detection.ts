/**
 * Phase 3A: Signal & Anomaly Detection
 * Signal: Duplicate / Similar Charges
 *
 * Simple, explainable rule:
 * Same vendor + same amount within 48 hours = potential duplicate
 *
 * 48h window reduces false positives from monthly subscriptions
 * while still catching actual duplicates (double-charges, retries).
 *
 * No ML. No forecasting. Just pattern matching.
 */

import type { Transaction, DuplicateGroup, DuplicateSignal } from "./types";

const DUPLICATE_WINDOW_HOURS = 48;

/**
 * Mock transaction data for proof-of-concept.
 * In production, this would come from a read-only API.
 */
const MOCK_TRANSACTIONS: Transaction[] = [
  // Potential duplicate: same vendor, amount, within 24h (likely double-charge)
  {
    id: "txn_001",
    date: "2026-01-10T10:30:00Z",
    vendor: "Amazon Web Services",
    amount: 847.32,
    account: "Business Checking",
    category: "Cloud Services",
  },
  {
    id: "txn_002",
    date: "2026-01-10T14:15:00Z",
    vendor: "Amazon Web Services",
    amount: 847.32,
    account: "Business Checking",
    category: "Cloud Services",
  },
  // Normal subscription - NOT a duplicate (different months would be >48h apart)
  {
    id: "txn_003",
    date: "2026-01-05T09:00:00Z",
    vendor: "Slack Technologies",
    amount: 125.0,
    account: "Business Checking",
    category: "Software",
  },
  // Potential duplicate: same vendor, amount, within 36h
  {
    id: "txn_004",
    date: "2026-01-08T11:45:00Z",
    vendor: "Office Supplies Inc",
    amount: 234.56,
    account: "Business Checking",
    category: "Office Supplies",
  },
  {
    id: "txn_005",
    date: "2026-01-09T16:20:00Z",
    vendor: "Office Supplies Inc",
    amount: 234.56,
    account: "Business Checking",
    category: "Office Supplies",
  },
  // Normal single transaction
  {
    id: "txn_006",
    date: "2026-01-11T08:00:00Z",
    vendor: "Zoom Video",
    amount: 149.9,
    account: "Business Checking",
    category: "Software",
  },
];

function getHoursDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60));
}

function normalizeVendor(vendor: string): string {
  return vendor.toLowerCase().trim();
}

/**
 * Detect potential duplicate charges.
 * Rule: Same vendor + same amount within 48 hours.
 */
export function detectDuplicates(
  transactions: Transaction[] = MOCK_TRANSACTIONS,
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    if (processed.has(transactions[i].id)) continue;

    const current = transactions[i];
    const matches: Transaction[] = [current];

    for (let j = i + 1; j < transactions.length; j++) {
      if (processed.has(transactions[j].id)) continue;

      const candidate = transactions[j];
      const sameVendor =
        normalizeVendor(current.vendor) === normalizeVendor(candidate.vendor);
      const sameAmount = current.amount === candidate.amount;
      const withinWindow =
        getHoursDifference(current.date, candidate.date) <=
        DUPLICATE_WINDOW_HOURS;

      if (sameVendor && sameAmount && withinWindow) {
        matches.push(candidate);
        processed.add(candidate.id);
      }
    }

    if (matches.length > 1) {
      processed.add(current.id);
      const hoursBetween = getHoursDifference(
        matches[0].date,
        matches[matches.length - 1].date,
      );

      groups.push({
        id: `dup_${current.id}`,
        transactions: matches.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
        ruleExplanation: `${matches.length} charges of $${current.amount.toFixed(2)} to "${current.vendor}" within ${hoursBetween} hours.`,
      });
    }
  }

  return groups;
}

/**
 * Get the duplicate signal with all detected groups.
 */
export function getDuplicateSignal(): DuplicateSignal {
  const groups = detectDuplicates();
  return {
    type: "duplicate_charges",
    groups,
    dismissed: false,
  };
}
