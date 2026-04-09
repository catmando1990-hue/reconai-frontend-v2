import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "c:/dev/reconai-frontend-v2/src/app/(dashboard)";

const COMPONENT_REWRITES = {
  AIChat: "@/components/recon/AIChat",
  PolicyBanner: "@/components/recon/PolicyBanner",
  StatCard: "@/components/recon/StatCard",
  InformationCard: "@/components/recon/InformationCard",
  CFOChat: "@/components/recon/CFOChat",
  GovConChat: "@/components/recon/GovConChat",
  InvoicingChat: "@/components/recon/InvoicingChat",
  PayrollChat: "@/components/recon/PayrollChat",
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (f.endsWith(".jsx")) out.push(f);
  }
  return out;
}

let modified = 0;
for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  for (const name of Object.keys(COMPONENT_REWRITES)) {
    const target = COMPONENT_REWRITES[name];
    // Match: from '../../components/Name' or "../../components/Name.jsx" with any depth of ../
    const re = new RegExp(
      String.raw`from\s+(['"])(?:\.\.\/)+components\/` +
        name +
        String.raw`(?:\.jsx)?\1`,
      "g",
    );
    src = src.replace(re, `from $1${target}$1`);
  }

  if (src !== original) {
    writeFileSync(file, src);
    console.log("FIXED " + file.replace("c:/dev/reconai-frontend-v2", ""));
    modified++;
  }
}
console.log("\n" + modified + " files modified");
