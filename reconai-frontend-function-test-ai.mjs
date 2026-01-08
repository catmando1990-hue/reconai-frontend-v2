import fs from "fs";
import path from "path";

const required = [
  "src/app/maintenance/page.tsx",
  "src/app/sign-in/[[...sign-in]]/page.tsx",
  "src/app/(dashboard)/layout.tsx",
];

let failed = false;

for (const r of required) {
  if (!fs.existsSync(r)) {
    console.error("FUNCTION TEST FAIL: Missing", r);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("FUNCTION TEST AI: PASS");
