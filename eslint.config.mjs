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
  // Disable react-hooks/rules-of-hooks in test files
  {
    files: ["tests/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // MODULE ISOLATION: each dashboard module may only call its own /api/{module}/* endpoints.
  // Flags string literals or template parts like "/api/cfo/..." appearing in another module's tree.
  ...["core", "cfo", "payroll", "govcon", "invoicing"].map((module) => {
    const others = ["core", "cfo", "payroll", "govcon", "invoicing"].filter((m) => m !== module);
    const pattern = `^\\/api\\/(${others.join("|")})\\/`;
    return {
      files: [
        `src/app/(dashboard)/${module}/**/*.{js,jsx,ts,tsx}`,
        `src/components/${module}/**/*.{js,jsx,ts,tsx}`,
      ],
      // GovCon's audit panels are a sanctioned exception — see
      // src/components/govcon/audit/README.md for the rationale.
      ignores: module === "govcon" ? ["src/components/govcon/audit/**"] : [],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: `Literal[value=/${pattern}/]`,
            message: `Module isolation: ${module} code may only call /api/${module}/* endpoints.`,
          },
          {
            selector: `TemplateElement[value.cooked=/${pattern}/]`,
            message: `Module isolation: ${module} code may only call /api/${module}/* endpoints.`,
          },
        ],
      },
    };
  }),

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
