import api from "./client";

const BASE = "/api/invoicing";

// ── Customers ──

export function listCustomers() {
  return api.get(`${BASE}/customers`);
}

export function getCustomer(customerId) {
  return api.get(`${BASE}/customers/${customerId}`);
}

export function createCustomer(customer) {
  return api.post(`${BASE}/customers`, customer);
}

export function updateCustomer(customerId, updates) {
  return api.put(`${BASE}/customers/${customerId}`, updates);
}

export function deleteCustomer(customerId) {
  return api.delete(`${BASE}/customers/${customerId}`);
}

// ── Invoices ──

export function listInvoices({ status, customerId } = {}) {
  return api.get(`${BASE}/invoices`, {
    params: { status, customer_id: customerId },
  });
}

export function getInvoice(invoiceId) {
  return api.get(`${BASE}/invoices/${invoiceId}`);
}

export function createInvoice(invoice) {
  return api.post(`${BASE}/invoices`, invoice);
}

export function updateInvoice(invoiceId, updates) {
  return api.put(`${BASE}/invoices/${invoiceId}`, updates);
}

export function sendInvoice(invoiceId) {
  return api.post(`${BASE}/invoices/${invoiceId}/send`);
}

export function cancelInvoice(invoiceId) {
  return api.post(`${BASE}/invoices/${invoiceId}/cancel`);
}

// ── Payments ──

export function listPayments() {
  return api.get(`${BASE}/payments`);
}

export function createPayment(payment) {
  return api.post(`${BASE}/payments`, payment);
}

// ── AR Aging ──

export function getArAging() {
  return api.get(`${BASE}/reports/ar-aging`);
}
