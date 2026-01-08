// src/components/dashboard/SeverityBadge.tsx
// Phase 35: Severity badge using existing component styling (no hardcoded colors).
// Uses text semantics only; avoids custom color tokens to maintain light/dark safety.

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { InsightSeverity } from "@/lib/api/types";

const LABEL: Record<InsightSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  // Keep to neutral styling; severity emphasis is conveyed by label and placement.
  return <Badge variant="secondary">{LABEL[severity]}</Badge>;
}
