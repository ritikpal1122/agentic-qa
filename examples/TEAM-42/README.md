# Example run: TEAM-42 (TeamHub "Invite teammates")

A complete run of the skill, phases 01 to 12, on the [TeamHub demo](../../demo/teamhub), with **no domain pack**.
The artifacts and the test code were written by the agent; the only edit afterwards replaced a local temp path in
`11-run.md` with `<tmp>`.

| File | Phase |
|---|---|
| [run.md](run.md) | Run settings (profile, mode, no domain pack) |
| [01-context.md](01-context.md) | 28 requirements with sources, the seat-limit conflict, 5 likely bugs, the prompt injection it refused |
| [02-impact.md](02-impact.md) | Changes, blast radius, risk per requirement |
| [03-design.md](03-design.md) | 37 test cases with exact data and working |
| [04-review.md](04-review.md) | 5 reviewer personas as separate sub-agents: 4 blockers and 11 majors found and fixed, 5 cases added |
| [05-selection.md](05-selection.md) | What to automate, at which level |
| [06-codebase.md](06-codebase.md), [project-profile.md](project-profile.md) | What it learned about the automation repo |
| [07-architecture.md](07-architecture.md) | Files to create, reuse of `BasePage` and the workspace fixture |
| [08-approval.md](08-approval.md) | The one-page go/no-go |
| [09-build.md](09-build.md), [10-code-review.md](10-code-review.md) | Build notes, independent review |
| [11-run.md](11-run.md) | Results, triage, 3× stability, mutation checks, 5 bug drafts |
| [12-report.md](12-report.md) | Traceability, verdict, PR / ticket / bug drafts (not sent) |
| [generated/](generated) | The test code it wrote: 2 page objects, 4 spec files, a fixture change (as a diff) |

The agent numbers bugs in the order it found them, so its B-1 to B-5 differ from the
[answer key](../../evals/team-invites/answer-key.md)'s. The bugs are the same five.

## How it was run

Headless Claude Code (Opus) in a scratch repo holding only the skill and `demo/teamhub`, in two sessions:
`/stlc start` (phase 01, which stopped on the blocking seat-limit question), then `/stlc resume` for phases 02 to 12.

The human answers were given in the commands, for testing: the Free plan has 3 seats, use the suggested defaults,
accept the selection, approve the profile, and "go" at 08. Pushing was blocked, so the PR, ticket comment and bug
tickets are drafts in `12-report.md`.

## Independent checks

Run outside the agent with the [eval harness](../../evals/harness):

| Check | Result |
|---|---|
| The agent's tests on the demo app (5 planted bugs) | 34 pass, **12 fail** |
| The same tests on the fixed app | **46 / 46 pass**: 0 false alarms |
| The same tests on 5 versions of the app, each with exactly one planted bug | **Every bug caught** (B-1: 4 failing tests, B-2: 4, B-3: 1, B-4: 2, B-5: 1) |
| Phase 01 against the answer key (LLM judge) | 6 / 7 (K-5 and K-7 partial) |

## Things the agent found that nobody planted

- Emails are inserted into the page as raw HTML, from both the invite field and the `invite` URL parameter.
- Invite links carry no token: anyone who knows an invited email can join.

Neither is in the sources, so it wrote no tests for them and listed them in the report for a human.

## Cost

$17.02 with Claude Opus: phase 01 $0.59, phases 02 to 12 $16.43. About 28 minutes of agent time.
