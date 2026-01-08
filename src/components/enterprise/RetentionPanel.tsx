"use client";

import type { RbacSnapshot } from "@/lib/enterprise/rbac";
import { PermissionGate } from "@/components/enterprise/PermissionGate";

export type RetentionPolicyView = {
  days: number;
  scope: "audit" | "evidence" | "exports";
  updatedAtISO: string;
};

export function RetentionPanel(props: {
  rbac: RbacSnapshot | null;
  policy: RetentionPolicyView | null;
}) {
  const { rbac, policy } = props;
  return (
    <PermissionGate rbac={rbac} requireAny={["retention.read"]} fallback={null}>
      <section className="rounded border p-4">
        <h2 className="text-base font-semibold">Data retention</h2>
        <p className="mt-1 text-sm opacity-80">
          Read-only view. Changes require authorized administrators. No
          compliance claims are made here.
        </p>

        <div className="mt-4 rounded border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="opacity-80">Scope</span>
            <span className="opacity-80">{policy?.scope ?? "—"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="opacity-80">Retention</span>
            <span className="opacity-80">
              {typeof policy?.days === "number" ? `${policy.days} days` : "—"}
            </span>
          </div>
          <div className="mt-2 opacity-70">
            Updated: {policy?.updatedAtISO ?? "—"}
          </div>
        </div>
      </section>
    </PermissionGate>
  );
}
