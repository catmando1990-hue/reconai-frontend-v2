// src/lib/access.ts
// Phase 36: Lightweight access helpers.
// Enterprise-first: explicit gating, deterministic behavior.

export type AccessTier = "core" | "intelligence" | "cfo";

const ROLE_ACCESS: Record<string, AccessTier[]> = {
  owner: ["core", "intelligence", "cfo"],
  admin: ["core", "intelligence", "cfo"],
  enterprise_admin: ["core", "intelligence", "cfo"],
  cfo: ["core", "cfo"],
  analyst: ["core", "intelligence"],
  member: ["core"],
};

function normalizeRole(role: string | null): string | null {
  if (!role) return null;

  const r = role.trim().toLowerCase();

  // Clerk org roles sometimes look like "org:admin" / "org:member"
  if (r.includes("enterprise_admin") || r.includes("enterprise-admin"))
    return "enterprise_admin";
  if (r.includes("owner")) return "owner";
  if (r.includes("admin")) return "admin";
  if (r.includes("analyst")) return "analyst";
  if (r.includes("cfo")) return "cfo";
  if (r.includes("member")) return "member";

  return r;
}

export function hasAccess(role: string | null, tier: AccessTier) {
  const normalized = normalizeRole(role);

  if (!normalized) return tier === "core"; // safe default
  const allowed = ROLE_ACCESS[normalized] ?? ["core"];
  return allowed.includes(tier);
}
