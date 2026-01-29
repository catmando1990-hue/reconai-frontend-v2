"use client";

import React, { useState } from "react";
import { SWRConfig } from "swr";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Global SWR configuration
const swrConfig = {
  shouldRetryOnError: false,
  errorRetryInterval: 10000,
  errorRetryCount: 1,
  dedupingInterval: 2000,
  revalidateOnFocus: false,
};

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig value={swrConfig}>{children}</SWRConfig>
    </QueryClientProvider>
  );
}
