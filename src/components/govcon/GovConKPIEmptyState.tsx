export default function GovConKPIEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <p className="text-xs text-muted-foreground italic">
        No data available yet. This section will populate once GovCon data is
        configured. No actions are taken automatically.
      </p>
    </div>
  );
}
