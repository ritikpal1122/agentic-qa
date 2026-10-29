# 11 Run: TEAM-42
Status: approved
Inputs: 10-code-review.md
Sources: branch test/TEAM-42-team-invites@9c3431e, build:demo/teamhub/app/index.html@0df62595
Updated: 2026-10-28
Approved-by: auto (gated mode; every failure classified)

## Progress
- [x] Full local run
- [x] Triage
- [x] Stability (3 runs)
- [x] Can-fail proof (mutations in a temporary copy)
- [x] Bug drafts
- [ ] Temporary copies deleted: **not done**. Deleting folders outside the repo needs Ritik's approval (see Notes)

## Where
Local only. Ritik said not to push, and the CI workflow needs a push to run `@TEAM-42`.
Command: `npx playwright test` (whole suite) from `demo/teamhub/e2e`, Chromium, Playwright 1.64.1, local web server
from `playwright.config.ts`. Reports: `demo/teamhub/e2e/test-results/results.json` (+ screenshots and traces of failures).

## Results
Full suite, 2026-10-28: **46 tests: 34 passed, 12 failed**. That is the 45 new tests plus the existing smoke test, which passes.
| Case | Result | Class | Evidence (failing assertion) |
|---|---|---|---|
| TC-3 | fail | product bug B-4 | send-invite.spec.ts:40, invite field visible to a Member |
| TC-4 | fail | product bug B-4 | send-invite.spec.ts:60, the Member's Revoke removed asha |
| TC-5 | fail | product bug B-1 | send-invite.spec.ts:74, no row exactly `asha@acme.test` (stored `Asha@Acme.test`) |
| TC-6 | fail | product bug B-1 | send-invite.spec.ts:88, "Already invited" not shown; case variant sent |
| TC-8 | fail | product bug B-1 | send-invite.spec.ts:115, "Already a member" not shown |
| TC-36 | fail | product bug B-1 | send-invite.spec.ts:203, second send in another case accepted |
| TC-13 | fail | product bug B-2 | seats.spec.ts:39, invite accepted at 3/3 (1 + 1 + 1 pending) |
| TC-16 | fail | product bug B-2 | seats.spec.ts:83, invite accepted at Pro 10/10 |
| TC-19 | fail | product bug B-2 | members-and-revoke.spec.ts:36, step 2, invite accepted at 3/3 |
| TC-37 | fail | product bug B-2 | seats.spec.ts:155, third UI invite accepted at 3/3 |
| TC-26 | fail | product bug B-3 | accept-invite.spec.ts:69, exactly 7 days accepted, no expiry message |
| TC-28 | fail | product bug B-5 | accept-invite.spec.ts:105, `asha@acme.test` added twice |
| all other new tests (33) + smoke | pass | — | results.json |

No test bugs, environment failures or flaky tests. The 12 failures are exactly the 12 tests marked `Targets: B-n`, each at
the bug's assertion. No new (unexpected) product bug was found.

## Stability (3 runs)
`npx playwright test --repeat-each=3`: 138 results. Every one of the 46 tests had the same outcome in all 3 runs:
34 × pass/pass/pass and 12 × fail/fail/fail at the same line.
The reviewer saw TC-5 and TC-37 fail at an earlier step under heavy machine load (10-code-review.md); that did not reproduce.

## Can-fail proof
The product code is reachable, so each mutation was one small change to `app/index.html` in a **temporary copy**
(never in the repo), running only the tests that guard that rule. The 12 tests already failing on product bugs were skipped.
| Mutation | Change | Guarding tests | Failed? |
|---|---|---|---|
| M1 | drop the pending-duplicate check | TC-7, TC-31 | yes, both |
| M2 | Free limit 3 → 4 | TC-12, TC-14, TC-30 | yes, all |
| M3 | revoke does nothing | TC-18, TC-20, TC-35 | yes, all |
| M4 | revoke clears every pending invite | TC-35 | yes |
| M5 | accept keeps the invite pending | TC-23, TC-24, TC-29, TC-33 | yes, all |
| M6 | accept adds the person as admin | TC-23 | yes |
| M7 | expiry 2 s shorter | TC-25 | yes |
| M8 | expiry 2 s longer | TC-27 | yes |
| M9 | Send invite not disabled while sending | TC-34 | **no**. The product still meets the rule TC-34 guards: the duplicate check answers "Already invited", so there's still one invite. Not a weak test; see M15 |
| M15 | M9 + drop the pending-duplicate check | TC-34 | yes |
| M10 | drop the already-a-member check | TC-9, TC-32 | yes, both |
| M11 | email regex without the dot part | TC-10 (9 rows) | the 3 dot-boundary rows failed; the other 6 are still invalid under this regex, so they correctly still pass |
| M12 | email regex accepts anything | TC-10 (9 rows) | yes, all 9 |
| M13 | seats used ignores pending | TC-1, TC-14, TC-15, TC-18 | yes, all |
| M14 | success message text changed | TC-1, TC-2, TC-11, TC-17 | yes, all |

