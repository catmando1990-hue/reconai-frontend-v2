// Phase 42 — Confidence & severity normalization utilities
// Enterprise-first: deterministic scoring helpers, no UI coupling.

export function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function confidencePercent(confidence: number) {
  return Math.round(clamp01(confidence) * 100);
}

export function confidenceLabel(confidence: number) {
  const p = confidencePercent(confidence);
  if (p >= 90) return "Very high";
  if (p >= 75) return "High";
  if (p >= 55) return "Medium";
  return "Low";
}

export type Severity = "low" | "medium" | "high";

export function severityFromConfidence(confidence: number): Severity {
  // Note: this is intentionally conservative.
  const p = confidencePercent(confidence);
  if (p >= 90) return "high";
  if (p >= 70) return "medium";
  return "low";
}
