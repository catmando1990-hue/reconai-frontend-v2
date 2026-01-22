"use client";

import { useEffect } from "react";
import { AuditEvidence } from "@/components/audit/AuditEvidence";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

/**
 * Dashboard Error Boundary
 *
 * AUDIT COMPLIANCE:
 * - Surfaces request_id from errors when available
 * - Renders AuditEvidence for provenance tracking
 * - Fail-closed: Shows error details, does not hide failures
 */

interface ErrorWithRequestId extends Error {
  request_id?: string;
  requestId?: string;
  status?: number;
}

export default function DashboardError({
  error,
  reset,
}: {
  error: ErrorWithRequestId & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging (could be sent to error tracking service)
    console.error("[Dashboard Error]", error);
  }, [error]);

  // Extract request_id from error if available (supports multiple property names)
  const requestId = error.request_id || error.requestId;

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium text-destructive">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Audit Evidence: Surface request_id for compliance tracking */}
          <AuditEvidence
            requestId={requestId}
            variant="error"
            label="Error Reference"
          />

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/home")}
              className="flex-1"
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
