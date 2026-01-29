"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   V2 Design System Primitives

   These components are designed to run parallel to existing
   dashboard components. Import from @/components/dashboard-v2
═══════════════════════════════════════════════════════════════ */

/* ───────────────────────────────
   Card
─────────────────────────────── */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  const variants = {
    default: "bg-card border border-border shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
    elevated:
      "bg-card border border-border shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]",
    outlined: "bg-card border border-border",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-lg",
        variants[variant],
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────
   Stat Card
─────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = "neutral",
  icon,
  className,
}: StatCardProps) {
  const trendColors = {
    up: "text-[#059669]",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {trend && (
        <p className={cn("text-sm", trendColors[trendDirection])}>{trend}</p>
      )}
    </Card>
  );
}

/* ───────────────────────────────
   Tabs
─────────────────────────────── */

interface TabProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Tab({ active, children, onClick }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-1 pb-3 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

export function Tabs({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-6 border-b border-border", className)}>
      {children}
    </div>
  );
}

/* ───────────────────────────────
   Data Table
─────────────────────────────── */

interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  className,
}: DataTableProps<T>) {
  const getAlignment = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <Card padding="none" className={cn("overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn("px-4 py-3 font-medium", getAlignment(col.align))}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                rowIndex % 2 === 0 ? "bg-card" : "bg-muted/50",
                "hover:bg-accent transition-colors",
              )}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn("px-4 py-3", getAlignment(col.align))}
                >
                  {col.render
                    ? col.render(row, rowIndex)
                    : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ───────────────────────────────
   Button
─────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-card hover:bg-accent",
    ghost: "hover:bg-accent",
    danger: "bg-destructive text-white hover:bg-destructive/90",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-6 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────────
   Badge
─────────────────────────────── */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-[#059669]/10 text-[#059669]",
    warning: "bg-[#d97706]/10 text-[#d97706]",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-[#0d9488]/10 text-[#0d9488]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ───────────────────────────────
   Empty State
─────────────────────────────── */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ───────────────────────────────
   Page Header (standalone)
─────────────────────────────── */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
