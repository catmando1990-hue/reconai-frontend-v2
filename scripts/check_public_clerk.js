#!/usr/bin/env node

/**
 * BUILD 21-23: Clerk Isolation Guardrail Script
 *
 * This script checks for potential Clerk API key exposure in public-facing code.
 * It scans the codebase for patterns that might indicate Clerk keys are being
 * exposed in client-side code or committed to version control.
 *
 * Usage: node scripts/check_public_clerk.js
 * npm script: npm run check:public-clerk
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DANGEROUS_PATTERNS = [
  // Direct key patterns (should never appear in code)
  /pk_live_[A-Za-z0-9]+/g,
  /pk_test_[A-Za-z0-9]+/g,
  /sk_live_[A-Za-z0-9]+/g,
  /sk_test_[A-Za-z0-9]+/g,

  // Clerk secret key being assigned or used
  /CLERK_SECRET_KEY\s*[=:]\s*["'][^"']+["']/g,

  // Hardcoded API keys in fetch calls
  /Authorization.*Bearer.*[ps]k_(live|test)_/g,
];

const SAFE_PATTERNS = [
  // Environment variable references are OK
  /process\.env\.CLERK_/,
  /process\.env\["CLERK_/,
  /process\.env\['CLERK_/,
  // Next.js public env vars are OK (they're meant to be public)
  /NEXT_PUBLIC_CLERK_/,
];

const SCAN_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

const IGNORE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  "coverage",
];

const IGNORE_FILES = [
  "check_public_clerk.js", // This file itself
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
];

let violations = [];
let filesScanned = 0;

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);

  if (!SCAN_EXTENSIONS.includes(ext)) return false;
  if (IGNORE_FILES.includes(fileName)) return false;

  return true;
}

function shouldScanDir(dirPath) {
  const dirName = path.basename(dirPath);
  return !IGNORE_DIRS.includes(dirName);
}

function isSafeUsage(line) {
  return SAFE_PATTERNS.some((pattern) => pattern.test(line));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, lineNumber) => {
      // Skip if this is a safe pattern (env var reference)
      if (isSafeUsage(line)) return;

      DANGEROUS_PATTERNS.forEach((pattern) => {
        // Reset regex state
        pattern.lastIndex = 0;
        const matches = line.match(pattern);

        if (matches) {
          violations.push({
            file: filePath,
            line: lineNumber + 1,
            content: line.trim().substring(0, 100),
            pattern: pattern.toString(),
            matches: matches,
          });
        }
      });
    });

    filesScanned++;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (shouldScanDir(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        if (shouldScanFile(fullPath)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

function checkEnvFiles() {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];
  const warnings = [];

  envFiles.forEach((envFile) => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf8");

        // Check if secret key is present (which is expected)
        if (content.includes("CLERK_SECRET_KEY")) {
          // Verify it's not in .env (should be in .env.local)
          if (envFile === ".env") {
            warnings.push({
              file: envFile,
              message:
                "CLERK_SECRET_KEY found in .env - consider moving to .env.local",
            });
          }
        }
      } catch {
        // Ignore read errors for env files
      }
    }
  });

  return warnings;
}

function main() {
  console.log("=".repeat(60));
  console.log("Clerk Isolation Guardrail Check");
  console.log("=".repeat(60));
  console.log("");

  const startDir = process.cwd();
  console.log(`Scanning: ${startDir}`);
  console.log("");

  // Scan source files
  scanDirectory(path.join(startDir, "src"));
  scanDirectory(path.join(startDir, "app"));
  scanDirectory(path.join(startDir, "pages"));
  scanDirectory(path.join(startDir, "components"));
  scanDirectory(path.join(startDir, "lib"));

  // Check env files for best practices
  const envWarnings = checkEnvFiles();

  // Report results
  console.log(`Files scanned: ${filesScanned}`);
  console.log("");

  if (violations.length === 0 && envWarnings.length === 0) {
    console.log("✓ No Clerk key exposure detected");
    console.log("");
    console.log("All clear! No hardcoded Clerk keys found in source files.");
    process.exit(0);
  }

  if (violations.length > 0) {
    console.log("✗ VIOLATIONS DETECTED");
    console.log("-".repeat(60));
    console.log("");

    violations.forEach((v, index) => {
      console.log(`[${index + 1}] ${v.file}:${v.line}`);
      console.log(`    Pattern: ${v.pattern}`);
      console.log(`    Content: ${v.content}`);
      console.log("");
    });
  }

  if (envWarnings.length > 0) {
    console.log("⚠ WARNINGS");
    console.log("-".repeat(60));
    console.log("");

    envWarnings.forEach((w, index) => {
      console.log(`[${index + 1}] ${w.file}: ${w.message}`);
    });
    console.log("");
  }

  if (violations.length > 0) {
    console.log("=".repeat(60));
    console.log("FAILED: Clerk keys may be exposed in source code.");
    console.log("Please remove hardcoded keys and use environment variables.");
    console.log("=".repeat(60));
    process.exit(1);
  }

  process.exit(0);
}

main();
