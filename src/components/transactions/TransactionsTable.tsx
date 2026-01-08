"use client";

import { useApi } from "@/lib/useApi";
import { useEffect, useState } from "react";

type TransactionRow = {
  id: string | number;
  date?: string;
  description?: string;
  amount?: string | number;
  category?: string;
};

export default function TransactionsTable() {
  const { apiFetch } = useApi();
  const [rows, setRows] = useState<TransactionRow[]>([]);

  useEffect(() => {
    apiFetch<TransactionRow[]>("/transactions").then(setRows);
  }, [apiFetch]);

  return (
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b">
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b">
            <td>{r.date}</td>
            <td>{r.description}</td>
            <td>{r.amount}</td>
            <td>{r.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
