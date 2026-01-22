"use client";

import { useEffect } from "react";

/**
 * Global Error Boundary
 *
 * AUDIT COMPLIANCE:
 * - Catches errors at the root level
 * - Surfaces request_id when available in error
 * - Provides basic recovery UI
 *
 * Note: This component cannot use the layout, so it must include
 * its own html/body tags and basic styling.
 */

interface ErrorWithRequestId extends Error {
  request_id?: string;
  requestId?: string;
  status?: number;
}

export default function GlobalError({
  error,
  reset,
}: {
  error: ErrorWithRequestId & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  // Extract request_id from error if available
  const requestId = error.request_id || error.requestId;

  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Application Error
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                A critical error occurred. Please try again.
              </p>
            </div>

            <div className="rounded-md bg-gray-100 dark:bg-gray-700 p-3 text-sm">
              <p className="font-medium text-red-600 dark:text-red-400">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Audit Evidence: Surface request_id for compliance */}
            {requestId && (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2 text-xs">
                <div className="font-medium text-gray-600 dark:text-gray-400">
                  Error Reference
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <code className="truncate font-mono text-[10px] text-gray-800 dark:text-gray-200">
                    {requestId}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(requestId)}
                    className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