Every passing **high-risk** test, and 31 of the 33 passing new tests overall, failed when the rule it guards was broken.
Not mutated: TC-21 and TC-22 (both low risk). Their exact-text assertions have not been shown to fail.

## Regression
- Existing `tests/smoke/app-loads.spec.ts`: pass (3/3).
- Regression areas A-1, A-2, A-5, A-6 through TC-30, TC-21, TC-15: pass (3/3).

## Bug drafts (not filed; outside writes need Ritik's yes)

### BUG-DRAFT-1: Invite emails are not lower-cased, so case variants slip past duplicate checks
Severity: high (seat accounting, duplicate invites) · Found by: TC-5, TC-6, TC-8, TC-36 · Requirement: R-10, R-12, R-13 (RFC-7 Rules "Email normalisation", PRD §4)
Steps: Free workspace with a pending invite for `asha@acme.test`; on Members, type `ASHA@acme.test`; press **Send invite**
Expected: "Already invited"; still one pending invite; `Seats 2 / 3`
Actual: "Invite sent to ASHA@acme.test"; two pending invites; `Seats 3 / 3`. Also `  Asha@Acme.test  ` is saved as `Asha@Acme.test`
Evidence: test-results/invites-send-invite-TC-6-*/test-failed-1.png, trace; run 2026-10-28 local
Likely cause: `sendInvite()` only calls `trim()` (index.html:69)

### BUG-DRAFT-2: Pending invites are not counted in the seat-limit check
Severity: high (plan limit / billing can be bypassed) · Found by: TC-13, TC-16, TC-19, TC-37 · Requirement: R-16, R-18 (PRD §3, RFC-7 "Seats used")
Steps: Free workspace, owner only; send `a1@acme.test`, then `a2@acme.test` (`Seats 3 / 3`); send `a3@acme.test`
Expected: "Seat limit reached. Upgrade to Pro to add more people."; 2 pending; `Seats 3 / 3`
Actual: invite sent; 3 pending; header shows `Seats 4 / 3`
Evidence: test-results/invites-seats-TC-37-*/test-failed-1.png, trace
Likely cause: the check uses `workspace.members.length >= seatLimit()` (index.html:73) instead of members + pending

### BUG-DRAFT-3: An invite link is still accepted at exactly 7 days
Severity: medium (expiry off by one at the boundary) · Found by: TC-26 · Requirement: R-26, R-27 (RFC-7 "Expiry", TEAM-42 AC-5)
Steps: open the invite for `asha@acme.test` sent exactly 604 800 s (7 days) ago; press **Join workspace**
Expected: "This invite has expired"; asha not a member; invite still pending
Actual: "You joined Acme"; asha is a member
Evidence: test-results/invites-accept-invite-TC-26-*/test-failed-1.png, trace
Likely cause: `now - invite.sentAt > SEVEN_DAYS_MS` (index.html:88) should be `>=`

### BUG-DRAFT-4: Members can see the invite form and revoke invites
Severity: high (permissions) · Found by: TC-3, TC-4 · Requirement: R-3, R-4 (PRD §2, RFC-7 "Role check")
Steps: open Members signed in as a Member, with a pending invite for `asha@acme.test`
Expected: no invite form; the Member can't revoke (asha stays pending, `Seats 3 / 3`)
Actual: the form and **Revoke** are shown; pressing Revoke removes asha (`Seats 2 / 3`)
Evidence: test-results/invites-send-invite-TC-3-*/, TC-4-*/
Likely cause: `role` is read (index.html:55) but never used. Server-side check (R-4) still needs API tests (API-1, API-2)

### BUG-DRAFT-5: Double click on Join workspace adds the person twice
Severity: high (data integrity) · Found by: TC-28 · Requirement: R-28 (RFC-7 "Accept is idempotent")
Steps: open a valid invite for `asha@acme.test`; double-click **Join workspace**
Expected: exactly one member `asha@acme.test` (2 members in total)
Actual: `asha@acme.test` appears twice (3 members)
Evidence: test-results/invites-accept-invite-TC-28-*/
Likely cause: the Join handler looks up the invite before the request and the button isn't disabled (index.html:158–161); `accept()` doesn't re-check

## Notes
- Temporary mutation folders are not deleted: removing folders outside the repo needs approval in this session. They hold only
  copies (no repo files changed): `<tmp>/stlc-mut-copy.KpB0psFQgo`,
  `…/stlc-mut-copy2.ORoYUtlkMJ`, `…/stlc-mut-script.Hanr0GemAY`.
- Product file hash after all runs: `0df62595` (unchanged). Working tree clean at `9c3431e`.
