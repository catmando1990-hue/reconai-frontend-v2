// src/lib/access.ts
// Phase 36: Lightweight access helpers.
// Enterprise-first: explicit gating, deterministic behavior.

export type AccessTier = "core" | "intelligence" | "cfo";

const ROLE_ACCESS: Record<string, AccessTier[]> = {
  owner: ["core", "intelligence", "cfo"],
  admin: ["core", "intelligence", "cfo"],
  cfo: ["core", "cfo"],
  analyst: ["core", "intelligence"],
  member: ["core"],
};

export function hasAccess(role: string | null, tier: AccessTier) {
  if (!role) return tier === "core"; // safe default
  const allowed = ROLE_ACCESS[role] ?? ["core"];
  return allowed.includes(tier);
}
