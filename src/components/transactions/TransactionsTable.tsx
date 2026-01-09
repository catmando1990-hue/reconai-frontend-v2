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
    <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-125 text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="whitespace-nowrap py-2 pr-4">Date</th>
            <th className="whitespace-nowrap py-2 pr-4">Description</th>
            <th className="whitespace-nowrap py-2 pr-4">Amount</th>
            <th className="whitespace-nowrap py-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="whitespace-nowrap py-2 pr-4">{r.date}</td>
              <td className="max-w-50 truncate py-2 pr-4">{r.description}</td>
              <td className="whitespace-nowrap py-2 pr-4">{r.amount}</td>
              <td className="py-2">{r.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
