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
    <div className="space-y-6 p-6">
      {/* Hero section with gradient/grid background */}
      <section className="relative overflow-hidden rounded-2xl border bg-background p-8">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-muted/40 via-background to-background" />
        <div className="absolute inset-0 -z-20 opacity-40 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </section>

      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
