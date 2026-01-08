"use client";

import type {
  EnterprisePolicySnapshot,
  FeatureFlagKey,
} from "@/lib/enterprise/types";

export function PolicyGate(props: {
  policy: EnterprisePolicySnapshot | null;
  requireAnyRole?: Array<"admin" | "enterprise_admin">;
  requireFlag?: FeatureFlagKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { policy, requireAnyRole, requireFlag, fallback, children } = props;

  if (!policy) return <>{fallback ?? null}</>;

  if (requireFlag && !policy.flags[requireFlag]) return <>{fallback ?? null}</>;

  if (requireAnyRole && requireAnyRole.length > 0) {
    const ok = requireAnyRole.some((r) => policy.roles.includes(r));
    if (!ok) return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}
