# 10 Code review: TEAM-42
Status: approved
Inputs: 09-build.md
Updated: 2026-10-28
Approved-by: auto (gated mode; no blocker or major open)

## Progress
- [x] Round 1: independent sub-agent (inputs: branch diff, 03-design.md, project profile + README, test-code rules; not 09)
- [x] Fixes applied; changed parts re-checked by a separate pass; typecheck clean; re-run identical (33 pass, 12 expected fails)
- [x] Committed locally: `9c3431e` on test/TEAM-42-team-invites (not pushed)

## Findings
| ID | File:line | Finding | Severity | Fix | Outcome |
|---|---|---|---|---|---|
| CR-1 | tests/invites/seats.spec.ts (TC-14) | No `workspaceState` check after a successful send | major | Assert pending emails `[mia, asha]` | fixed |
| CR-2 | tests/invites/seats.spec.ts (TC-17) | No stored-state check; pending row count not asserted | major | Assert `pendingRows` = 1 and pending emails `[asha]` | fixed |
| CR-3 | seats.spec.ts (TC-37) | Step 3 UI rows only checked by count | minor | Assert rows `a1`, `a2` | fixed |
| CR-4 | members-and-revoke.spec.ts (TC-19) | Step 2 "pending only mia" checked in state only | minor | Assert the row on screen too | fixed |
| CR-5 | members-and-revoke.spec.ts (TC-30) | Plan and seats asserted separately, not as one header line | minor | — | rejected: deliberate; both parts are asserted exactly, and the separator `·` is layout, not a requirement |
| CR-6 | members-and-revoke.spec.ts (TC-21) | `boundingBox()!` would crash with a TypeError; `- 1` fudge | minor | Null checks + `>=` bottom edge | fixed |
| CR-7 | send-invite.spec.ts (TC-3) | Absence checked by test id, not by role + name | minor | — | rejected: test id is the profile's first locator; one locator per element (rules); TC-1 proves these test ids find the controls |
| CR-8 | several specs | Calculated seat values without a working comment | minor | Add `// seats = …` comments | fixed |
| CR-9 | 3 specs | `pendingEmails` helper copied; inline `import()` type | minor | Move to fixtures | fixed (`pendingEmails` in fixtures/workspace.ts). The message constant stays per spec: page objects hold locators and actions only |
| CR-10 | 4 tests | `@smoke` tags put TC-1, TC-18, TC-23, TC-30 into the CI gate | minor | — | rejected: smoke set was proposed and approved in 05 (Ritik). Note: all four pass on the current build |

## Reviewer notes (kept for 11)
- Under heavy machine load the reviewer saw TC-5 and TC-37 fail at an earlier step (the 400 ms response not arriving within
  the 5 s expect timeout) instead of at the bug. In isolation they fail exactly at the bug. Phase 11 checks this.
