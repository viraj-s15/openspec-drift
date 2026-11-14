# Round 2 plan: OpenSpec's own repo

Round 1 uses a small app where each spec domain maps to one file, so it shows the tools at their best. Round 2 runs the same tools on a large real repo, with shared files and long diffs.

## Target

[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec), MIT, pinned to one commit. On 2026-11-13 it had 44 specs, 108 archived changes and 224 TypeScript files under `src/`.

Of its last 200 merged PRs, 106 touched `src/`, and only 16 of those also changed anything under `openspec/`. Many are bug fixes that need no spec change, so sorting them from real drift tests false alarms.

## Cases

1. Real PRs: about 8 merged PRs that touch `src/`, replayed as base and head commits. A mix of PRs that changed specs and PRs that did not. Each gets a label before any tool runs: drift or no drift, with the spec line and the diff line as evidence.
2. Planted: the six round 1 scenario types, built by pi on the pinned commit, so the answers are known.

## Layout

- `targets/openspec/target.env` pins the repo URL and commit.
- `targets/openspec/cases.md` lists every case with its answer, written before any tool runs.
- `targets/openspec/.specgov.yml` holds SpecGov's hand mapping. Its size counts as setup cost, as in round 1.
- `scripts/fetch-target.sh <name>` clones the pinned commit into `.tools/targets/<name>/`, which is gitignored.
- `scripts/check-branch.sh` gets split, so its core runs on any repo directory and any base and head range.
- Results go to `docs/results/openspec/<case>/`.

Round 2 runs locally only, because we cannot open PRs on someone else's repo.

## Open questions

- Which 8 real PRs. Pick after round 1 results, so the mix covers the failures round 1 shows.
- Whether spec-alignment's prompt fits 44 specs, or its relevance filter kicks in. Either way the result is a finding.
