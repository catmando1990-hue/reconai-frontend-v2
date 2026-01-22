#!/usr/bin/env bash
set -euo pipefail

echo "Checking for CORE state contract changes..."

if ! git rev-parse HEAD~1 >/dev/null 2>&1; then
  echo "ERROR: Git history is unavailable (HEAD~1 missing)."
  exit 1
fi

CORE_CONTRACT_CHANGED=false
CORE_FIXTURE_CHANGED=false

CHANGED_FILES="$(git diff --name-only HEAD~1 HEAD)"

if echo "$CHANGED_FILES" | grep -q "^src/hooks/useCoreState.tsx$"; then
  echo "Contract file changed: src/hooks/useCoreState.tsx"
  CORE_CONTRACT_CHANGED=true
fi

if echo "$CHANGED_FILES" | grep -q "^src/lib/api/types.ts$"; then
  echo "Types file changed: src/lib/api/types.ts"
  CORE_CONTRACT_CHANGED=true
fi

if echo "$CHANGED_FILES" | grep -q "^tests/fixtures/core-state-factory.ts$"; then
  echo "Fixture file changed: tests/fixtures/core-state-factory.ts"
  CORE_FIXTURE_CHANGED=true
fi

{
  echo "contract_changed=$CORE_CONTRACT_CHANGED"
  echo "fixture_changed=$CORE_FIXTURE_CHANGED"
} >> "$GITHUB_OUTPUT"

echo "CORE contract changed: $CORE_CONTRACT_CHANGED"
echo "CORE fixture changed: $CORE_FIXTURE_CHANGED"
