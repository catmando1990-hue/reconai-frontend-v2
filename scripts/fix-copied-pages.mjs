// One-shot fixer for pages copied from the legacy ReconAI User Dashboard project.
// Run from V2 root with: node scripts/fix-copied-pages.mjs
//
// Transforms:
//   1. Adds "use client"; to top of every page if missing
//   2. Rewrites `import './X.css'` and `import './Y/X.css'` -> `@/styles/<module>/X.css`
//      where <module> is inferred from the file's path
//   3. Rewrites `import { ... } from 'react-router-dom'` -> next/link + next/navigation
//   4. Rewrites `<NavLink to="...">` -> `<Link href="..." className="...">`
//   5. Rewrites `useLocation()` -> `usePathname()` (and `location.pathname` -> `pathname`)
//   6. Rewrites `import './Component.css'` for AIChat, PolicyBanner, etc into recon path
//   7. Rewrites `import { ... } from '../../api'` -> '@/api'
//   8. Rewrites `import { ... } from '../../context/AuthContext'` -> '@/context/AuthContext'
//   9. Rewrites `import './Foo.jsx'` for sibling components -> '@/components/recon/Foo'
//
// Idempotent — safe to run multiple times.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DASHBOARD = join(ROOT, "src", "app", "(dashboard)");

// Module dir on disk -> CSS subfolder name in @/styles/
const MODULE_TO_STYLE_DIR = {
  core: "core",
  cfo: "cfo",
  payroll: "payroll",
  govcon: "govcon",
  invoicing: "invoicing",
};

// Component basename -> import path under @/components/recon
const SHARED_COMPONENTS = {
  AIChat: "@/components/recon/AIChat",
  PolicyBanner: "@/components/recon/PolicyBanner",
  StatCard: "@/components/recon/StatCard",
  InformationCard: "@/components/recon/InformationCard",
  CFOChat: "@/components/recon/CFOChat",
  GovConChat: "@/components/recon/GovConChat",
  InvoicingChat: "@/components/recon/InvoicingChat",
  PayrollChat: "@/components/recon/PayrollChat",
};

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    // Only operate on .jsx files (our copies). Never touch V2's own .tsx files.
    else if (entry.endsWith(".jsx")) files.push(full);
  }
  return files;
}

function inferModule(filePath) {
  const rel = filePath.replace(DASHBOARD, "").replaceAll("\\", "/");
  const parts = rel.split("/").filter(Boolean);
  return parts[0]; // e.g. "cfo", "core", ...
}

function ensureUseClient(src) {
  const trimmed = src.trimStart();
  if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
    return src;
  }
  return `"use client";\n\n${src}`;
}

