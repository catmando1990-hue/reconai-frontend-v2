// Phase 42 — Confidence meta display (no hardcoded colors)

import React from "react";
import { confidenceLabel, confidencePercent } from "@/lib/scoring";

export function ConfidenceMeta({ confidence }: { confidence: number }) {
  const pct = confidencePercent(confidence);
  const label = confidenceLabel(confidence);
  return (
    <span className="text-xs text-muted-foreground">
      Confidence: {pct}% • {label}
    </span>
  );
}
