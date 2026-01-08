"use client";

import type { RbacSnapshot } from "@/lib/enterprise/rbac";
import { PermissionGate } from "@/components/enterprise/PermissionGate";

export function StatusSupportPanel(props: {
  rbac: RbacSnapshot | null;
  onSupportRequest: () => void;
}) {
  const { rbac, onSupportRequest } = props;

  return (
    <PermissionGate
      rbac={rbac}
      requireAny={["status.read", "support.create"]}
      fallback={null}
    >
      <section className="rounded border p-4">
        <h2 className="text-base font-semibold">Status & Support</h2>
        <p className="mt-1 text-sm opacity-80">
          Internal surfaces for enterprise readiness. No SLA guarantees are
          stated here.
        </p>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={onSupportRequest}
          >
            Create support request
          </button>
        </div>
      </section>
    </PermissionGate>
  );
}
