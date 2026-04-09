import api from "./client";

const BASE = "/api/bills";

export function listBills({ status } = {}) {
  return api.get(`${BASE}/`, { params: { status } });
}

export function getBill(billId) {
  return api.get(`${BASE}/${billId}`);
}

export function createBill(bill) {
  return api.post(`${BASE}/`, bill);
}

export function updateBill(billId, updates) {
  return api.put(`${BASE}/${billId}`, updates);
}

export function deleteBill(billId) {
  return api.delete(`${BASE}/${billId}`);
}

export function recordBillPayment(billId, payment) {
  return api.post(`${BASE}/${billId}/payments`, payment);
}
