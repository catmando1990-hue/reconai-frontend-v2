"use client";

import TransactionsTable from "@/components/transactions/TransactionsTable";

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <TransactionsTable />
    </div>
  );
}
