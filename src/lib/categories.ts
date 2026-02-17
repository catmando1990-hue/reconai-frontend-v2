/**
 * Shared category constants and types for transaction categorization
 */

export const CATEGORY_OPTIONS = [
  "Software & SaaS",
  "Transportation",
  "Groceries",
  "Dining & Restaurants",
  "Utilities",
  "Office Supplies",
  "Professional Services",
  "Insurance",
  "Rent & Lease",
  "Travel",
  "Entertainment",
  "Marketing & Advertising",
  "Payroll",
  "Equipment",
  "Healthcare",
  "Education & Training",
  "Bank Fees",
  "Taxes",
  "Other",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number] | string;

export type CategorySource = "plaid" | "ai" | "user" | "rule";

export const CATEGORY_SOURCE_LABELS: Record<CategorySource, string> = {
  plaid: "Bank",
  ai: "AI Suggested",
  user: "Manual",
  rule: "Learned",
};

export const CATEGORY_SOURCE_ICONS: Record<CategorySource, string> = {
  plaid: "", // No icon for bank default
  ai: "sparkles", // Sparkle for AI
  user: "", // No icon for user-set
  rule: "bot", // Robot for learned rules
};
