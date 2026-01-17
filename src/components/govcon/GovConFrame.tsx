export default function GovConFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">GovCon Overview</h1>
        <p className="text-sm text-muted-foreground">
          Government contracting compliance and audit readiness overview.
        </p>
      </div>
      {children}
    </div>
  );
}
