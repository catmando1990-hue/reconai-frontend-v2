#!/usr/bin/env npx ts-node
/**
 * ============================================================================
 * PHASE 6: TRUST ENFORCEMENT BUILD CHECK
 * ============================================================================
 *
 * This script runs at build time to catch trust violations BEFORE deployment.
 *
 * FAIL CONDITIONS:
 * 1. Deprecated routes registered (v1 Plaid endpoints)
 * 2. Mock/demo data referenced without labels
 * 3. Status contracts bypassed (hardcoded "healthy", "live", etc.)
 * 4. "Live / Synced" strings without backend proof
 * 5. Zero fallbacks that hide missing data
 *
 * EXIT CODES:
 * 0 = All checks passed
 * 1 = Trust violations found
 *
 * ============================================================================
 */

import * as fs from "fs";
import * as path from "path";

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
  severity: "error" | "warning";
}

const violations: Violation[] = [];

// Directories to scan
const SRC_DIR = path.join(__dirname, "..", "src");

// Patterns that indicate trust violations
const TRUST_VIOLATION_PATTERNS = [
  // Hardcoded positive status (without backend proof)
  {
    pattern: /status\s*[=:]\s*["'](?:healthy|ok|connected|live|synced)["']/gi,
    rule: "HARDCODED_POSITIVE_STATUS",
    message: "Hardcoded positive status found. Status must come from backend.",
    severity: "error" as const,
    exclude: [/switch|case|if|===|!==|getStatus|Label|variant/],
  },
  // "Data Sync: Live" or similar live indicators
  {
    pattern: /["']Data\s*Sync[:\s]*Live["']/gi,
    rule: "FABRICATED_LIVE_INDICATOR",
    message: '"Data Sync: Live" is forbidden. Use "Data Mode: On-demand".',
    severity: "error" as const,
  },
  // "Last Refresh: Xm ago" hardcoded times
  {
    pattern: /["']Last\s*(?:Refresh|Sync|Update)[:\s]*\d+[mhs]\s*ago["']/gi,
    rule: "FABRICATED_TIMESTAMP",
    message: "Hardcoded relative time is forbidden. Use actual backend timestamps.",
    severity: "error" as const,
  },
  // Zero fallbacks that hide missing data: || 0
  {
    pattern: /\|\|\s*0(?:\s*[,;)\]}]|\s*$)/gm,
    rule: "ZERO_FALLBACK",
    message: "Zero fallback hides missing data. Use null and display 'Unknown'.",
    severity: "warning" as const,
    filePattern: /hooks|components/,
  },
  // Empty string fallbacks: || ""
  {
    pattern: /\|\|\s*["']{2}(?:\s*[,;)\]}]|\s*$)/gm,
    rule: "EMPTY_STRING_FALLBACK",
    message: "Empty string fallback hides missing data. Use null and display 'Unknown'.",
    severity: "warning" as const,
    filePattern: /hooks|components/,
  },
  // Direct calls to deprecated v1 Plaid endpoints
  {
    pattern: /["'](?:\/link-token|\/exchange-public-token|\/sandbox-public-token)["']/gi,
    rule: "DEPRECATED_PLAID_V1",
    message: "V1 Plaid endpoint is deprecated. Use /api/plaid/* endpoints.",
    severity: "error" as const,
  },
  // DEMO_MODE without visible labeling check
  {
    pattern: /DEMO_MODE\s*[=:]\s*true/gi,
    rule: "DEMO_MODE_ACTIVE",
    message: "DEMO_MODE is enabled. Ensure UI displays 'Demo' badge visibly.",
    severity: "warning" as const,
  },
  // @ts-ignore in status-related code
  {
    pattern: /@ts-ignore.*status/gi,
    rule: "TS_IGNORE_STATUS",
    message: "@ts-ignore used near status code. Type safety must be maintained.",
    severity: "error" as const,
  },
];

// Files/patterns to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /\.git/,
  /trust-check\.ts$/, // Don't scan this file itself
  /status-contracts\.ts$/, // Type definitions are allowed
  /fail-closed-guards\.ts$/, // Guard implementations are allowed
  /TRUST_CHECKLIST\.md$/, // Documentation is allowed
];

function shouldExcludeFile(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath: string): void {
  if (shouldExcludeFile(filePath)) return;

  const ext = path.extname(filePath);
  if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const violationPattern of TRUST_VIOLATION_PATTERNS) {
    // Check file pattern filter
    if (violationPattern.filePattern && !violationPattern.filePattern.test(filePath)) {
      continue;
    }

    let match: RegExpExecArray | null;
    const regex = new RegExp(violationPattern.pattern.source, violationPattern.pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;
      const lineContent = lines[lineNumber - 1] || "";

      // Check exclusions (e.g., switch/case statements are OK)
      if (violationPattern.exclude) {
        const shouldExclude = violationPattern.exclude.some((excludePattern) =>
          excludePattern.test(lineContent)
        );
        if (shouldExclude) continue;
      }

      violations.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNumber,
        rule: violationPattern.rule,
        message: violationPattern.message,
        severity: violationPattern.severity,
      });
    }
  }
}

