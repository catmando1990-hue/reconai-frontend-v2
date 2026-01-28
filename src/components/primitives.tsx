"use client";
import { type ReactNode } from "react";
import { useTheme } from "./theme";

export function Card({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {children}
    </div>
  );
}

export function Tab({
  active,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  const { t } = useTheme();
  return (
    <button
      style={{
        color: active ? t.text : t.muted,
        position: "relative",
        paddingBottom: 12,
      }}
    >
      {children}
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: 2,
            background: t.indigo,
          }}
        />
      )}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  color?: "green" | "red" | "indigo";
}

export function StatCard({ label, value, trend, color }: StatCardProps) {
  const { t } = useTheme();
  const map: Record<string, string> = {
    green: t.green,
    red: t.red,
    indigo: t.indigo,
  };
  return (
    <Card>
      <div style={{ fontSize: 12, color: t.muted }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: t.text }}>
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: 12, color: map[color || "green"] }}>
          {trend}
        </div>
      )}
    </Card>
  );
}
