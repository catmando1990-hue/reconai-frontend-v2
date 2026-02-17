/**
 * Domain-Specific Intelligence Types (Option B)
 *
 * Each domain (Core, CFO, Payroll, GovCon) has independent intelligence
 * with separate data contracts and UI composition.
 */

export type IntelligenceSeverity = "low" | "medium" | "high" | "critical";

export interface IntelligenceSignal {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-1, display only >= 0.85 by default
  severity: IntelligenceSeverity;
  category: string;
  created_at: string;
  evidence?: Record<string, unknown>;
  actionable: boolean;
  advisory_disclaimer?: string;
}

export interface IntelligenceResponse {
  lifecycle: "success" | "pending" | "failed" | "stale";
  reason_code?: string;
  reason_message?: string;
  generated_at: string;
  items: IntelligenceSignal[];
}

export interface UseIntelligenceResult {
  signals: IntelligenceSignal[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  showLowConfidence: boolean;
  setShowLowConfidence: (show: boolean) => void;
}

/**
 * Default confidence threshold for displaying signals.
 * Only signals with confidence >= this value are shown by default.
 */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.85;

/**
 * Get severity color class (token-based, no hardcoded colors)
 */
export function getSeverityColor(severity: IntelligenceSeverity): string {
  switch (severity) {
    case "critical":
      return "text-destructive";
    case "high":
      return "text-destructive";
    case "medium":
      return "text-chart-4"; // warning
    case "low":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get severity background class for badges
 */
export function getSeverityBgClass(severity: IntelligenceSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive";
    case "high":
      return "bg-destructive/10 text-destructive";
    case "medium":
      return "bg-chart-4/10 text-chart-4";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
