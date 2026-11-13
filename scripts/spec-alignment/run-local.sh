#!/usr/bin/env bash
# Runs spec-alignment on one branch with pi as the model, so no provider API key is needed.
# Usage: scripts/spec-alignment/run-local.sh <branch> [output-file]
# Env: PI_MODEL (default openai/gpt-6.1-terra:high), STRICTNESS (default balanced)
set -euo pipefail
branch="$1"
version=v0.1.1
root="$(cd "$(dirname "$0")/../.." && pwd)"
tool="$root/.tools/spec-alignment-$version"
work="$root/.tools/worktrees/$branch"
out="${2:-$root/docs/results/$branch/spec-alignment.json}"

if [ ! -d "$tool" ]; then
  git clone -q --depth 1 --branch "$version" https://github.com/ebellefontaine/spec-alignment "$tool"
  (cd "$tool" && npm ci --silent --ignore-scripts)
fi
cp "$root/scripts/spec-alignment/local-runner.ts" "$tool/src/local-runner.ts"
# Bundled like the published action, because the source imports CommonJS packages by name.
"$root/node_modules/.bin/esbuild" "$tool/src/local-runner.ts" --bundle --platform=node --format=cjs \
  --log-level=warning --outfile="$tool/local-runner.cjs"

# spec-alignment diffs origin/HEAD...HEAD, the same range a PR against main has.
git -C "$root" fetch -q origin
git -C "$root" remote set-head origin main >/dev/null
rm -rf "$work"; git -C "$root" worktree prune
mkdir -p "$(dirname "$work")"
git -C "$root" -c advice.detachedHead=false worktree add -q --detach "$work" "$branch"

mkdir -p "$(dirname "$out")"
(cd "$work" && RESULT_FILE="$out" node "$tool/local-runner.cjs") > /dev/null
git -C "$root" worktree remove --force "$work"
echo "$branch: $(grep -m1 '"verdict"' "$out")  -> ${out#$root/}"
