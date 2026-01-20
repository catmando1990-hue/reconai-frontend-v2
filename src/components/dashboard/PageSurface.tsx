import { ReactNode } from "react";

interface PageSurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageSurface — Container surface for dashboard page content.
 * Uses surface-page token with enterprise-appropriate padding.
 */
export function PageSurface({ children, className }: PageSurfaceProps) {
  return (
    <div
      className={["surface-page rounded-lg p-4 lg:p-5", className ?? ""]
        .join(" ")
        .trim()}
    >
      {children}
    </div>
  );
}
