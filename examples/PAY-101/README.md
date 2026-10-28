# Example run: PAY-101 (PayLite "Send money")

A complete run of the skill, phases 01 to 12, on the [demo](../../demo). Every file here was written by the agent.

| File | Phase |
|---|---|
| [run.md](run.md) | Run settings (profile, mode, domain pack) |
| [01-context.md](01-context.md) | Requirements with sources, the fee conflict, 5 likely bugs, the prompt injection it refused |
| [02-impact.md](02-impact.md) | Changes, blast radius, risk per requirement |
| [03-design.md](03-design.md) | 45 test cases with exact data and working |
| [04-review.md](04-review.md) | Persona review: 3 blockers found and fixed, 7 cases added |
| [05-selection.md](05-selection.md) | What to automate, at which level |
| [06-codebase.md](06-codebase.md), [project-profile.md](project-profile.md) | What it learned about the automation repo |
| [07-architecture.md](07-architecture.md) | Files to create, reuse of `BasePage` and the wallet fixture |
| [08-approval.md](08-approval.md) | The one-page go/no-go |
| [09-build.md](09-build.md), [10-code-review.md](10-code-review.md) | Build notes, independent review |
| [11-run.md](11-run.md) | Results, triage, 3× stability, mutation checks, 5 bug drafts |
| [12-report.md](12-report.md) | Traceability, verdict, PR / Jira / bug drafts (not sent) |
| [generated/](generated) | The test code it wrote: a page object, 4 spec files, helpers |

## How it was run

Headless Claude Code (`claude -p "/stlc ..."`) in a scratch copy of this repo, in four sessions:
`start` → `resume` (02) → `resume` (02 rework, 03, 04) → `resume` (05 to 12). Each session started with no memory
and continued from the files.

The human answers were given in the commands, for testing: the fee is 1% with a ₹2 minimum, turn on the fintech pack,
use the suggested defaults, accept the selection, and "go" at 08. Pushing and sending were blocked, so the PR,
Jira comment and bug tickets are drafts in `12-report.md`.

## Independent checks

These were run outside the agent, on its generated tests:

| Check | Result |
|---|---|
| Run the tests on the demo app (5 planted bugs) | 48 pass, **11 fail, every failure is one of the 5 planted bugs** |
| Fix the 5 bugs in a copy of the app, run again | **59 / 59 pass**, so the expected values are right |
| Score phase 01 against the [answer key](../../evals/send-money/answer-key.md) | 7 / 7 |

## Known notes in the artifacts

- `06-codebase.md`, `08-approval.md` and `12-report.md` mention a `node_modules` symlink. That came from the test
  setup (dependencies were linked to save time), not from the demo repo.
- The run found two real issues in the demo repo (no `@types/node`, and a money-formatting convention that couldn't
  catch formatting bugs). Both were fixed in `demo/e2e` afterwards.

## Cost

About **$13** in total for the four sessions with Claude Opus (phase 03+04 with persona sub-agents about $5,
phases 05 to 12 with 195 turns about $7). Time: about 45 minutes of agent work.
