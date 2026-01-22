#!/usr/bin/env bash
set -euo pipefail

echo "Enforcing CORE contract / fixture parity..."

CONTRACT_CHANGED="${1:-}"
FIXTURE_CHANGED="${2:-}"

if [[ -z "$CONTRACT_CHANGED" || -z "$FIXTURE_CHANGED" ]]; then
  echo "ERROR: Missing enforcement inputs"
  exit 1
fi

if [[ "$CONTRACT_CHANGED" == "true" && "$FIXTURE_CHANGED" == "false" ]]; then
  echo "ERROR: CORE contract changed without fixture update."
  echo "Action required: update tests/fixtures/core-state-factory.ts"
  exit 1
fi

echo "CORE contract enforcement passed."
