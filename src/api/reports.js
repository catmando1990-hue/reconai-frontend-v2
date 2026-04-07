import api from './client';

const BASE = '/api/financial-reports';

/** GET /api/financial-reports/profit-loss */
export function getProfitLoss({ startDate, endDate }) {
  return api.get(`${BASE}/profit-loss`, {
    params: { start_date: startDate, end_date: endDate },
  });
}

/** GET /api/financial-reports/balance-sheet */
export function getBalanceSheet({ asOfDate }) {
  return api.get(`${BASE}/balance-sheet`, {
    params: { as_of_date: asOfDate },
  });
}

/** GET /api/financial-reports/cash-flow */
export function getCashFlow({ startDate, endDate }) {
  return api.get(`${BASE}/cash-flow`, {
    params: { start_date: startDate, end_date: endDate },
  });
}

/** GET /api/financial-reports/ratios */
export function getFinancialRatios({ asOfDate, periodStart }) {
  return api.get(`${BASE}/ratios`, {
    params: { as_of_date: asOfDate, period_start: periodStart },
  });
}

/** GET /api/financial-reports/trends/:metricName */
export function getTrend(metricName, { startDate, endDate, periodType = 'monthly' }) {
  return api.get(`${BASE}/trends/${metricName}`, {
    params: { start_date: startDate, end_date: endDate, period_type: periodType },
  });
}

/** GET /api/financial-reports/dashboard-summary */
export function getDashboardSummary() {
  return api.get(`${BASE}/dashboard-summary`);
}
