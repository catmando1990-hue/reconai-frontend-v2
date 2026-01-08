// Phase 42 — Severity badge (neutral styling, no hardcoded colors)

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/scoring";

const LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  // Neutral variant: communicates severity without color dependence.
  return <Badge variant="secondary">{LABEL[severity]}</Badge>;
}
