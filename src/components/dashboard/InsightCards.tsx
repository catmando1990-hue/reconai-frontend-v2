"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";

type Insights = {
  monthly_spend: string | number;
  top_category: string;
  recurring_count: string | number;
};

export default function InsightCards() {
  const { apiFetch } = useApi();
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    apiFetch<Insights>("/insights").then(setData);
  }, [apiFetch]);

  if (!data) return null;

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Monthly Spend</div>
        <div className="text-xl font-semibold">{data.monthly_spend}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Top Category</div>
        <div className="text-xl font-semibold">{data.top_category}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Recurring</div>
        <div className="text-xl font-semibold">{data.recurring_count}</div>
      </div>
    </div>
  );
}
