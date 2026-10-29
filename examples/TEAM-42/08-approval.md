# 08 Approval: TEAM-42
Status: approved
Inputs: 01-context.md, 02-impact.md, 03-design.md, 04-review.md, 05-selection.md, 06-codebase.md, 07-architecture.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, standing answer at resume: "At 08 my answer is go")

Readiness: 01–07 approved, none stale; Q-1 (the only blocking question) answered; project profile approved.

## What will be built
- 37 E2E tests in 4 files under `demo/teamhub/e2e/tests/invites/`, tagged `@TEAM-42` (+ `@smoke` on TC-1, TC-18, TC-23, TC-30; `@regression` on the rest)
- New: `pages/MembersPage.ts`, `pages/InvitePage.ts`; extended: `fixtures/workspace.ts` (+ `pauseClock`)
- Branch: `test/TEAM-42-team-invites` (local commits only; no push)

## What they prove
| Req | Risk | Cases |
|---|---|---|
| R-3/R-4 roles | high | TC-3, TC-4 |
| R-10/R-13 normalisation, duplicates | high | TC-5, TC-6, TC-7, TC-8, TC-36, TC-31, TC-34 |
| R-14/R-16/R-18 seat limit | high | TC-12, TC-13, TC-14, TC-16, TC-19, TC-37 |
| R-20 revoke frees seat | high | TC-18, TC-19, TC-35 |
| R-22 join | high | TC-23, TC-25, TC-33 |
| R-26/R-27 7-day expiry | high | TC-25, TC-26, TC-27 |
| R-28 idempotent accept | high | TC-28, TC-29 |
| medium/low (R-1, R-2, R-5–R-9, R-11, R-12, R-15, R-17, R-19, R-21, R-23–R-25) | — | the rest |

## Expected to fail (likely product bugs)
| Bug | Case | Why it will fail |
|---|---|---|
| B-1 | TC-5, TC-6, TC-8, TC-36 | Email is only trimmed, not lower-cased |
| B-2 | TC-13, TC-16, TC-19, TC-37 | Limit check counts members only |
| B-3 | TC-26 | `>` instead of `>=` at exactly 7 days |
| B-4 | TC-3, TC-4 | Role is ignored |
| B-5 | TC-28 | Join not guarded; both clicks add a member |

## Not automated
- API (suggested to the team): API-1 … API-6 (R-4 server half, accept-side normalisation, server expiry, retries)
- Not covered: revoked link (Q-3), expired-invite seat use (Q-4), two tabs, revoke during in-flight send, G-7, G-8

## Decisions made so far
- Q-1: Free = 3 (Ritik). Other questions: suggested defaults (Ritik). 02–06 approved through Ritik's standing answers.

## Risks
- CI can't run `@TEAM-42` without a push (not allowed): phase 11 runs locally only, Chromium.
- R-4 server half is not provable in this build.

## Go / no-go
Go (Ritik, 2026-10-28).
