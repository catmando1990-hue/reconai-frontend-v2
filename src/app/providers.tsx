"use client";

import React from "react";
import { SWRConfig } from "swr";

// Global SWR configuration to prevent rapid retries on API errors
const swrConfig = {
  // Don't automatically retry on error (prevents flooding API on 401)
  shouldRetryOnError: false,
  // If retry is enabled elsewhere, wait 10 seconds between attempts
  errorRetryInterval: 10000,
  // Only retry once if explicitly enabled
  errorRetryCount: 1,
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
  // Don't revalidate on focus (reduces unnecessary requests)
  revalidateOnFocus: false,
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
