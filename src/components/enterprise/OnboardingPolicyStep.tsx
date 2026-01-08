"use client";

import type { EnterprisePolicySnapshot } from "@/lib/enterprise/types";
import { PolicyGate } from "@/components/enterprise/PolicyGate";

export function OnboardingPolicyStep(props: {
  policy: EnterprisePolicySnapshot | null;
  onAcknowledge: () => void;
}) {
  const { policy, onAcknowledge } = props;

  return (
    <PolicyGate
      policy={policy}
      requireAnyRole={["enterprise_admin"]}
      requireFlag="policy_enforcement"
      fallback={null}
    >
      <section className="rounded border p-4">
        <h3 className="text-base font-semibold">
          Enterprise policy acknowledgement
        </h3>
        <p className="mt-1 text-sm opacity-80">
          This step is for enterprise administrators only. It does not change
          legal disclaimers or provide advice.
        </p>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={onAcknowledge}
          >
            Acknowledge
          </button>
        </div>
      </section>
    </PolicyGate>
  );
}
