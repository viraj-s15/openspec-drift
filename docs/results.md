# Round 1 results

Six scenario branches, each built by pi with `openai/gpt-6.1-terra` at high effort. They are scored against the answer key in `docs/scenarios.md`, which was written before any tool ran. OpenSpec verify and spec-alignment judged with `openai/gpt-6.1-sol` at low effort, through pi, locally. Raw output for each branch is in `docs/results/<branch>/`.

## Score

A check mark means the tool reported what the answer key says. "Partial" means it caught one of two defects.

| Branch | OpenSpec validate | OpenSpec verify | SpecGov as shipped | SpecGov, files passed | OpenLore | spec-alignment |
| --- | --- | --- | --- | --- | --- | --- |
| `clean-change` | ✓ | ✓ | ✓ | ✓ | ✓ (INFO only) | ✓ |
| `bypass` | ✗ | ✗ nothing to check | ✗ | ✓ | ✗ INFO, wrong spec | ✓ |
| `changed-more-than-planned` | ✗ | ✓ as WARNING | ✗ | ✓ | ✗ INFO, wrong spec | ✓ |
| `silent-mismatch` | ✗ | ✓ as WARNING | ✗ | ✗ | ✗ INFO, wrong spec | ✓ |
| `refactor` | ✓ | ✓ nothing to check | ✓ | ✗ false alarm | ✗ false alarm, exit 1 | ✓ |
| `several-changes-at-once` | ✗ | Partial: holds only | ✗ | Partial: members only | ✗ INFO, wrong spec | ✓ |
| Correct | 2 of 6 | 4 of 6, 1 partial | 2 of 6 | 3 of 6, 1 partial | 1 of 6 | 6 of 6 |

The "as shipped" columns for OpenSpec validate and SpecGov score 2 of 6 only because they flag nothing, so they are right on the two branches with nothing to flag.

## What each tool did

- OpenSpec validate checks that spec files are well formed. It never looks at code, so it passed all six branches.
- OpenSpec verify read the code against each active change and caught both mismatches it could see: 42 days against a spec of 35, and 168 hours against 120. It also caught the hidden fine cap in `changed-more-than-planned`, because the cap contradicts the main fines spec. But it rated two of these WARNING, not CRITICAL, and in `silent-mismatch` it wrote "CRITICAL: None" above a finding that says the change is not ready to archive. It cannot see a bypass at all, because a bypass has no change to verify.
- SpecGov 1.0.0-rc.2 as shipped passed every branch, because it never sees a changed file. Its CLI and Action pass an empty changed-file list, which overrides `--base-ref` and `--head-ref`. With the files passed by hand, it flags code changed in a domain with no spec change in that domain. That catches bypasses, but it also flags the refactor and misses `silent-mismatch`, because there the spec did change, just to a different number.
- OpenLore linked every source file to the catalog spec, the wrong domain in five of six cases, and reported almost everything as INFO, which passes. Its only blocking result was a false alarm on the refactor.
- spec-alignment caught every planted defect with the right file and reason, and passed both clean branches. Its notices that a delta "disagrees" with the main spec are expected, because a delta changes the main spec.

## Caveats

- The repo is small, and every planted defect is a clear numeric contradiction. That suits an LLM judge. Round 2 (`docs/round-2.md`) tests real PRs in a large repo.
- spec-alignment's local runs swap only its model call for pi. Its CI check skips, because the repo has no `OPENAI_API_KEY`.
- Each scenario ran once. LLM verdicts can vary between runs.
