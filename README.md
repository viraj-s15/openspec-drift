# openspec-drift

A test bed for tools that claim to catch drift between OpenSpec specs and code in pull requests.

The app is a small in-memory library-lending service in TypeScript. Its `main` branch looks like an established OpenSpec repo: 6 spec domains, 8 archived changes and 77 tests. Each scenario branch adds one kind of agent change, and a PR runs every tool on it.

- `docs/baseline.md` describes the starting repo.
- `docs/scenarios.md` lists each scenario and what a good tool should report. It was written before any tool ran.
- `docs/log.md` records each step as it happened, including what went wrong.
- `docs/results/<branch>/` holds each tool's raw output.

## Tools under test

| Tool | Version | Runs in | Needs a model |
| --- | --- | --- | --- |
| OpenSpec `validate --strict` | 2.0.0 | CI and local | No |
| OpenSpec verify skill | 2.0.0 | Local, through pi | Yes |
| [SpecGov](https://github.com/paladini/specgov) | 1.0.0-rc.2 | CI and local | No |
| [OpenLore](https://github.com/clay-good/OpenLore) drift | 3.6.0 | CI and local | No |
| [spec-alignment](https://github.com/ebellefontaine/spec-alignment) | 0.1.1 | CI with `OPENAI_API_KEY`, or local through pi | Yes |

## Running it

Every agent step goes through `scripts/agent.sh`, which runs pi. Pi builds the baseline and scenarios with `openai/gpt-6.1-terra` at high thinking effort. OpenSpec verify and local spec-alignment judge with `openai/gpt-6.1-sol` at low effort, so no model grades its own work. Set `PI_BIN`, `PI_MODEL` or `PI_JUDGE_MODEL` to change them. The defaults are in `scripts/lib/pi.sh`.

`scripts/build-baseline.sh` built the eight baseline changes on `main`. You don't need to rerun it.

```bash
npm ci
scripts/build-scenario.sh bypass        # build one scenario branch with pi
scripts/check-branch.sh bypass          # run every tool locally, results in docs/results/bypass/
git push -u origin bypass && gh pr create --base main --head bypass --fill   # run the CI checks
```

spec-alignment runs in CI only when the repo has an `OPENAI_API_KEY` secret. Without one, `scripts/spec-alignment/run-local.sh <branch>` runs the same pipeline with pi as the model.

`scripts/check-branch.sh` and the local spec-alignment run compare against `origin/main`, so push `main` first.
