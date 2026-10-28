# 05 Automation selection: PAY-101
Status: approved
Inputs: 02-impact.md, 03-design.md, 04-review.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, "For 05, accept your proposal as is", given in advance in the resume message)

## Progress
- [x] Level proposed for every case
- [x] Smoke set and tags proposed
- [x] Regression areas listed
- [x] Human decided

## Summary
E2E: 45 · API: 0 · Manual: 0 · Skip: 0 · Smoke set: TC-5, TC-16, TC-18, TC-23, TC-27

**No API to push down to.** The build is one static page (`demo/app/index.html`) with an in-page 400 ms simulated
call and no backend (02 N-3). The fee, range and limit rules live only in the Continue handler and `fee()`, so the
data-heavy cases (TC-12, TC-39, TC-40, TC-44) stay at E2E for now. They run as data rows in one test each and are
cheap here (no network, no login). **When the RFC-12 transfers API exists, move TC-12, TC-39 and the fee-only part of
TC-40 to API tests** and keep TC-11, TC-14, TC-15, TC-19 at E2E to prove the UI shows the right fee.

Every case is deterministic: state comes from setup (pending phase 06's decision on the URL hook, 04 H-4), there is
no real time, randomness or third-party page. The only waits are the bounded 1.5 s "nothing else happens" checks in
TC-17, TC-32, TC-35, TC-36, TC-41, TC-44, which the test-code rules allow inside a named helper.

Tags: every test `@PAY-101`; the smoke set also `@smoke`; all others `@regression`.
Smoke set: chosen to pass on a correct build and cover the main path plus one gate of each kind: range (TC-5),
confirm screen (TC-16), happy send (TC-18), balance exactly enough (TC-23), daily limit over by a paisa (TC-27).
The 10 bug-targeting cases (03 Summary) are left out of smoke on purpose, so a known product bug doesn't block every PR;
they run in `@regression`, and they are expected to be red until B-1 to B-5 are fixed.

## Selection
| Case | Title | Risk | Proposed | Decided | Why |
|---|---|---|---|---|---|
| TC-1 | "To" lists only saved contacts, name + last 4 | medium | E2E | E2E | What the user sees is the requirement (data exposure) |
| TC-2 | Continue disabled until contact + amount | low | E2E | E2E | UI state only; cheap |
| TC-3 | Balance chip, 2 decimals, Indian grouping | low | E2E | E2E | Text assertion, not visual; cheap |
| TC-4 | Min ₹1.00 accepted and sent | high | E2E | E2E | Money moves; boundary |
| TC-5 | ₹0.99 and ₹0.00 rejected | high | E2E | E2E | Boundary; **smoke** |
| TC-6 | Max ₹50,000.00 accepted and sent | high | E2E | E2E | Money moves; boundary |
| TC-7 | ₹50,000.01 rejected | high | E2E | E2E | Boundary |
| TC-8 | 2 decimals accepted | high | E2E | E2E | Parsing only reachable through the UI |
| TC-9 | 3 decimals rejected | high | E2E | E2E | Same |
| TC-10 | Non-numeric and negative rejected | high | E2E | E2E | Same; 2 data rows |
| TC-11 | Fee is 1% | high | E2E | E2E | Guards C-1 (1% vs 1.5%) on screen |
| TC-12 | Fee minimum ₹2.00 | high | E2E | E2E | Data rows; API candidate later |
| TC-13 | Fee at ₹200.00 switch point | high | E2E | E2E | Boundary |
| TC-14 | Fee above switch rounds up | high | E2E | E2E | Targets B-1 |
| TC-15 | Sub-half-paisa fraction rounds up | high | E2E | E2E | Targets B-1 |
| TC-16 | Confirm screen rows and button | medium | E2E | E2E | User journey; **smoke** |
| TC-17 | No money moves before confirm | medium | E2E | E2E | State across screens |
| TC-18 | Confirmed send: success, Ref, new balance | high | E2E | E2E | The core journey; **smoke** |
| TC-19 | New balance subtracts rounded-up fee | high | E2E | E2E | Targets B-1 end to end |
| TC-20 | Edit returns without sending | low | E2E | E2E | Navigation |
| TC-21 | After Edit, fee and total recalculated | high | E2E | E2E | Regression A-4 |
| TC-22 | After Edit, checks run again | high | E2E | E2E | Regression A-4 |
| TC-23 | Balance exactly amount + fee allowed | high | E2E | E2E | Money moves; boundary; **smoke** |
| TC-24 | Balance one paisa short rejected | high | E2E | E2E | Targets B-2 |
| TC-25 | Balance below amount rejected | high | E2E | E2E | Negative |
| TC-26 | Basic: exactly ₹10,000.00 allowed | high | E2E | E2E | Targets B-3 |
| TC-27 | Basic: one paisa over rejected | high | E2E | E2E | Regulatory limit; **smoke** |
| TC-28 | Full: exactly ₹1,00,000.00 allowed | high | E2E | E2E | Targets B-3 |
| TC-29 | Full: one paisa over rejected | high | E2E | E2E | Regulatory limit |
| TC-30 | Second send counts toward limit | high | E2E | E2E | Regression A-2 |
| TC-31 | Second send uses reduced balance | high | E2E | E2E | Regression A-2 |
| TC-32 | Frozen wallet cannot send | high | E2E | E2E | Targets B-4 |
| TC-33 | Balance before limit | medium | E2E | E2E | Check order |
| TC-34 | Range before balance | medium | E2E | E2E | Check order |
| TC-35 | Frozen first | medium | E2E | E2E | Targets B-4 |
| TC-36 | Double send makes one transfer | high | E2E | E2E | Targets B-5; mouse + keyboard rows |
| TC-37 | Chip shows new balance after send | low | E2E | E2E | Regression A-1 |
| TC-38 | Done → empty form, next send clean | low | E2E | E2E | Regression A-3 |
| TC-39 | Exact 1% fees get no extra paisa | high | E2E | E2E | 5 data rows; API candidate later |
| TC-40 | Whole, 1-decimal, float-prone amounts | high | E2E | E2E | 4 rows; fee part is an API candidate later |
| TC-41 | Frozen before range | medium | E2E | E2E | Targets B-4 |
| TC-42 | Deliberate second identical send works | high | E2E | E2E | Regression A-2; guards a bad B-5 fix |
| TC-43 | Earlier fees not counted in daily total | high | E2E | E2E | Provisional on Q-4 |
| TC-44 | Hostile / number-like amount text | high | E2E | E2E | Rendering (markup, dialog) only visible in the browser |
| TC-45 | After Edit, changed contact gets the money | medium | E2E | E2E | Regression A-4 |

## Regression areas to run
- A-1 Balance chip updates after a send (TC-37)
- A-2 Two sends in a row: reduced balance, increased daily total, deliberate repeat (TC-30, TC-31, TC-42, TC-43)
- A-3 Done → new send starts clean (TC-38)
- A-4 Edit → change amount or contact → recalculation and re-checks (TC-21, TC-22, TC-45)
Phase 07 maps these to any existing tests.

## Human decisions
- 2026-10-28, Ritik: "For 05, accept your proposal as is." Proposal taken unchanged. The answer was given in the
  resume message before this file was written, so it is recorded as an advance approval of this exact proposal.
