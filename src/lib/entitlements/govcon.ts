export function hasGovConEntitlement(entitlements: unknown): boolean {
  // Wire this to your real entitlement model.
  // Canonical safe default: deny until explicitly granted.
  if (!entitlements || typeof entitlements !== "object") return false;

  const e = entitlements as Record<string, unknown>;
  return Boolean(e["govcon"] || e["contractor"] || e["tier"] === "GovCon");
}
