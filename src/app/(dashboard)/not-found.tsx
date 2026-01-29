import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard 404 page
 * Shows when a route within the dashboard is not found
 */
export default function DashboardNotFound() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-6 text-center max-w-md px-4">
        <div className="rounded-full bg-muted p-4">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/home">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
