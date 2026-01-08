"use client";

import type { RbacSnapshot } from "@/lib/enterprise/rbac";
import { PermissionGate } from "@/components/enterprise/PermissionGate";

export type ExportPackRequest = {
  rangeStartISO: string;
  rangeEndISO: string;
  include: Array<"audit" | "evidence" | "policy">;
};

export function ExportPackRequestPanel(props: {
  rbac: RbacSnapshot | null;
  onRequest: (req: ExportPackRequest) => void;
}) {
  const { rbac, onRequest } = props;

  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <PermissionGate rbac={rbac} requireAny={["export.request"]} fallback={null}>
      <section className="rounded border p-4">
        <h2 className="text-base font-semibold">Export pack</h2>
        <p className="mt-1 text-sm opacity-80">
          Requests an export pack for review. Generation occurs server-side.
          This does not provide advice.
        </p>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={() =>
              onRequest({
                rangeStartISO: start,
                rangeEndISO: end,
                include: ["audit", "evidence", "policy"],
              })
            }
          >
            Request export (last 7 days)
          </button>
        </div>
      </section>
    </PermissionGate>
  );
}
