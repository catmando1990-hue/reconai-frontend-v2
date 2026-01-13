"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { apiFetch } from "@/lib/api";
import { Users } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Customer[]>("/api/customers");
        if (alive) setCustomers(data);
      } catch {
        // Silent: empty array on failure
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RouteShell
      title="Customers"
      subtitle="Manage your customer relationships."
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-4">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-muted-foreground text-sm">No customers yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Customers will appear here once added.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-foreground text-sm">{c.name}</span>
              {c.email && (
                <span className="text-muted-foreground text-xs ml-auto">
                  {c.email}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