function rewriteCssImports(src, mod) {
  const styleDir = MODULE_TO_STYLE_DIR[mod];
  if (!styleDir) return src;
  // import './X.css'  OR  import "./X.css"
  return src.replace(
    /import\s+(['"])\.\/([\w-]+)\.css\1\s*;?/g,
    (_m, quote, name) => `import ${quote}@/styles/${styleDir}/${name}.css${quote};`,
  );
}

function rewriteSiblingComponentImports(src) {
  // import Foo from './Foo';  OR ./Foo.jsx
  let out = src;
  for (const [name, target] of Object.entries(SHARED_COMPONENTS)) {
    const re = new RegExp(
      `import\\s+(\\w+)\\s+from\\s+(['"])\\.\\/${name}(\\.jsx)?\\2\\s*;?`,
      "g",
    );
    out = out.replace(re, (_m, local, quote) => `import ${local} from ${quote}${target}${quote};`);
  }
  // Strip the legacy `import "./AIChat.css"` etc that the components themselves used
  // (those are handled inside @/components/recon/* now)
  return out;
}

function rewriteApiImports(src) {
  let out = src;
  out = out.replace(
    /from\s+(['"])\.\.\/(?:\.\.\/)+api(?:\/[\w-]+)?\1/g,
    (_m, q) => `from ${q}@/api${q}`,
  );
  out = out.replace(
    /from\s+(['"])\.\.\/(?:\.\.\/)+context\/AuthContext\1/g,
    (_m, q) => `from ${q}@/context/AuthContext${q}`,
  );
  out = out.replace(
    /from\s+(['"])\.\.\/(?:\.\.\/)+hooks\/(\w+)\1/g,
    (_m, q, h) => `from ${q}@/hooks/${h}${q}`,
  );
  out = out.replace(
    /from\s+(['"])\.\.\/(?:\.\.\/)+data\/(\w+)\1/g,
    (_m, q, h) => `from ${q}@/data/${h}${q}`,
  );
  return out;
}

function rewriteRouterImports(src) {
  if (!/from\s+['"]react-router-dom['"]/.test(src)) return src;

  // Strip the original react-router-dom import line, keeping its named imports
  const importLineRe = /import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"]\s*;?/g;
  let importedNames = new Set();
  src = src.replace(importLineRe, (_m, names) => {
    for (const n of names.split(",").map((s) => s.trim()).filter(Boolean)) {
      importedNames.add(n);
    }
    return "";
  });

  // Add Next.js equivalents at the top (after any "use client")
  const adds = [];
  if (importedNames.has("NavLink") || importedNames.has("Link")) {
    adds.push(`import Link from "next/link";`);
  }
  if (importedNames.has("useLocation") || importedNames.has("usePathname")) {
    adds.push(`import { usePathname } from "next/navigation";`);
  }
  if (importedNames.has("useNavigate")) {
    adds.push(`import { useRouter } from "next/navigation";`);
  }
  // Outlet is handled per-layout — won't try to auto-replace; leave a TODO comment
  if (importedNames.has("Outlet")) {
    adds.push(`// TODO: <Outlet /> -> use Next.js layout {children} prop`);
  }

  if (adds.length > 0) {
    // Insert after the first "use client" directive (or at very top)
    const useClientRe = /^("use client";|'use client';)\s*\n/;
    if (useClientRe.test(src)) {
      src = src.replace(useClientRe, `$&\n${adds.join("\n")}\n\n`);
    } else {
      src = `${adds.join("\n")}\n\n${src}`;
    }
  }

  // <NavLink to="..."> -> <Link href="...">
  src = src.replace(/<NavLink\s+to=/g, "<Link href=");
  src = src.replace(/<\/NavLink>/g, "</Link>");

  // useLocation() -> usePathname(); rename "location.pathname" to "pathname"
  if (importedNames.has("useLocation")) {
    src = src.replace(
      /const\s+location\s*=\s*useLocation\(\)\s*;?/g,
      "const pathname = usePathname();",
    );
    src = src.replace(/location\.pathname/g, "pathname");
  }

  // useNavigate -> useRouter
  if (importedNames.has("useNavigate")) {
    src = src.replace(
      /const\s+(\w+)\s*=\s*useNavigate\(\)\s*;?/g,
      "const $1 = useRouter();",
    );
    // navigate('...') -> router.push('...')   (best-effort)
    src = src.replace(/navigate\(/g, "router.push(");
  }

  return src;
}

let modified = 0;
let skipped = 0;
const files = walk(DASHBOARD);
for (const file of files) {
  const mod = inferModule(file);
  let src = readFileSync(file, "utf8");
  const original = src;

  src = rewriteCssImports(src, mod);
  src = rewriteSiblingComponentImports(src);
  src = rewriteApiImports(src);
  src = rewriteRouterImports(src);
  src = ensureUseClient(src);

  if (src !== original) {
    writeFileSync(file, src);
    console.log(`FIXED ${file.replace(ROOT, "")}`);
    modified++;
  } else {
    skipped++;
  }
}
console.log(`\n${modified} files modified, ${skipped} unchanged`);
