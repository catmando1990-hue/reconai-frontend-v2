import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // AUDIT COMPLIANCE: Ban direct fetch() usage
  // All API calls MUST use auditedFetch for request_id provenance enforcement
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      // Allow fetch inside auditedFetch.ts (it's the canonical wrapper)
      "src/lib/auditedFetch.ts",
      // Allow fetch in middleware (server-side, pre-auth)
      "src/middleware.ts",
      // Allow fetch in API routes (server-to-server calls)
      "src/app/api/**/*.ts",
      // Allow fetch in server-side layouts (use Bearer token auth pattern)
      "src/app/**/layout.tsx",
      // Allow fetch in admin diagnostics (health checks measure latency, external endpoints)
      "src/app/admin/settings/page.tsx",
      // Allow fetch in diagnostics section (health checks measure latency, external endpoints)
      "src/components/settings/DiagnosticsSection.tsx",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Direct fetch() is banned. Use auditedFetch from @/lib/auditedFetch for provenance enforcement.",
        },
      ],
    },
  },
]);

export default eslintConfig;
