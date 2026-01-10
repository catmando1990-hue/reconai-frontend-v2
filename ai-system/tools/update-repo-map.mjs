#!/usr/bin/env node
/**
 * update-repo-map.mjs
 * Builds/updates ai-system/repo-map.json by scanning Next.js App Router under src/app.
 *
 * Conventions:
 * - Excludes folders starting with "_" and common non-route dirs (components, lib, styles, etc.)
 * - Treats (group) folders as non-path segments.
 * - Includes route segments like [id] and [[...slug]]
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "src", "app");
const outPath = path.join(repoRoot, "ai-system", "repo-map.json");

const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const exists = (p) => fs.existsSync(p);

const skipNames = new Set([
  "components",
  "lib",
  "styles",
  "utils",
  "hooks",
  "types",
  "assets",
  "public",
  "favicon.ico",
  "globals.css",
  "fonts",
  "images",
]);

const isSkippableSegment = (name) => {
  if (!name) return true;
  if (name.startsWith("_")) return true;
  if (skipNames.has(name)) return true;
  return false;
};

const isGroupSegment = (name) => name.startsWith("(") && name.endsWith(")");

const hasRouteFile = (dir) => {
  return (
    exists(path.join(dir, "page.tsx")) ||
    exists(path.join(dir, "page.jsx")) ||
    exists(path.join(dir, "route.ts")) ||
    exists(path.join(dir, "route.js")) ||
    exists(path.join(dir, "layout.tsx")) ||
    exists(path.join(dir, "layout.jsx"))
  );
};

const normRoute = (segments) => {
  const segs = segments.filter(Boolean).filter((s) => !isGroupSegment(s));
  const r = "/" + segs.join("/");
  return r === "/" ? "/" : r.replace(/\/+/g, "/");
};

const walk = (dir, segments = []) => {
  const routes = [];
  if (!isDir(dir)) return routes;

  // If this folder contains a route file, count it as a route (even if it also has children).
  if (hasRouteFile(dir)) {
    routes.push({
      path: normRoute(segments),
      dir: path.relative(repoRoot, dir).replace(/\\/g, "/"),
      files: ["page", "layout", "route"].filter((k) =>
        ["tsx", "jsx", "ts", "js"].some(
          (ext) =>
            exists(path.join(dir, `${k}.${ext}`)) ||
            exists(path.join(dir, `${k}.tsx`)) ||
            exists(path.join(dir, `${k}.ts`)),
        ),
      ),
    });
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const name = e.name;
    if (isSkippableSegment(name)) continue;

    const childDir = path.join(dir, name);
    routes.push(...walk(childDir, [...segments, name]));
  }
  return routes;
};

if (!isDir(appDir)) {
  console.error(`Cannot find src/app at: ${appDir}`);
  process.exit(1);
}

const discovered = walk(appDir, [])
  .map((r) => ({ ...r, path: r.path === "/page" ? "/" : r.path }))
  .sort((a, b) => a.path.localeCompare(b.path));

const base = exists(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf-8"))
  : {};

const next = {
  ...base,
  generated_at: new Date().toISOString(),
  framework: "Next.js App Router",
  routes: discovered.reduce((acc, r) => {
    acc[r.path] = {
      description: base?.routes?.[r.path]?.description || "",
      dir: r.dir,
      files: r.files,
    };
    return acc;
  }, {}),
  components: base.components || [],
  services: base.services || [],
  auth: base.auth || "Clerk",
  deployment: base.deployment || "Vercel",
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(next, null, 2) + "\n", "utf-8");
console.log(
  `Updated ${path.relative(repoRoot, outPath)} with ${Object.keys(next.routes).length} routes.`,
);
