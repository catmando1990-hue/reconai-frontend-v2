type Status = "draft" | "sent" | "paid" | "overdue";

function cls(status: Status) {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground border-border";
    case "sent":
      return "bg-primary/10 text-primary border-primary/20";
    case "paid":
      return "bg-primary/10 text-primary border-primary/20";
    case "overdue":
      return "bg-destructive/10 text-destructive border-destructive/20";
  }
}

export function InvoiceStatusPill({ status }: { status: Status }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        cls(status),
      ].join(" ")}
    >
      {status.toUpperCase()}
    </span>
  );
}
