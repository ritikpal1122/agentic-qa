# 07 Reuse and architecture: TEAM-42
Status: approved
Inputs: 05-selection.md, 06-codebase.md
Updated: 2026-10-28
Approved-by: covered by 08 approval (Ritik, 2026-10-28)

## Summary
4 spec files and 2 page objects to create, 1 fixture file to extend (one new export, no change to existing ones).
Reused as is: `openWorkspace`, `openInvite`, `workspaceState`, `BasePage` (seats, errorMessage, notice).
No selected case is already automated. The one existing test (`tests/smoke/app-loads.spec.ts`) checks `Seats 2 / 3`
with one extra member; TC-30 checks a different state (owner only, plan label, page errors), so it is not a duplicate.

## Files
| Action | File | What | Used by |
|---|---|---|---|
| create | pages/MembersPage.ts | extends BasePage; getters: workspaceName, plan, memberRows, pendingRows, pendingEmpty, inviteEmail, sendInviteButton; row helpers memberRow(email), memberRole(email, label), pendingRow(email), revokeButton(email); actions: sendInvite(email), revoke(email) | TC-1–TC-21, TC-30–TC-32, TC-34–TC-37 |
| create | pages/InvitePage.ts | extends BasePage; getters: heading, invitedEmail, joinButton; action: join() | TC-22–TC-29, TC-33 |
| extend | fixtures/workspace.ts | add `pauseClock(page)`: installs Playwright's fake clock at a fixed time and pauses it, before any `open*` call (README time rule: reach moments by setup, not waiting) | TC-28, TC-29, TC-34 |
| create | tests/invites/send-invite.spec.ts | TC-1–TC-11, TC-34, TC-36 | |
| create | tests/invites/seats.spec.ts | TC-12–TC-17, TC-31, TC-32, TC-37 | |
| create | tests/invites/members-and-revoke.spec.ts | TC-18–TC-21, TC-30, TC-35 | |
| create | tests/invites/accept-invite.spec.ts | TC-22–TC-29, TC-33 | |

## Case map
| Case | Level | Status | Test file | Building blocks |
|---|---|---|---|---|
| TC-1, TC-2, TC-5–TC-11, TC-36 | E2E | new | send-invite.spec.ts | openWorkspace, MembersPage, workspaceState |
| TC-3, TC-4 | E2E | new | send-invite.spec.ts | openWorkspace (`as: 'member'`), MembersPage |
| TC-34 | E2E | new | send-invite.spec.ts | pauseClock, openWorkspace, MembersPage |
| TC-12–TC-17, TC-31, TC-32, TC-37 | E2E | new | seats.spec.ts | openWorkspace, MembersPage |
| TC-18–TC-21, TC-35 | E2E | new | members-and-revoke.spec.ts | openWorkspace, MembersPage |
| TC-30 | E2E | new (not a duplicate of the smoke test, see Summary) | members-and-revoke.spec.ts | openWorkspace, MembersPage, `page.on('pageerror')` |
| TC-22–TC-27, TC-33 | E2E | new | accept-invite.spec.ts | openInvite, InvitePage, workspaceState |
| TC-28, TC-29 | E2E | new | accept-invite.spec.ts | pauseClock, openInvite, InvitePage, workspaceState |

## Locators needed
All from `demo/teamhub/app/index.html` (product source); verified on the live page in 09.
| Page object | Element | Planned locator | Source line |
|---|---|---|---|
| BasePage (existing) | Seats text / error / notice | getByTestId('seats' / 'error' / 'notice') | 96–97, 114 |
| MembersPage | Workspace name | getByRole('heading', { level: 1 }) | 113 |
| MembersPage | Plan label | getByTestId('plan') | 114 |
| MembersPage | Member rows | getByTestId('member-row') | 103 |
| MembersPage | Pending rows / empty | getByTestId('pending-row') / getByTestId('pending-empty') | 107, 110 |
| MembersPage | Row for an email | rows.filter({ has: getByText(email, { exact: true }) }) | 103, 107 |
| MembersPage | Revoke in a row | pendingRow(email).getByTestId('revoke') (identified by test id, not by link/button kind: F-32) | 108 |
| MembersPage | Email field / Send invite | getByTestId('invite-email') / getByTestId('invite-submit') | 120–121 |
| InvitePage | Heading | getByRole('heading', { level: 1 }) | 130 |
| InvitePage | Invited email | getByTestId('invite-for') | 131 |
| InvitePage | Join workspace | getByTestId('join') | 132 |

## Regression run
- `npx playwright test --grep @TEAM-42` (new tests, incl. TC-30, TC-21, TC-15 for A-1, A-2, A-5, A-6)
- `npx playwright test tests/smoke` (existing app-load smoke)
- Whole suite: `npm test`

## Branch
test/TEAM-42-team-invites
