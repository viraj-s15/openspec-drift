#!/usr/bin/env bash
# Builds one baseline change through the full OpenSpec cycle, then commits it.
# Propose, apply and archive run as separate pi calls, because the propose skill stops for review.
# Usage: scripts/baseline-change.sh <change-name> "<what the change does>"
set -euo pipefail
name="$1"; what="$2"
cd "$(dirname "$0")/.."
ctx="You work in a TypeScript library-lending service (in-memory, no HTTP). Code goes in src/, Vitest tests in test/. Do not ask me anything; make reasonable choices and keep the code small. Do not run git commands."
before=$(git rev-parse HEAD)

scripts/agent.sh "baseline-$name-propose" "$ctx

Use the openspec-propose skill to create the change named '$name': $what"
scripts/agent.sh "baseline-$name-apply" "$ctx

The proposal is reviewed and approved. Use the openspec-apply-change skill to implement every task of the change '$name', with a test for each scenario. Run 'npm test' and 'npm run typecheck' and fix failures until both pass."
scripts/agent.sh "baseline-$name-archive" "$ctx

The change '$name' is implemented and approved. Use the openspec-archive-change skill to archive it and sync its specs into openspec/specs."

ls -d openspec/changes/archive/*-"$name" >/dev/null || { echo "not archived: $name"; exit 1; }
[ -z "$(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name archive)" ] || { echo "active change left over"; exit 1; }
git diff --quiet "$before" -- src && [ -z "$(git ls-files --others --exclude-standard src)" ] && { echo "no code written: $name"; exit 1; }
npm test --silent && npm run typecheck --silent
git add -A && git commit -q -m "Apply the $name OpenSpec change" -m "Pi proposed, applied and archived the $name change: $what"
echo "committed $name"
