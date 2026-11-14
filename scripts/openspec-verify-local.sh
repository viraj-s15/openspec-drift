#!/usr/bin/env bash
# Runs OpenSpec's verify skill through pi on every active change in a branch.
# Verify needs a model, so it runs locally, not in CI.
# Usage: scripts/openspec-verify-local.sh <branch> <output-file>
set -euo pipefail
branch="$1"; out="$2"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$root/.tools/worktrees/verify-$branch"
source "$root/scripts/lib/worktree.sh"
source "$root/scripts/lib/pi.sh"
make_worktree "$work" "$branch"

changes=$(find "$work/openspec/changes" -mindepth 1 -maxdepth 1 -type d ! -name archive -exec basename {} \; | sort)
{
  echo "# OpenSpec verify on $branch"
  echo
  echo "Model: $PI_JUDGE_MODEL"
  echo
  if [ -z "$changes" ]; then
    echo "No active change, so verify has nothing to check."
  fi
  for change in $changes; do
    echo "## $change"
    echo
    (cd "$work" && PI_MODEL="$PI_JUDGE_MODEL" "$root/scripts/agent.sh" "verify-$branch-$change" \
      "Use the openspec-verify-change skill to verify the change '$change'. Do not change any files. Do not run git commands. Do not ask me anything.")
    echo
  done
} > "$out"
