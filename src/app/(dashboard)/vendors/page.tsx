"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { apiFetch } from "@/lib/api";
import { Store } from "lucide-react";

type Vendor = {
  id: string;
  name: string;
  email?: string | null;
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Vendor[]>("/api/vendors");
        if (alive) setVendors(data);
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
    <RouteShell title="Vendors" subtitle="Manage your vendor relationships.">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 mb-4">
            <Store className="h-6 w-6 text-purple-400" />
          </div>
          <p className="text-muted-foreground text-sm">No vendors yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Vendors will appear here once added.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {vendors.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <Store className="h-4 w-4 text-purple-400" />
              <span className="text-foreground text-sm">{v.name}</span>
              {v.email && (
                <span className="text-muted-foreground text-xs ml-auto">
                  {v.email}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
