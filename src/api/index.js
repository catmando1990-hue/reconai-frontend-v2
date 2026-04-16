/**
 * ReconAI API — barrel export
 *
 * Usage:
 *   import { plaidApi, invoicingApi, reportsApi } from '../api';
 */

export { default as api, ApiError, setTokenAccessor } from './client';

export * as authApi from './auth';
export * as billingApi from './billing';
export * as billsApi from './bills';
export * as bookkeepingApi from './bookkeeping';
export * as cfoApi from './cfo';
export * as cfoConnectionsApi from './cfoConnections';
export * as govconApi from './govcon';
export * as govconConnectionsApi from './govconConnections';
export * as payrollConnectionsApi from './payrollConnections';
export * as intelligenceApi from './intelligence';
export * as invoicingApi from './invoicing';
export * as plaidApi from './plaid';
export * as reportsApi from './reports';
export * as taxApi from './tax';
export * as transactionsApi from './transactions';
export * as vendorsApi from './vendors';
