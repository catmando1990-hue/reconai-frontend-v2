#!/usr/bin/env bash
set -euo pipefail

AUTH_STATE_FILE="playwright-auth-state.json"

echo "[auth-state-check] Verifying Playwright auth state file..."

if [[ ! -f "$AUTH_STATE_FILE" ]]; then
  echo "[auth-state-check] FAIL: $AUTH_STATE_FILE not created"
  exit 1
fi

echo "[auth-state-check] SUCCESS: $AUTH_STATE_FILE exists"
