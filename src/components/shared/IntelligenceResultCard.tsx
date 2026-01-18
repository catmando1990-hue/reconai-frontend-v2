"use client";

import { useState } from "react";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { EvidenceModal } from "./EvidenceModal";
import { Eye, EyeOff, FileSearch } from "lucide-react";

type IntelligenceResultCardProps = {
  /** Unique identifier for the result */
  id: string;
  /** Title/heading for the card */
  title: string;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** AI explanation of the result */
  explanation: string;
  /** Optional subtitle or metadata */
  subtitle?: string;
  /** Evidence items for the modal */
  evidence?: unknown;
  /** Status chip variant override */
  statusVariant?: "ok" | "warn" | "muted";
  /** Confidence threshold for full display (default 0.85) */
  threshold?: number;
};

/**
 * BUILD 21-23: Intelligence Result Card
 * Displays AI intelligence results with confidence gating.
 * - If confidence >= threshold (0.85): Shows full explanation + evidence CTA
 * - If confidence < threshold: Shows withheld state with minimal info
 */
export function IntelligenceResultCard({
  id,
  title,
  confidence,
  explanation,
  subtitle,
  evidence,
  statusVariant,
  threshold = 0.85,
}: IntelligenceResultCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const meetsThreshold = confidence >= threshold;
  const confidencePercent = Math.round(confidence * 100);

  // Determine status variant based on confidence if not provided
  const computedVariant =
    statusVariant ??
    (confidence >= 0.9 ? "ok" : confidence >= 0.7 ? "warn" : "muted");

  if (!meetsThreshold) {
    // Withheld state: confidence below threshold
    return (
      <div className="rounded-xl border border-border/50 bg-background/20 p-3 opacity-60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <StatusChip variant="muted">{confidencePercent}%</StatusChip>
        </div>
        <p className="mt-2 text-xs text-muted-foreground italic">
          Result withheld: confidence ({confidencePercent}%) below threshold (
          {Math.round(threshold * 100)}%).
        </p>
      </div>
    );
  }

  // Full display: confidence meets threshold
  return (
    <>
      <div className="rounded-xl border border-border/70 bg-background/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary/70" />
            <div className="text-sm font-medium">{title}</div>
          </div>
          <StatusChip variant={computedVariant}>
            {confidencePercent}%
          </StatusChip>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{explanation}</p>

        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}

        {/* Evidence CTA */}
        {evidence != null && (
          <button
            type="button"
            onClick={() => setEvidenceOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
          >
            <FileSearch className="h-3.5 w-3.5" />
            View Evidence
          </button>
        )}
      </div>

      {evidence != null && (
        <EvidenceModal
          open={evidenceOpen}
          onClose={() => setEvidenceOpen(false)}
          title={title}
          confidence={confidence}
          evidence={evidence}
          resultId={id}
        />
      )}
    </>
  );
}
