"use client";

import { useMemo } from "react";

import { apiFetch, type ApiFetchOptions } from "@/lib/api";
import { useOrg } from "@/lib/org-context";

export function useApi() {
  const { org_id } = useOrg();

  const api = useMemo(() => {
    return {
      apiFetch: <T = unknown,>(path: string, options: ApiFetchOptions = {}) => {
        const headers = new Headers(options.headers);

        if (org_id && !headers.has("x-organization-id")) {
          headers.set("x-organization-id", org_id);
        }

        return apiFetch<T>(path, {
          ...options,
          headers,
        });
      },
    };
  }, [org_id]);

  return api;
}
