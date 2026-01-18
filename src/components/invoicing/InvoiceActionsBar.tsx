export function InvoiceActionsBar() {
  const disabled = true;
  const hint = "Enabled in Phase 3B (backend invoicing + audit logging).";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={disabled}
          title={hint}
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium opacity-60 cursor-not-allowed"
        >
          Download PDF
        </button>
        <button
          type="button"
          disabled={disabled}
          title={hint}
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium opacity-60 cursor-not-allowed"
        >
          Mark as Sent
        </button>
        <button
          type="button"
          disabled={disabled}
          title={hint}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-60 cursor-not-allowed"
        >
          Mark as Paid
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
