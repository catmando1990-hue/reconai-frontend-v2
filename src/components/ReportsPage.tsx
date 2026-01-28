"use client";
import { StatCard, Tab } from "./primitives";
import { CashFlowChart } from "./CashFlowChart";

export default function ReportsPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Reports</h1>
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <Tab>Transaction Ledger</Tab>
        <Tab active>Cash Flow</Tab>
        <Tab>Category Spend</Tab>
        <Tab>Audit Trail</Tab>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginTop: 24,
        }}
      >
        <StatCard
          label="Total Income"
          value="$47,230.00"
          trend="+12%"
          color="green"
        />
        <StatCard label="Total Expenses" value="$31,847.00" color="red" />
        <StatCard label="Net Position" value="$15,383.00" color="indigo" />
      </div>

      <div style={{ marginTop: 24 }}>
        <CashFlowChart />
      </div>
    </div>
  );
}
