#!/usr/bin/env bash
set -euo pipefail

AUTH_STATE_FILE="playwright/.clerk/user.json"
PLAYWRIGHT_AUTH_FLAG="${PLAYWRIGHT_AUTH:-}"

echo "[auth-state-check] Verifying Playwright auth state file..."

if [[ "$PLAYWRIGHT_AUTH_FLAG" != "true" ]]; then
  echo "[auth-state-check] SKIP: PLAYWRIGHT_AUTH is not 'true'"
  exit 0
fi

if [[ ! -f "$AUTH_STATE_FILE" ]]; then
  echo "[auth-state-check] FAIL: $AUTH_STATE_FILE not created"
  exit 1
fi

if [[ ! -s "$AUTH_STATE_FILE" ]]; then
  echo "[auth-state-check] FAIL: $AUTH_STATE_FILE is empty"
  exit 1
fi

if ! grep -q '"cookies"' "$AUTH_STATE_FILE"; then
  echo "[auth-state-check] FAIL: $AUTH_STATE_FILE does not look like a Playwright storageState file"
  exit 1
fi

echo "[auth-state-check] SUCCESS: $AUTH_STATE_FILE exists"
