# 11 Run: PAY-101
Status: approved
Inputs: 10-code-review.md
Sources: branch test/PAY-101-send-money@a563a67, build:demo/app/index.html@sha256-e153f86b
Updated: 2026-10-28
Approved-by: auto (gated mode; every failure classified)

## Progress
- [x] Full suite, local
- [x] Smoke selection (what CI runs on push / PR)
- [x] Every failure triaged
- [x] Stability: 3 runs
- [x] Can-fail proof: mutation check on temporary copies (deleted)
- [x] Bug drafts

## Where
**Local only.** Ritik said not to push, and CI (`.github/workflows/demo-e2e.yml`) needs a push or a
`workflow_dispatch` on a pushed branch. Commands, run in `demo/e2e` on macOS, Chromium, Playwright 1.64.1, 2026-10-28:
- `npx playwright test` (whole suite): **48 passed, 11 failed** (59 tests: 58 new + the existing smoke test)
- `npm run test:smoke` (the CI push/PR selection): **7 passed, 0 failed** (TC-5 ×2, TC-16, TC-18, TC-23, TC-27, app-loads)
- `npx playwright test --grep @PAY-101 --repeat-each=3`: **141 passed, 33 failed** (= 47 × 3 and 11 × 3)
Evidence: `demo/e2e/test-results/` (screenshot, trace and `error-context.md` per failing test; git-ignored, local).

## Results
| Case | Result | Class | Evidence |
|---|---|---|---|
| TC-1 to TC-13, TC-16 to TC-18, TC-20 to TC-23, TC-25, TC-27, TC-29 to TC-31, TC-33, TC-34, TC-37 to TC-40, TC-42 to TC-45 (47 tests) | pass | — | list output, all 3 repeats |
| TC-14 | fail | product bug B-1 → BUG-DRAFT-1 | `c-fee` "₹2.00", expected "₹2.01" |
| TC-15 | fail | product bug B-1 → BUG-DRAFT-1 | `c-fee` "₹2.50", expected "₹2.51" |
| TC-19 | fail | product bug B-1 → BUG-DRAFT-1 | button "Send ₹252.80" (soft), "New balance ₹4,747.20", expected ₹4,747.19 |
| TC-24 | fail | product bug B-2 → BUG-DRAFT-2 | `error` empty (confirm opened) at balance ₹101.99, expected "Insufficient balance" |
| TC-26 | fail | product bug B-3 → BUG-DRAFT-3 | "Daily limit exceeded" at exactly ₹10,000.00 |
| TC-28 | fail | product bug B-3 → BUG-DRAFT-3 | "Daily limit exceeded" at exactly ₹1,00,000.00 |
| TC-32 | fail | product bug B-4 → BUG-DRAFT-4 | frozen wallet: `error` empty, confirm opened |
| TC-35 | fail | product bug B-4 → BUG-DRAFT-4 | frozen wallet shows "Insufficient balance" |
| TC-41 | fail | product bug B-4 → BUG-DRAFT-4 | frozen wallet shows "Amount must be between ₹1 and ₹50,000" |
| TC-36 mouse | fail | product bug B-5 → BUG-DRAFT-5 | 2 ledger rows, each ₹1,000.00 + ₹10.00 fee, to c_42 |
| TC-36 keyboard | fail | product bug B-5 → BUG-DRAFT-5 | 2 ledger rows |

No test bugs, no environment failures, no flaky tests. Every failure is one of the 11 predicted in 08 and fails on
the assertion that targets its bug. No loop back to 09 was needed.

## Stability (3 runs)
| Case | 1 | 2 | 3 |
|---|---|---|---|
| All 47 passing tests | pass | pass | pass |
| All 11 bug-targeting tests | fail (same assertion) | fail (same) | fail (same) |

