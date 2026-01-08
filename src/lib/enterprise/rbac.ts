export type Role = "user" | "admin" | "enterprise_admin";

export type Permission =
  | "audit.read"
  | "policy.read"
  | "policy.write"
  | "evidence.read"
  | "retention.read"
  | "retention.write"
  | "export.request"
  | "support.create"
  | "status.read";

export type RbacSnapshot = {
  roles: Role[];
  permissions: Permission[];
  updatedAtISO: string;
};