function scanDirectory(dir: string): void {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldExcludeFile(fullPath)) continue;

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

function checkStatusContractUsage(): void {
  // Verify that status-related types are using the contract types
  const typesDir = path.join(SRC_DIR, "types");
  const statusContractsPath = path.join(typesDir, "status-contracts.ts");

  if (!fs.existsSync(statusContractsPath)) {
    violations.push({
      file: "src/types/status-contracts.ts",
      line: 0,
      rule: "MISSING_STATUS_CONTRACTS",
      message: "status-contracts.ts is missing. Status types must be defined.",
      severity: "error",
    });
  }
}

function checkFailClosedGuards(): void {
  const guardsPath = path.join(SRC_DIR, "lib", "fail-closed-guards.ts");

  if (!fs.existsSync(guardsPath)) {
    violations.push({
      file: "src/lib/fail-closed-guards.ts",
      line: 0,
      rule: "MISSING_FAIL_CLOSED_GUARDS",
      message: "fail-closed-guards.ts is missing. Safety guards must be present.",
      severity: "error",
    });
  }
}

function printResults(): void {
  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  console.log("\n" + "=".repeat(70));
  console.log("PHASE 6: TRUST ENFORCEMENT BUILD CHECK");
  console.log("=".repeat(70));

  if (violations.length === 0) {
    console.log("\n✅ All trust checks PASSED\n");
    console.log("No trust violations detected.");
    console.log("Build is safe to proceed.\n");
    return;
  }

  console.log(`\n❌ Trust violations found: ${errors.length} errors, ${warnings.length} warnings\n`);

  // Print errors first
  if (errors.length > 0) {
    console.log("ERRORS (must fix before deploy):");
    console.log("-".repeat(50));
    for (const v of errors) {
      console.log(`\n  [${v.rule}] ${v.file}:${v.line}`);
      console.log(`  └─ ${v.message}`);
    }
    console.log();
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log("\nWARNINGS (review recommended):");
    console.log("-".repeat(50));
    for (const v of warnings) {
      console.log(`\n  [${v.rule}] ${v.file}:${v.line}`);
      console.log(`  └─ ${v.message}`);
    }
    console.log();
  }

  console.log("=".repeat(70));
  console.log("BUILD BLOCKED: Fix trust violations before deploying.");
  console.log("=".repeat(70) + "\n");
}

// Main execution
console.log("Scanning for trust violations...");

scanDirectory(SRC_DIR);
checkStatusContractUsage();
checkFailClosedGuards();

printResults();

// Exit with error if violations found
const hasErrors = violations.some((v) => v.severity === "error");
process.exit(hasErrors ? 1 : 0);
