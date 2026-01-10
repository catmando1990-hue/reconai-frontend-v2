#!/usr/bin/env node
/**
 * log-decision.mjs
 * Appends a PR decision entry into ai-system/decision-log.md using GITHUB_EVENT_PATH.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const logPath = path.join(repoRoot, "ai-system", "decision-log.md");

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath || !fs.existsSync(eventPath)) {
  console.error("GITHUB_EVENT_PATH not found.");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(eventPath, "utf-8"));
const pr = payload.pull_request;
if (!pr) {
  console.error("No pull_request in event payload.");
  process.exit(1);
}

const merged = !!pr.merged;
const decision = merged ? "Approved" : "Rejected";
const date = new Date().toISOString().slice(0, 10);

const entry = [
  "",
  "### Entry",
  `- Date: ${date}`,
  `- PR: #${pr.number} — ${pr.title}`,
  `- Link: ${pr.html_url}`,
  `- Decision: ${decision}`,
  `- Notes: ${merged ? "Merged to main." : "Closed without merge."}`,
  ""
].join("\n");

fs.mkdirSync(path.dirname(logPath), { recursive: true });
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(
    logPath,
    "# Decision Log\n\n## Purpose\nTrack accepted and rejected AI changes to improve future behavior.\n\n",
    "utf-8"
  );
}
fs.appendFileSync(logPath, entry, "utf-8");
console.log(`Appended ${decision} entry for PR #${pr.number}.`);
