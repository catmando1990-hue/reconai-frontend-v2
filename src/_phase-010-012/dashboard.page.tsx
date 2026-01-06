"use client";

import InsightCards from "@/components/dashboard/InsightCards";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <InsightCards />
    </div>
  );
}
