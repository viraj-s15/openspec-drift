#!/usr/bin/env bash
# Builds one baseline change through the full OpenSpec cycle, then commits it.
# Usage: scripts/baseline-change.sh <change-name> "<what the change does>"
set -euo pipefail
name="$1"; what="$2"
cd "$(dirname "$0")/.."
scripts/agent.sh "baseline-$name" "You work in a TypeScript library-lending service (in-memory, no HTTP). Code goes in src/, Vitest tests in test/.

Do this OpenSpec change end to end without asking me anything. Make reasonable choices and keep the code small.

1. Use the openspec-propose skill to create the change named '$name': $what
2. Use the openspec-apply-change skill to implement every task, with tests for each scenario.
3. Run 'npm test' and 'npm run typecheck' and fix failures until both pass.
4. Use the openspec-archive-change skill to archive '$name' and sync its specs.

Do not run git commands."
npm test --silent && npm run typecheck --silent
git add -A && git commit -q -m "Add $name through OpenSpec" -m "Pi proposed, applied and archived the $name change: $what"
echo "committed $name"
