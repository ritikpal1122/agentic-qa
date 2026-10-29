# 05 Automation selection: TEAM-42
Status: approved
Inputs: 02-impact.md, 03-design.md, 04-review.md
Updated: 2026-10-28
Approved-by: Ritik (standing answer 2026-10-28: "For 05, accept your proposal as is")

## Summary
E2E: 37 · API: 0 written here (API-1 … API-6 are suggested to the team, see below) · Manual: 0 · Skip: 0
Smoke set: TC-30, TC-1, TC-18, TC-23

The demo app has no API the tests can reach: every rule runs in the browser (S-4, 02 CH-8). So the data-heavy checks
(TC-10, the seat boundaries) stay at E2E even though API would be the better fit in a real product. They are cheap here:
one static page, URL-param setup, no accounts, and about 0.5 s per case.

## Selection
| Case | Title | Risk | Proposed | Decided | Why |
|---|---|---|---|---|---|
| TC-1 | Owner sends an invite | medium | E2E @smoke | E2E @smoke | Core journey; user-visible message and list |
| TC-2 | Admin sends an invite | medium | E2E | E2E | Role variant of the core journey |
| TC-3 | Member does not see the form | high | E2E | E2E | Permission shown in the UI; targets B-4 |
| TC-4 | Member cannot revoke | high | E2E | E2E | Only reachable check of R-4 in this build; targets B-4 |
| TC-5 | Trim + lower-case before saving | high | E2E | E2E | No API; targets B-1 |
| TC-6 | Case variant of pending = Already invited | high | E2E | E2E | No API; targets B-1 |
| TC-7 | Exact duplicate pending | high | E2E | E2E | No API |
| TC-8 | Case variant of member = Already a member | high | E2E | E2E | No API; targets B-1 |
| TC-9 | Exact member duplicate | medium | E2E | E2E | No API |
| TC-10 | Invalid addresses (9 inputs) | medium | E2E (data-driven) | E2E (data-driven) | Would be API in a real product; no API here, and each run is under 1 s |
| TC-11 | Shortest valid address | medium | E2E | E2E | Boundary partner of TC-10 |
| TC-12 | Free at limit, members only | high | E2E | E2E | Upgrade gate is user-visible |
| TC-13 | Free at limit via pending | high | E2E | E2E | Targets B-2 |
| TC-14 | Free one below limit | high | E2E | E2E | Boundary partner |
| TC-15 | Pro header counts pending | medium | E2E | E2E | Header shown to user; regression A-5 |
| TC-16 | Pro at limit via pending | high | E2E | E2E | Targets B-2 |
| TC-17 | Pro one below limit | medium | E2E | E2E | Boundary partner |
| TC-18 | Revoke frees the seat | high | E2E @smoke | E2E @smoke | Core action on the Members screen |
| TC-19 | Freed seat usable at once | high | E2E | E2E | State transition; targets B-2 |
| TC-20 | Admin can revoke | medium | E2E | E2E | Positive control for TC-4's locator |
| TC-21 | Members with roles, then pending | low | E2E | E2E | Regression A-2; cheap |
| TC-22 | Invite page content | low | E2E | E2E | Cheap; first screen of the invitee journey |
| TC-23 | Valid join | high | E2E @smoke | E2E @smoke | Core invitee journey |
| TC-24 | Accept keeps seats used | medium | E2E | E2E | Seat accounting |
| TC-25 | 1 s before 7 days | high | E2E | E2E | Deterministic: frozen clock + `age` |
| TC-26 | Exactly 7 days | high | E2E | E2E | Targets B-3 |
| TC-27 | 1 s after 7 days | high | E2E | E2E | Boundary partner |
| TC-28 | Double click Join | high | E2E | E2E | Targets B-5; deterministic with a paused clock |
| TC-29 | Join again after joining | high | E2E | E2E | Repeat action; controlled clock |
| TC-30 | Members screen loads | low | E2E @smoke | E2E @smoke | Regression A-1/A-6 |
| TC-31 | At limit, pending duplicate | medium | E2E | E2E | Error order (Q-5) |
| TC-32 | At limit, member duplicate | medium | E2E | E2E | Error order (Q-5) |
| TC-33 | Full workspace accepts invite | high | E2E | E2E | Journey across the seat rule |
| TC-34 | Double Send invite | high | E2E | E2E | Repeat action; controlled clock |
| TC-35 | Revoke one of two | medium | E2E | E2E | State |
| TC-36 | Duplicate after case-variant send | high | E2E | E2E | Targets B-1 |
| TC-37 | Fill Free plan through the UI | high | E2E | E2E | Targets B-2 |

Tags: every test `@TEAM-42`; smoke set also `@smoke`; all others `@regression`.

Suggested to the team at API level (not built in this run; no server in the demo): API-1 … API-6 from 03.

## Regression areas to run
- Members screen loads and shows plan and seats (02 A-1, A-5, A-6)
- Members list shows each person with their role (02 A-2)
- App loads without script errors on both views (02 A-6)

## Human decisions
- 2026-10-28, Ritik: proposal accepted as is (standing answer given at resume).
