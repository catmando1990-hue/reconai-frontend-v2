import api from "./client";

const BASE = "/api/vendors";

export function listVendors() {
  return api.get(`${BASE}/`);
}

export function getVendor(vendorId) {
  return api.get(`${BASE}/${vendorId}`);
}

export function createVendor(vendor) {
  return api.post(`${BASE}/`, vendor);
}

export function updateVendor(vendorId, updates) {
  return api.patch(`${BASE}/${vendorId}`, updates);
}

export function deleteVendor(vendorId) {
  return api.delete(`${BASE}/${vendorId}`);
}
