# Phase 02: Impact analysis

**Goal:** work out what actually changed, what else it can break, and how risky each requirement is.
Risk decides how deep test design goes in phase 03.

**Reads:** `01-context.md`, the PR diff or build, and product code around the change.
**Writes:** `02-impact.md`.
**Never:** read test code (that starts in phase 06), or change any file outside `.stlc/`.

Start only when `01-context.md` is `approved`. Use the answers to its open questions, not the suggested defaults.

---

## Step 1: Find what changed

Pick the best evidence available and say which one you used:

| Evidence | How | Confidence |
|---|---|---|
| A PR or branch diff | `gh pr diff <n>` / `git diff <base>...<head>`; list changed files and functions | high |
| A build or files with no diff | read the files named in context; treat the whole feature as changed | medium |
| Only documents | infer from requirements; say clearly that no code was seen | low |

For each change, write one row: file, function or component, what changed, and which requirements it serves.
Skip formatting-only and generated files, but say you skipped them.

## Step 2: Find the blast radius

For each changed function, component, API or data field, search the product code for its users:
- callers and importers of the changed function or module
- other screens or flows using the same component, endpoint, table or config value
- shared things: auth, money or date helpers, feature flags, validation, error handling

List each affected area as a **user-facing flow** ("Wallet balance on the home screen"), not as a file,
because that is what tests will cover. Note how you know (`used by home.ts:42`).

Stop at 2 levels of callers. If an area is beyond that or you aren't sure, list it as `possible` with the reason.

## Step 3: Score risk per requirement

For each requirement R-n in `01-context.md`:

- **Impact** if it breaks: `high` (money, data loss, security, legal, core journey blocked),
  `medium` (feature wrong but a workaround exists), `low` (cosmetic, rare path).
- **Likelihood** it's broken: raise it for new or heavily changed code, complex logic (rounding, dates, limits,
  concurrency), many callers, a likely product bug from phase 01, or no existing evidence it was tested.
  Lower it for untouched code and simple config.
- **Risk** = impact × likelihood, as `high`, `medium` or `low`.
- **Depth** for phase 03:
  | Risk | Depth in test design |
  |---|---|
  | high | every technique that applies: boundaries both sides, negatives, states, repeat actions |
  | medium | main path plus the most likely negatives and boundaries |
  | low | one check, or covered as part of another case |

Give a short reason for every high, so a human can disagree quickly.
If a domain pack is on, use its topics to judge impact (for fintech, anything that moves money is `high` impact).

## Step 4: Regression areas

From the blast radius, list existing flows that should be **re-tested** even though no requirement mentions them.
Describe them as flows, not test files. Phase 05 decides which ones run; phase 07 maps them to existing tests.

## Step 5: Profile-specific work

- **bug:** find the most likely root cause in the diff, and define the **regression ring**: the flows sharing
  that code. TC-1 in phase 03 will reproduce the bug.
- **task:** there are no new requirements to test. The regression areas are the main output.

## Step 6: Finish and stop

1. Header: `Inputs: 01-context.md`, `Sources:` the commit or build version you analysed, `Status: draft`.
2. Summary for the human: evidence used and its confidence, number of changes, affected flows, how many
   requirements are high risk and why, and the regression areas.
3. Stop if the mode is `step`. In `gated` and `auto`, you may approve it yourself
   (`Approved-by: auto (<mode> mode)`) unless you found something that changes phase 01. Then mark that
   and stop: a new requirement or a changed scope means `01-context.md` needs updating first.

---

## Output: `02-impact.md`

```markdown
# 02 Impact: <RUN-ID>
Status: draft
Inputs: 01-context.md
Sources: <pr:#n@sha | build:<path>@<version> | docs only>
Updated: <date>
Approved-by:

## Summary
Evidence: <diff | build | docs only> (confidence: <high | medium | low>)
<3–5 lines: what changed, the riskiest part, what else could break>

## Changes
| ID | Where | What changed | Serves |
|---|---|---|---|
| CH-1 | `fee()` in app/index.html | New fee calculation | R-6, R-7 |

## Blast radius
| ID | Flow affected | Why | How we know | Sure? |
|---|---|---|---|---|
| A-1 | Wallet balance shown everywhere | Send now changes the balance | `render()` reads wallet.balance | yes |

## Risk by requirement
| Req | Impact | Likelihood | Risk | Depth | Reason (for high) |
|---|---|---|---|---|---|

## Regression areas
- <flow> (<from A-n>)

## Notes for test design
- <anything phase 03 must know: test data setup, states that are hard to reach, likely bugs to target>
```

## Done when

- [ ] The evidence and its confidence are stated
- [ ] Every change maps to at least one requirement, or is flagged as unexplained
- [ ] Every requirement has a risk and depth, and every high has a reason
- [ ] Affected areas are user-facing flows, with how you know
- [ ] No test code was read
