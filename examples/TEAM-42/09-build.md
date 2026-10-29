# 09 Build: TEAM-42
Status: approved
Inputs: 07-architecture.md, 08-approval.md
Updated: 2026-10-28
Approved-by: auto (gated mode; phase 10 code review is the check)

## Progress
- [x] pages/MembersPage.ts
- [x] pages/InvitePage.ts
- [x] fixtures/workspace.ts (+ pauseClock)
- [x] tests/invites/send-invite.spec.ts
- [x] tests/invites/seats.spec.ts
- [x] tests/invites/members-and-revoke.spec.ts
- [x] tests/invites/accept-invite.spec.ts
- [x] Typecheck (`npm run typecheck`: clean)
- [x] First run (fix attempts used: 0)

## Branch
test/TEAM-42-team-invites (from main @ 032e395)

## Files
| Action | File | Cases |
|---|---|---|
| create | demo/teamhub/e2e/pages/MembersPage.ts | all Members-screen cases |
| create | demo/teamhub/e2e/pages/InvitePage.ts | TC-22–TC-29, TC-33 |
| extend | demo/teamhub/e2e/fixtures/workspace.ts | `pauseClock` for TC-28, TC-29, TC-34 (existing exports unchanged) |
| create | demo/teamhub/e2e/tests/invites/send-invite.spec.ts | TC-1–TC-11, TC-34, TC-36 (TC-10 = 9 tests) |
| create | demo/teamhub/e2e/tests/invites/seats.spec.ts | TC-12–TC-17, TC-31, TC-32, TC-37 |
| create | demo/teamhub/e2e/tests/invites/members-and-revoke.spec.ts | TC-18–TC-21, TC-30, TC-35 |
| create | demo/teamhub/e2e/tests/invites/accept-invite.spec.ts | TC-22–TC-29, TC-33 |

37 cases → 45 Playwright tests (TC-10 runs once per invalid input).

## Locators verified
Verified by running the tests against the live page (no browser MCP tool available): every locator below
resolved in at least one passing test, with no "not found" or strict-mode errors in any test.
| Element | Locator | How verified | Result |
|---|---|---|---|
| Workspace name | getByRole('heading', { level: 1 }) | TC-30 passes ("Acme") | ok |
| Plan label | getByTestId('plan') | TC-30 ("Free plan") | ok |
| Members list / Pending list | getByTestId('members') / ('pending') | TC-21 bounding boxes | ok |
| Member row by email + role | member-row filtered by exact text; getByText(role, exact) | TC-21, TC-30 | ok |
| Pending row by email | pending-row filtered by exact text | TC-1, TC-14, TC-35 | ok |
| Pending empty | getByTestId('pending-empty') | TC-9, TC-18 | ok |
| Revoke in row | pendingRow(email).getByTestId('revoke') | TC-18, TC-20, TC-35 | ok |
| Email field / Send invite | getByTestId('invite-email') / ('invite-submit') | TC-1, TC-2 | ok |
| Invite heading / email / Join | heading level 1 / invite-for / join | TC-22 | ok |
| Seats / error / notice (BasePage, existing) | getByTestId | many | ok |
| Paused clock | `pauseClock` | TC-28 sees no message before `runFor`, then both responses; TC-29, TC-34 pass | ok |

## First run
`npx playwright test --grep @TEAM-42`, 2026-10-28, local Chromium: **33 passed, 12 failed** (33.7 s).
Every failure is a case marked `Targets: B-n`, failing on the assertion the bug predicts. Every non-targeting case passed.
| Case | Result | Why |
|---|---|---|
| TC-3 | fail (expected) | Invite form visible to a Member: B-4 |
| TC-4 | fail (expected) | Member's Revoke worked; asha no longer pending: B-4 |
| TC-5 | fail (expected) | No pending row exactly `asha@acme.test` (saved as `Asha@Acme.test`): B-1 |
| TC-6 | fail (expected) | "Already invited" never shown; the case variant was sent: B-1 |
| TC-8 | fail (expected) | "Already a member" never shown: B-1 |
| TC-36 | fail (expected) | Second send with a different case accepted: B-1 |
| TC-13 | fail (expected) | Seat-limit error never shown at 3/3 via pending: B-2 |
| TC-16 | fail (expected) | Same at Pro 10/10: B-2 |
| TC-19 | fail (expected) | Step 2: send at 3/3 accepted: B-2 |
| TC-37 | fail (expected) | Third UI send accepted at 3/3: B-2 |
| TC-26 | fail (expected) | "This invite has expired" not shown at exactly 7 days (invitee joined): B-3 |
| TC-28 | fail (expected) | Members contain `asha@acme.test` twice: B-5 |
| other 33 tests | pass | |

## Not automated
- none of the selected cases; API-1 … API-6 and the Not-covered items in 03 were never selected.
