"use client";

import { useMemo } from "react";

import {
  auditedFetch,
  auditedGet,
  auditedPost,
  auditedPut,
  auditedPatch,
  auditedDelete,
  type AuditedFetchOptions,
} from "@/lib/auditedFetch";
import { useOrg } from "@/lib/org-context";

// Re-export for backward compatibility
export type { AuditedFetchOptions as ApiFetchOptions } from "@/lib/auditedFetch";

export function useApi() {
  const { org_id } = useOrg();

  const api = useMemo(() => {
    const withOrgHeader = (
      options: AuditedFetchOptions = {},
    ): AuditedFetchOptions => {
      const headers = new Headers(options.headers);
      if (org_id && !headers.has("x-organization-id")) {
        headers.set("x-organization-id", org_id);
      }
      return { ...options, headers };
    };

    return {
      // Legacy alias
      apiFetch: <T = unknown,>(
        path: string,
        options: AuditedFetchOptions = {},
      ) => {
        return auditedFetch<T>(path, withOrgHeader(options));
      },

      // Canonical methods
      auditedFetch: <T = unknown,>(
        path: string,
        options: AuditedFetchOptions = {},
      ) => {
        return auditedFetch<T>(path, withOrgHeader(options));
      },

      auditedGet: <T = unknown,>(
        path: string,
        options?: Omit<AuditedFetchOptions, "method">,
      ) => {
        return auditedGet<T>(path, withOrgHeader(options));
      },

      auditedPost: <T = unknown, B = unknown>(
        path: string,
        body: B,
        options?: Omit<AuditedFetchOptions, "method" | "body">,
      ) => {
        return auditedPost<T, B>(path, body, withOrgHeader(options));
      },

      auditedPut: <T = unknown, B = unknown>(
        path: string,
        body: B,
        options?: Omit<AuditedFetchOptions, "method" | "body">,
      ) => {
        return auditedPut<T, B>(path, body, withOrgHeader(options));
      },

      auditedPatch: <T = unknown, B = unknown>(
        path: string,
        body: B,
        options?: Omit<AuditedFetchOptions, "method" | "body">,
      ) => {
        return auditedPatch<T, B>(path, body, withOrgHeader(options));
      },

      auditedDelete: <T = unknown,>(
        path: string,
        options?: Omit<AuditedFetchOptions, "method">,
      ) => {
        return auditedDelete<T>(path, withOrgHeader(options));
      },
    };
  }, [org_id]);

  return api;
}
