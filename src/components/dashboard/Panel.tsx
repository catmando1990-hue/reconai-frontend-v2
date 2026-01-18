import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}

export function Panel({ title, children, className, right }: PanelProps) {
  return (
    <Card className={["surface-panel", className ?? ""].join(" ").trim()}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
