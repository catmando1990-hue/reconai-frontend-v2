import api from "./client";

const BASE = "/api/billing";

/** POST /api/billing/create-checkout-session — Stripe checkout */
export function createCheckoutSession({ tier, interval }) {
  return api.post(`${BASE}/create-checkout-session`, { tier, interval });
}

/** GET /api/billing/status — subscription status */
export function getBillingStatus() {
  return api.get(`${BASE}/status`);
}

/** GET /api/billing/invoices — Stripe invoice history */
export function getBillingInvoices() {
  return api.get(`${BASE}/invoices`);
}

/** POST /api/billing/cancel — schedule cancellation */
export function cancelSubscription() {
  return api.post(`${BASE}/cancel`);
}

/** POST /api/billing/downgrade — schedule downgrade */
export function downgradeSubscription({ tier }) {
  return api.post(`${BASE}/downgrade`, { tier });
}

/** GET /api/capabilities — tier features and limits */
export function getCapabilities() {
  return api.get("/api/capabilities");
}

/** GET /api/entitlements — current entitlements */
export function getEntitlements() {
  return api.get("/api/entitlements");
}
