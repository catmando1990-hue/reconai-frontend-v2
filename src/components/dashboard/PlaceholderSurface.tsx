"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * PlaceholderSurface — Staged feature placeholder.
 *
 * BACKGROUND NORMALIZATION:
 * - Uses bg-background (primary truth block)
 * - Borders over shadows
 * - No decorative colors
 */
export function PlaceholderSurface(props: {
  title: string;
  subtitle?: string;
  bullets?: string[];
}) {
  const { title, subtitle, bullets } = props;

  return (
    <Card className="border border-border bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        {bullets?.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            This surface is staged for the next release phase.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
