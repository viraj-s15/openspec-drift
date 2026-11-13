# Log

## 2026-11-13: setup

- Started with OpenSpec 2.0.0 (released 2026-11-11), pinned as a dev dependency. 2.0 installs skills in `.agents/skills/`, which pi reads.
- The default `core` profile has no verify skill. Added it with a custom profile in a throwaway config dir, so the global OpenSpec config stayed untouched.
- `pi -p` hung when stdin was open. `scripts/agent.sh` closes stdin.
- First baseline run: OpenSpec 2.0's propose skill stops for human review, so pi wrote proposals for changes 2 to 4 and no code. The script committed them because the old tests still passed. Reset to the catalog commit. Propose, apply and archive now run as three pi calls, and the script checks that the change was archived and code was written before it commits.

## 2026-11-13: baseline, and how the agent did

The agent was pi with `openai/gpt-6.1-terra` at high effort. It got all 8 changes through OpenSpec, with 77 passing tests, but the output needed cleanup:

- It put fines, holds, renewals and notifications in one 227-line `Loans` class in `src/loans.ts`. OpenSpec has six spec domains, and the code had three files. The proposals and designs never asked for this, so the code layout drifted from the spec layout without any check noticing.
- It wrote dense one-line business rules with bare numbers, such as `Math.min(loan.fineCap, ... * 25)` and `(member?.tier === 'premium' ? 28 : 14) * 86400000`, repeated in two places.
- Two of its six specs fail `openspec validate --strict`, because some requirements run past 500 characters.
- Tests passed throughout, so none of this would block a PR.

A second pi run split the code into one module per domain and fixed the two specs, with no change to behavior. The checks for that run were that the same 77 tests still pass, that strict validation passes, and that no test assertion changes.

The split worked on the first try. `src/` now has one module per spec domain (475 lines), with named constants such as `FINE_PER_DAY_CENTS = 25`. The same 77 tests pass, strict validation passes for all six specs, and no test file changed. One leftover: `MILLISECONDS_PER_DAY` is defined in three files.

Tagged `baseline` at this commit. Every scenario branch starts here.

## 2026-11-13: spec-alignment setup

- spec-alignment calls an LLM from inside GitHub Actions, so CI needs a provider key as a repo secret. Without the secret, the workflow skips with a notice.
- For anyone without a key, `scripts/spec-alignment/run-local.sh <branch>` runs spec-alignment v0.1.1's own pipeline and swaps only the model call for pi. Their code routes all model calls through one `LlmJudgeAdapter` interface, so the swap took about 100 lines. The prompt, file discovery and verdict mapping are theirs, unchanged. Pi gets one extra line that spells out the JSON shape, which the hosted path gets from structured output.
- Their source does not run directly under Node ESM, because `fast-glob` is imported by name. The runner bundles it with esbuild, as their own build does.
- Their README example uses a shallow checkout, but the action diffs `origin/HEAD...HEAD`. Our workflow uses `fetch-depth: 0` to be safe. Not yet confirmed whether the shallow version breaks.
- Smoke test on a throwaway branch that raised the late fee from 25 to 50 cents with no spec change: verdict `fail`, one finding at `src/fines.ts:5` with the right reason, in about 9 seconds.

## 2026-11-13: SpecGov, OpenLore and OpenSpec setup

- SpecGov: npm has only v0.1.0, which its own README calls unsupported. v1.0.0-rc.2 exists only as a git tag with the build committed, so it is installed from the tag. `specgov init --dry-run` detected OpenSpec but mapped no domains (`domains: []`), so `.specgov.yml` maps each spec domain to its module by hand: 6 entries, about 30 lines. With no mapping it would never flag anything.
- SpecGov is purely structural. In a smoke test, a code change in `src/fines.ts` with no spec change got `GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE`, and touching the fines spec cleared it. It never reads what the change does.
- OpenLore: `openlore install` wires your whole user account and indexes every repo you open, so it was installed as a dev dependency instead, using only `init`, `analyze` and `drift`. `.openlore/` is gitignored by design, so CI rebuilds the index each run. No hand mapping was needed: it inferred 13 mapped source files across 6 domains.
- In a smoke test, OpenLore reported the late-fee change as INFO only, which passes, and linked `src/fines.ts` to the catalog spec, the wrong domain.
- OpenSpec verify needs a model, so it runs locally through pi on every active change in a branch. With no active change, as in a bypass, it has nothing to check.
- `scripts/check-branch.sh <branch>` runs all five checks locally. A plumbing run on `main` itself, with an empty diff, gave exit 0 and no findings from every tool.
- CI smoke test on a README-only PR (#1, closed): all four workflows ran and passed. spec-alignment skipped with its notice, because no `OPENAI_API_KEY` secret is set. OpenSpec validate and OpenLore take about a minute each, mostly `npm ci`.

Setup is done. No scenario branch has been built yet.
