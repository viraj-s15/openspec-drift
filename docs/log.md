# Log

## 2026-11-13: setup

- Started with OpenSpec 2.0.0 (released 2026-11-11), pinned as a dev dependency. 2.0 installs skills in `.agents/skills/`, which pi reads.
- The default `core` profile has no verify skill. Added it with a custom profile in a throwaway config dir, so the global OpenSpec config stayed untouched.
- `pi -p` hung when stdin was open. `scripts/agent.sh` closes stdin.
- First baseline run: OpenSpec 2.0's propose skill stops for human review, so pi wrote proposals for changes 2 to 4 and no code. The script committed them because the old tests still passed. Reset to the catalog commit. Propose, apply and archive now run as three pi calls, and the script checks that the change was archived and code was written before it commits.
