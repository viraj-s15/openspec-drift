#!/usr/bin/env bash
# Runs one pi task with fixed settings, so every change in this repo comes from the same agent setup.
# It runs in the current directory, so callers can point it at a worktree.
# stdin is closed because pi -p waits on an open stdin.
# Usage: scripts/agent.sh <session-name> "<prompt>"
set -euo pipefail
name="$1"; shift
root="$(cd "$(dirname "$0")/.." && pwd)"
source "$root/scripts/lib/pi.sh"
sessions="$root/.sessions"
mkdir -p "$sessions"
exec "$PI_BIN" -p \
  --model "$PI_MODEL" \
  --no-context-files --no-mcp \
  --session-dir "$sessions" --name "$name" \
  "$@" < /dev/null
