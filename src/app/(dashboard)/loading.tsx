import { Loader2 } from "lucide-react";

/**
 * Dashboard-wide loading state
 * Shows while route transitions are in progress
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
