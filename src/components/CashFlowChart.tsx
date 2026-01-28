"use client";
import { Card } from "./primitives";
import { useTheme } from "./theme";

export function CashFlowChart() {
  const { t } = useTheme();
  const income = [32000, 35000, 37000, 41000, 45000, 47230];
  const expenses = [24000, 26000, 28000, 29500, 31000, 31847];
  const w = 900,
    h = 260,
    p = 40,
    max = 50000;
  const x = (i: number) => p + (i * (w - p * 2)) / (income.length - 1);
  const y = (v: number) => h - p - (v / max) * (h - p * 2);
  const path = (a: number[]) =>
    a.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
  return (
    <Card>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        {[0, 1, 2, 3, 4].map((g) => (
          <line
            key={g}
            x1={p}
            x2={w - p}
            y1={(g * (h - p * 2)) / 4 + p}
            y2={(g * (h - p * 2)) / 4 + p}
            stroke={t.border}
          />
        ))}
        <path d={path(income)} stroke={t.green} fill="none" strokeWidth={3} />
        <path d={path(expenses)} stroke={t.red} fill="none" strokeWidth={3} />
      </svg>
    </Card>
  );
}
