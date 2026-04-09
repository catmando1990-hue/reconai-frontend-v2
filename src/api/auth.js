import api from "./client";

/** GET /api/me — current user context (user, org, permissions) */
export function getMe() {
  return api.get("/api/me");
}

/** GET /api/me/claims — debug JWT claims */
export function getMeClaims() {
  return api.get("/api/me/claims");
}
