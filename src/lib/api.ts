/**
 * API Wrapper — DELEGATED TO auditedFetch
 *
 * NEUTRALIZED: All calls delegate to auditedFetch for provenance enforcement.
 * This file exists only for backward compatibility of imports.
 *
 * DO NOT add new functionality here. Use auditedFetch directly.
 */

export {
  auditedFetch,
  auditedFetch as apiFetch,
  auditedGet,
  auditedPost,
  auditedPut,
  auditedPatch,
  auditedDelete,
  AuditProvenanceError,
  HttpError,
  type AuditedFetchOptions,
  type AuditedFetchOptions as ApiFetchOptions,
} from "./auditedFetch";
