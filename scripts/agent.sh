#!/usr/bin/env bash
# Runs one pi task with fixed settings, so every change in this repo comes from the same agent setup.
# It runs in the current directory, so callers can point it at a worktree.
# stdin is closed because pi -p waits on an open stdin.
# Usage: scripts/agent.sh <session-name> "<prompt>"
set -euo pipefail
name="$1"; shift
sessions="$(cd "$(dirname "$0")/.." && pwd)/.sessions"
mkdir -p "$sessions"
exec pi-bolt -p \
  --model openai/gpt-6.1-terra:high \
  --no-context-files --no-mcp \
  --session-dir "$sessions" --name "$name" \
  "$@" < /dev/null
