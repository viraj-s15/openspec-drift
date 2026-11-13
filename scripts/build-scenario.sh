#!/usr/bin/env bash
# Builds one scenario branch from main with pi, then commits it. It does not push or open a PR.
# OpenSpec changes are left active, not archived, so OpenSpec verify can still check them.
# Usage: scripts/build-scenario.sh <clean-change|bypass|changed-more-than-planned|silent-mismatch|refactor|several-changes-at-once>
set -euo pipefail
scenario="$1"
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

ctx="You work in a TypeScript library-lending service (in-memory, no HTTP). Code is in src/, Vitest tests in test/, OpenSpec specs in openspec/specs/. Do not ask me anything; make reasonable choices. Do not run git commands."
checks="Run 'npm test' and 'npm run typecheck' and fix failures until both pass."

step() { # <step-name> <prompt>
  echo "[$scenario] $1"
  scripts/agent.sh "scenario-$scenario-$1" "$ctx

$2" > ".sessions/scenario-$scenario-$1.out" 2>&1
}
propose() { # <change-name> <what>
  step "$1-propose" "Use the openspec-propose skill to create the change named '$1': $2"
}
apply() { # <change-name> [extra instruction]
  step "$1-apply" "The proposal is reviewed and approved. Use the openspec-apply-change skill to implement every task of the change '$1', with a test for each new or changed scenario. ${2:-}
$checks"
}
code_only() { # <step-name> <task>
  step "$1" "$2 Do not use OpenSpec skills and do not edit anything under openspec/.
$checks"
}

[ -z "$(git status --porcelain)" ] || { echo "working tree is not clean"; exit 1; }
git checkout -q -b "$scenario" main

case "$scenario" in
  clean-change)
    propose limit-holds-per-member "A member can have at most 3 active holds (waiting or ready) at once. Placing a fourth hold fails."
    apply limit-holds-per-member
    ;;
  bypass)
    code_only raise-late-fee "Raise the late fee from 0.25 to 0.50 dollars per overdue day. Update the code and the tests."
    ;;
  changed-more-than-planned)
    propose renew-from-due-date "A renewal extends the due date by the member's loan period counted from the current due date, not from the renewal date."
    apply renew-from-due-date "While you are in the code, also lower the standard fine cap from 10.00 to 8.00 dollars per loan and update its tests. Do not mention the fine cap change in the proposal, specs, design or tasks."
    ;;
  silent-mismatch)
    propose longer-premium-loans "Premium members' loans last 35 days instead of 28."
    apply longer-premium-loans "Set the premium loan period to 42 days in the code and tests. Leave the proposal, design and specs saying 35 days."
    ;;
  refactor)
    code_only tidy-loans "Refactor src/loans.ts for readability: extract small helper functions and rename private members where it helps. Do not change any behavior, public API or test assertion."
    ;;
  several-changes-at-once)
    propose earlier-due-soon-notice "Send the due-soon notice 3 days before a loan is due instead of 2."
    apply earlier-due-soon-notice
    propose longer-hold-pickup "A ready hold expires after 5 days instead of 3."
    apply longer-hold-pickup "Set the ready-hold expiry to 7 days in the code and tests. Leave the proposal, design and specs saying 5 days."
    code_only lower-suspension-threshold "Suspend members when their unpaid fines exceed 3.00 dollars instead of 5.00, and reinstate them at 3.00 or less. Update the code and the tests."
    ;;
  *) echo "unknown scenario: $scenario"; git checkout -q main; git branch -D -q "$scenario"; exit 1 ;;
esac

npm test --silent > /dev/null && npm run typecheck --silent
git add -A
git commit -q -m "Build the $scenario scenario" -m "Pi built the $scenario scenario from main as described in docs/scenarios.md"
git checkout -q main
echo "[$scenario] committed on branch $scenario"
