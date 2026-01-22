"use client";

import * as React from "react";

type AuditEvidenceProps = {
  /** The request_id from the API response */
  requestId: string | null | undefined;
  /** Label shown above the ID (default: "Audit Reference") */
  label?: string;
  /** Variant for different contexts */
  variant?: "default" | "success" | "error";
  /** Optional className for container */
  className?: string;
};

/**
 * AuditEvidence — Displays audit provenance (request_id) for compliance.
 *
 * FAIL-CLOSED UX: Every mutating action MUST surface its request_id.
 * This component provides:
 * - Visible request_id for audit trail
 * - Copy button for evidence capture
 * - Consistent styling across success/error states
 *
 * Usage:
 * ```tsx
 * <AuditEvidence requestId={response.request_id} />
 * <AuditEvidence requestId={errorRequestId} variant="error" />
 * ```
 */
export function AuditEvidence({
  requestId,
  label = "Audit Reference",
  variant = "default",
  className = "",
}: AuditEvidenceProps) {
  const [copied, setCopied] = React.useState(false);

  // FAIL-CLOSED: If no requestId, render nothing but log warning
  if (!requestId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[AuditEvidence] Missing requestId - evidence not available");
    }
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers without clipboard API
      console.error("Failed to copy:", err);
    }
  };

  const variantStyles = {
    default: "border-border bg-muted",
    success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
  };

  return (
    <div
      className={`mt-2 rounded-md border p-2 text-xs ${variantStyles[variant]} ${className}`}
    >
      <div className="font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <code className="truncate font-mono text-[10px]">{requestId}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
          aria-label="Copy audit reference"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default AuditEvidence;