## Can-fail proof
Method: the product page is reachable, so each mutation made one small change to a **copy** of `demo/app/index.html`
in a git-ignored temporary folder (`.stlc/tmp-mutation/`). Each copy was served on its own port by Playwright, using a
temporary config (`demo/e2e/playwright.mutation.config.ts`, never committed), and only the guarding tests ran against it.
A baseline project on the unmutated copy reproduced the real results (TC-14 fail, TC-18 pass), so the tests were hitting
the copy. Both temporary items were deleted afterwards; `git status` is clean. **Result: 60 of 60 targeted test runs failed.**

| Mutation | Change made (in the copy) | Tests that had to fail | Failed? |
|---|---|---|---|
| m01 | min amount check `< 100` → `<= 100` | TC-4 | yes |
| m02 | `< 100` → `< 99` | TC-5 (₹0.99) | yes |
| m03 | `< 100` → `< 0` | TC-5 (₹0.00) | yes |
| m04 | max check `> 5000000` → `>= 5000000` | TC-6 | yes |
| m05 | `> 5000000` → `> 5000001` | TC-7, TC-34 | yes, yes |
| m06 | format regex `\d{1,2}` → `\d{1}` | TC-8 | yes |
| m07 | `\d{1,2}` → `\d{1,3}` | TC-9 | yes |
| m08 | regex allows `-`, lower bound removed | TC-10 (-5.00) | yes |
| m09 | fee rate 0.01 → 0.015 | TC-11, TC-16, TC-18, TC-21, TC-39 ×5 | all yes |
| m10 | fee `max(200, round)` → `max(199, floor)` | TC-12 ×2 | yes, yes |
| m11 | fee minimum 200 → 201 | TC-13 | yes |
| m12 | fee `round(x)` → `floor(x) + 1` | TC-11, TC-39 ×5 | all yes |
| m13 | debit `amount + fee` → `amount` | TC-4, TC-6, TC-18, TC-23, TC-37, TC-38, TC-40 ×4, TC-42, TC-45 | all yes |
| m14 | balance check removed | TC-22, TC-25, TC-31, TC-33 | all yes |
| m15 | daily limit check removed | TC-27, TC-29, TC-30 | all yes |
| m16 | `sentToday += amount` → `+= amount + fee` | TC-43 | yes |
| m17 | paise conversion `round` → `floor` | TC-40 (1.15, 4.35) | yes, yes |
| m18 | `\d{1,2}` → `\d{2}` | TC-40 (10.5) | yes |
| m19 | reference constant `'PL0'` | TC-42 | yes |
| m20 | rejected amount inserted as HTML | TC-44 (`<img…>`) | yes |
| m21 | format check and upper bound removed | TC-10 (abc), TC-44 ×3 | all yes |
| m22 | `sentToday` not updated after a send | TC-30 | yes |
| m23 | balance check uses opening balance | TC-31 | yes |
| m24 | auto-send 1 s after confirm opens | TC-17 (proves the clock helper catches delayed effects) | yes |
| m25 | contact label shows 9 digits | TC-1 | yes |

Every passing **high-risk** test failed under at least one mutation of the rule it guards. The 11 bug-targeting tests
already fail on the build, so they need no mutation. Passing **medium/low** tests not mutation-checked: TC-2, TC-3,
TC-20 (TC-16, TC-17, TC-33, TC-34, TC-37, TC-38, TC-45 were killed as side targets above).

## Regression
Selection from 07: `--grep @PAY-101` (A-1 TC-37; A-2 TC-30, TC-31, TC-42, TC-43; A-3 TC-38; A-4 TC-21, TC-22, TC-45)
plus `npm run test:smoke`. All regression-area tests pass; smoke 7/7.

## Bug drafts
Not created in any tracker. Drafts only (Ritik: nothing sent outside the repo).

