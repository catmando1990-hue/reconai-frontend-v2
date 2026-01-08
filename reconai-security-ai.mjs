import fs from "fs";
import path from "path";

const APP_DIR = "src/app";
const issues = [];

function walk(dir, map = {}) {
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, map);
    else if (file === "page.tsx") {
      const route = p.replace(APP_DIR, "").replace("/page.tsx", "");
      map[route] = (map[route] || 0) + 1;
    }
  }
  return map;
}

const routes = walk(APP_DIR);
for (const r in routes) {
  if (routes[r] > 1) {
    issues.push({ severity: "HIGH", message: `Duplicate route: ${r}` });
  }
}

if (!fs.existsSync("middleware.ts") && !fs.existsSync("src/proxy.ts")) {
  issues.push({ severity: "HIGH", message: "Missing global middleware.ts or src/proxy.ts" });
}

if (issues.length) {
  console.error("SECURITY AI FINDINGS");
  issues.forEach(i => console.error(i.severity, i.message));
  process.exit(1);
}

console.log("SECURITY AI: PASS");
