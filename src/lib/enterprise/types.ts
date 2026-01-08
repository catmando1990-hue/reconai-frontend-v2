export type FeatureFlagKey =
  | "enterprise_mode"
  | "policy_enforcement"
  | "white_label"
  | "evidence_mapping";

export type EnterprisePolicySnapshot = {
  // Contract-first: backend must conform
  flags: Record<FeatureFlagKey, boolean>;
  // Role claims are derived from auth provider; UI uses this for gating only.
  roles: Array<"user" | "admin" | "enterprise_admin">;
  updatedAtISO: string;
};
