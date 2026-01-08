// src/components/dashboard/RouteShell.tsx
// Phase 35: Enterprise-safe route shell used by sidebar destinations.
// No hardcoded colors; relies on Tailwind semantic tokens.

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function RouteShell(props: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { title, subtitle, children, right } = props;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