### BUG-DRAFT-1: Fee is rounded to the nearest paisa instead of up
Severity: high (undercharges fees on every amount ≥ ₹200 whose 1% has a fraction under half a paisa) · Found by: TC-14, TC-15, TC-19 · Requirement: R-9 (RFC-12 Rules: fee rounded up)
Steps: wallet ₹5,000.00; pick Priya Nair; amount 250.30; Continue; Send
Expected: Fee ₹2.51, Total ₹252.81, button "Send ₹252.81", "New balance ₹4,747.19"
Actual: Fee ₹2.50, Total ₹252.80, "New balance ₹4,747.20". Same at ₹200.01 (₹2.00, expected ₹2.01)
Evidence: `demo/e2e/test-results/send-money-fee-Fee-TC-15-*/`, `…TC-14-*/`, `send-money-confirm-and-sen-34f38-*/` (TC-19); local run 2026-10-28 @a563a67
Likely cause: `fee()` uses `Math.round` (index.html L91)

### BUG-DRAFT-2: Send allowed when balance covers the amount but not the fee
Severity: high (wallet can go negative) · Found by: TC-24 · Requirement: R-15 (PRD §4, RFC-12 Rules)
Steps: wallet balance ₹101.99; pick Priya Nair; amount 100.00; Continue
Expected: "Insufficient balance"; no confirm screen; balance unchanged
Actual: no error; confirm screen opens with Total ₹102.00 (sending would leave −₹0.01)
Evidence: `demo/e2e/test-results/send-money-money-rules-Bal-6ff7c-*/`; local run 2026-10-28
Likely cause: check is `amount > balance`, not `amount + fee > balance` (L122)

### BUG-DRAFT-3: Send that lands exactly on the daily limit is blocked
Severity: high (blocks a payment the PRD allows; both KYC tiers) · Found by: TC-26, TC-28 · Requirement: R-18 (PRD §5 "can go up to", RFC-12 "≤")
Steps: KYC basic, sent today ₹6,000.00, balance ₹5,000.00; pick Priya Nair; amount 4000.00; Continue
Expected: confirm opens (₹6,000.00 + ₹4,000.00 = ₹10,000.00 ≤ limit); after Send "New balance ₹960.00"
Actual: "Daily limit exceeded". Same for KYC full at exactly ₹1,00,000.00
Evidence: `demo/e2e/test-results/send-money-money-rules-Dai-c3c6a-*/`, `…Dai-504d1-*/`; local run 2026-10-28
Likely cause: `>=` instead of `>` (L123). Expected result is provisional on Q-4 (fee not counted)

### BUG-DRAFT-4: Frozen wallet is not blocked
Severity: high (frozen accounts can move money) · Found by: TC-32, TC-35, TC-41 · Requirement: R-20, R-21 (PRD §8, RFC-12 `ACCOUNT_FROZEN`, check order)
Steps: wallet frozen, balance ₹5,000.00; pick Priya Nair; amount 100.00; Continue
Expected: blocked at Continue with a frozen-specific error (text not yet defined, Q-2); no transfer
Actual: no error; confirm screen opens. With other failing rules, their errors show instead of frozen (TC-35: "Insufficient balance"; TC-41: range error)
Evidence: `demo/e2e/test-results/send-money-money-rules-Fro-bb54a-*/`, `…Fro-af2c3-*/`, `…Fro-9f30f-*/`; local run 2026-10-28
Likely cause: `frozen` read from setup but never checked. Block point provisional on Q-10

### BUG-DRAFT-5: Double click or double Enter on Send creates two transfers
Severity: high (duplicate debit) · Found by: TC-36 (mouse, keyboard) · Requirement: R-25 (RFC-12 idempotency)
Steps: wallet ₹5,000.00; pick Priya Nair; amount 1000.00; Continue; click Send twice quickly (or press Enter twice)
Expected: one transfer; "New balance ₹3,990.00"
Actual: two ledger rows of ₹1,000.00 + ₹10.00; balance ₹2,980.00
Evidence: `demo/e2e/test-results/send-money-confirm-and-sen-fc4fd-*/`, `…f7490-*/`; local run 2026-10-28
Likely cause: Send not disabled during the 400 ms call; no idempotency key (L137–150). UI expectation is provisional on Q-5
