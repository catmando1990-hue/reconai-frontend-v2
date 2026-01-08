"use client";

import type { EnterprisePolicySnapshot } from "@/lib/enterprise/types";
import { PolicyGate } from "@/components/enterprise/PolicyGate";

export function EnterpriseAdminPanel(props: {
  policy: EnterprisePolicySnapshot | null;
}) {
  const { policy } = props;

  return (
    <PolicyGate
      policy={policy}
      requireAnyRole={["admin", "enterprise_admin"]}
      requireFlag="enterprise_mode"
      fallback={null}
    >
      <section className="rounded border p-4">
        <h2 className="text-base font-semibold">Enterprise Admin</h2>
        <p className="mt-1 text-sm opacity-80">
          Internal controls only. Nothing here is customer-facing unless
          explicitly enabled and approved.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <div className="rounded border p-3">
            <div className="font-medium">Policy Snapshot</div>
            <div className="mt-1 opacity-70">
              Updated: {policy?.updatedAtISO ?? "—"}
            </div>
          </div>

          <div className="rounded border p-3">
            <div className="font-medium">Flags</div>
            <div className="mt-2 grid gap-2">
              {Object.entries(policy?.flags ?? {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="opacity-80">{k}</span>
                  <span className="opacity-80">
                    {v ? "enabled" : "disabled"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PolicyGate>
  );
}
