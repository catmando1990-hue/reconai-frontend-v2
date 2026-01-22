#!/usr/bin/env bash
set -euo pipefail

AUTH_STATE_FILE="playwright-auth-state.json"
SEEDED="${1:-}"

echo "[auth-state-check] Verifying Playwright auth state file..."

if [[ -z "$SEEDED" ]]; then
  echo "[auth-state-check] FAIL: missing seeded input"
  exit 1
fi

if [[ "$SEEDED" == "false" ]]; then
  echo "[auth-state-check] SKIP: auth seeding skipped; file not required"
  exit 0
fi

if [[ ! -f "$AUTH_STATE_FILE" ]]; then
  echo "[auth-state-check] FAIL: $AUTH_STATE_FILE not created"
  exit 1
fi

echo "[auth-state-check] SUCCESS: $AUTH_STATE_FILE exists"
