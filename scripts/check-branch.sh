#!/usr/bin/env bash
# Runs every tool on one scenario branch against main and saves each tool's raw output.
# Usage: scripts/check-branch.sh <branch>
# Results go to docs/results/<branch>/. A tool that fails to run is recorded, and the rest still run.
set -uo pipefail
branch="$1"
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/docs/results/$branch"
work="$root/.tools/worktrees/check-$branch"
mkdir -p "$out" "$(dirname "$work")"
base=$(git -C "$root" merge-base main "$branch")

record() { echo "$1: exit $2" | tee -a "$out/exit-codes.txt"; }
: > "$out/exit-codes.txt"

rm -rf "$work"; git -C "$root" worktree prune
git -C "$root" -c advice.detachedHead=false worktree add -q --detach "$work" "$branch"
ln -s "$root/node_modules" "$work/node_modules"

(cd "$work" && npx openspec validate --all --strict --no-color) > "$out/openspec-validate.txt" 2>&1
record openspec-validate $?

(cd "$work" && npx specgov check --base-ref "$base" --head-ref HEAD --format json) > "$out/specgov.json" 2>&1
record specgov $?

(cd "$work" && npx openlore init > /dev/null && npx openlore analyze > /dev/null && npx openlore drift --base "$base" --json) > "$out/openlore.json" 2>&1
record openlore $?

git -C "$root" worktree remove --force "$work"

"$root/scripts/openspec-verify-local.sh" "$branch" "$out/openspec-verify.md" 2>> "$out/errors.txt"
record openspec-verify $?

"$root/scripts/spec-alignment/run-local.sh" "$branch" "$out/spec-alignment.json" > /dev/null 2>> "$out/errors.txt"
record spec-alignment $?
