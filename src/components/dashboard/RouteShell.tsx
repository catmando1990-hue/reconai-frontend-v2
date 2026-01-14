// src/components/dashboard/RouteShell.tsx
// Phase 35: Enterprise-safe route shell used by sidebar destinations.
// No hardcoded colors; relies on Tailwind semantic tokens.

import React from "react";

export function RouteShell(props: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { title, subtitle, children, right } = props;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero section with glassmorphism and gradient */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-6 md:p-8">
        {/* Gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 -z-20 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0V0zm39 0h1v1h-1V0zM0 39h1v1H0v-1zm39 0h1v1h-1v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </section>

      {/* Content area - children should contain their own cards */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
