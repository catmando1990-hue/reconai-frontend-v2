import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * PageHeader — Standardized header for dashboard routes.
 * Enterprise density: tighter spacing, consistent height.
 * Handles pages with/without subtitles gracefully.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex min-h-[var(--dash-header-height)] items-center justify-between gap-4 mb-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[length:var(--dash-title-size)] font-semibold tracking-tight text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[length:var(--dash-subtitle-size)] text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
