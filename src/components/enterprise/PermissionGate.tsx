"use client";

import type { Permission, RbacSnapshot } from "@/lib/enterprise/rbac";

export function PermissionGate(props: {
  rbac: RbacSnapshot | null;
  requireAny?: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { rbac, requireAny, fallback, children } = props;
  if (!rbac) return <>{fallback ?? null}</>;
  if (!requireAny || requireAny.length === 0) return <>{children}</>;

  const ok = requireAny.some((p) => rbac.permissions.includes(p));
  if (!ok) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
