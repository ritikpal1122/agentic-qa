# 10 Code review: PAY-101
Status: approved
Inputs: 09-build.md
Updated: 2026-10-28
Approved-by: auto (gated mode)

## Progress
- [x] Round 1: independent sub-agent (given only the new code, 03-design.md, the profile and the test-code rules; not the build notes)
- [x] Fixes applied (loop 10 → 09: attempt 1 of 3)
- [x] Round 2: changed parts re-checked, full `@PAY-101` re-run
- [x] Committed locally (see Commit)

## Summary
Round 1: 0 blockers, 3 majors, 7 minors. All 3 majors and 6 minors fixed; 1 minor accepted with a comment (F-9).
The reviewer ran the suite on its own: 47 pass, 11 fail, and the 11 are exactly the bug-targeting cases, each failing on
its spec assertion. It judged the clock helper sound for this app and the literal money strings correct.
Round 2: re-run after the fixes, same result (47 pass, 11 expected fails). TC-36 mouse still fails on "2 transfers",
not on a click error, so the new second-click method still catches B-5.

## Findings
| ID | File:line | Finding | Severity | Fix | Outcome |
|---|---|---|---|---|---|
| F-1 | confirm-and-send.spec.ts (TC-19) | Money moves; only the screen text checked, no `walletState` | major | Assert ledger 1, balance 474719 (500000 − 25030 − 251) | fixed |
| F-2 | confirm-and-send.spec.ts (TC-37) | Send checked only through the chip | major | Assert ledger 1, balance 399000 | fixed |
| F-3 | confirm-and-send.spec.ts (TC-38) | First send's stored state never checked | major | After Done: ledger 1, balance 489800 | fixed |
| F-4 | confirm-and-send.spec.ts (TC-42) | Stored balance after two sends not checked | minor | Assert balance 298000 | fixed |
| F-5 | confirm-and-send.spec.ts (TC-45) | Ledger row amount, fee and stored balance not checked | minor | `toMatchObject` with amount and fee; balance 399000 | fixed |
| F-6 | confirm-and-send.spec.ts (TC-36) | `reference` count 1 can't fail (one static element) | minor | Removed; Ref-equals-record check stays | fixed |
| F-7 | confirm-and-send.spec.ts (TC-36 mouse) | Race between `isVisible()` and the forced click could throw on a hidden button | minor | Second click via `dispatchEvent('click')` | fixed |
| F-8 | form-and-amount.spec.ts (TC-44) | `getByRole('img')` defined in the test | minor | Moved to `SendMoneyPage.images` | fixed |
| F-9 | SendMoneyPage.ts `contactOptions` | Placeholder excluded by its text, not by empty value | minor | Filtering by value needs a CSS selector (not allowed by the profile). Comment added | accepted |
| F-10 | SendMoneyPage.ts `moneySent` | `getByText` is outside the profile's locator order, with no comment | minor | Comment: no test id or role exists | fixed |

Also from the review: added a line to `utils/clock.ts` saying the clock doesn't cover real network calls.
Suggested for the team (not done, outside this run's files): a note in `demo/e2e/README.md` that literal strings beat
`rupees()` for grouping checks.

## Rounds
- Round 1: 0 blockers, 3 majors, 7 minors → majors fixed, 6 minors fixed, 1 accepted
- Round 2 (changed lines only + full run): no new findings

## Commit
`a563a67` "test(PAY-101): E2E tests for send money (45 cases, 58 tests)" on `test/PAY-101-send-money`. Local only, not pushed.
