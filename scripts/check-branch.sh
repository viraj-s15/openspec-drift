#!/usr/bin/env bash
# Runs every tool on one scenario branch against main and saves each tool's raw output.
# Usage: scripts/check-branch.sh <branch>
# Results go to docs/results/<branch>/. A tool that fails to run is recorded, and the rest still run.
set -uo pipefail
branch="$1"
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/docs/results/$branch"
work="$root/.tools/worktrees/check-$branch"
source "$root/scripts/lib/worktree.sh"
rm -rf "$out"; mkdir -p "$out"
# Every tool compares against origin/main, the base a PR has, so they all judge the same diff.
git -C "$root" fetch -q origin
base=$(git -C "$root" merge-base origin/main "$branch")

record() { echo "$1: exit $2" | tee -a "$out/exit-codes.txt"; }

make_worktree "$work" "$branch"

(cd "$work" && npx openspec validate --all --strict --no-color) > "$out/openspec-validate.txt" 2>&1
record openspec-validate $?

(cd "$work" && npx specgov check --base-ref "$base" --head-ref HEAD --format json) > "$out/specgov.json" 2>&1
record specgov $?

# SpecGov 1.0.0-rc.2 ignores --base-ref and --head-ref, because its CLI and Action always pass an empty
# changed-file list, which wins over the refs. This second run passes the changed files itself.
changed_args=()
while IFS= read -r file; do changed_args+=(--changed-file "$file"); done < <(git -C "$root" diff --name-only "$base...$branch")
(cd "$work" && npx specgov check "${changed_args[@]}" --format json) > "$out/specgov-files.json" 2>&1
record specgov-files $?

(cd "$work" && npx openlore init > /dev/null && npx openlore analyze > /dev/null && npx openlore drift --base "$base" --json) > "$out/openlore.json" 2>&1
record openlore $?

"$root/scripts/openspec-verify-local.sh" "$branch" "$out/openspec-verify.md" 2>> "$out/errors.txt"
record openspec-verify $?

"$root/scripts/spec-alignment/run-local.sh" "$branch" "$out/spec-alignment.json" > /dev/null 2>> "$out/errors.txt"
record spec-alignment $?
