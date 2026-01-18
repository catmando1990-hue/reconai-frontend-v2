"use client";

import { useEffect } from "react";
import { X, FileText, AlertCircle, CheckCircle, Info } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";

type EvidenceItem = {
  type?: string;
  description?: string;
  source?: string;
  value?: string | number;
  [key: string]: unknown;
};

type EvidenceModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  confidence: number;
  evidence: unknown;
  resultId?: string;
};

/**
 * BUILD 21-23: Evidence Modal
 * Displays detailed evidence for AI intelligence results.
 * Supports various evidence formats and provides structured viewing.
 */
export function EvidenceModal({
  open,
  onClose,
  title,
  confidence,
  evidence,
  resultId,
}: EvidenceModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const confidencePercent = Math.round(confidence * 100);
  const evidenceItems = normalizeEvidence(evidence);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close evidence modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Evidence: {title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusChip variant={confidence >= 0.85 ? "ok" : "warn"}>
                {confidencePercent}% confidence
              </StatusChip>
              {resultId && <span className="text-xs">ID: {resultId}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {evidenceItems.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 p-4">
              <Info className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No structured evidence available for this result.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {evidenceItems.map((item, idx) => (
                <EvidenceItemCard key={idx} item={item} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <p>
            Evidence is provided for transparency. Results should be verified
            before taking action.
          </p>
        </div>
      </div>
    </div>
  );
}

function EvidenceItemCard({
  item,
  index,
}: {
  item: EvidenceItem;
  index: number;
}) {
  const icon = getEvidenceIcon(item.type);

  return (
    <div className="rounded-lg border border-border/70 bg-card/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Evidence #{index + 1}
            </span>
            {item.type && <StatusChip variant="muted">{item.type}</StatusChip>}
          </div>

          {item.description && <p className="text-sm">{item.description}</p>}

          {item.value !== undefined && (
            <p className="text-sm font-mono bg-muted/30 rounded px-2 py-1 inline-block">
              {String(item.value)}
            </p>
          )}

          {item.source && (
            <p className="text-xs text-muted-foreground">
              Source: {item.source}
            </p>
          )}

          {/* Render any additional fields */}
          {Object.entries(item)
            .filter(
              ([key]) =>
                !["type", "description", "source", "value"].includes(key),
            )
            .map(([key, value]) => (
              <p key={key} className="text-xs text-muted-foreground">
                {key}: {JSON.stringify(value)}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}

function normalizeEvidence(evidence: unknown): EvidenceItem[] {
  if (!evidence) return [];

  if (Array.isArray(evidence)) {
    return evidence.map((item) =>
      typeof item === "object" && item !== null
        ? (item as EvidenceItem)
        : { description: String(item) },
    );
  }

  if (typeof evidence === "object" && evidence !== null) {
    // If it's a single object, wrap it in an array
    return [evidence as EvidenceItem];
  }

  // If it's a primitive, wrap in description
  return [{ description: String(evidence) }];
}

function getEvidenceIcon(type?: string): React.ReactNode {
  switch (type?.toLowerCase()) {
    case "error":
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "success":
    case "match":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}
