# 09 Build: PAY-101
Status: approved
Inputs: 07-architecture.md, 08-approval.md
Updated: 2026-10-28
Approved-by: auto (gated mode)

## Progress
- [x] Branch test/PAY-101-send-money
- [x] pages/SendMoneyPage.ts
- [x] utils/clock.ts
- [x] tests/send-money/checks.ts (not in the 07 plan: shared "no transfer" check, see Files)
- [x] tests/send-money/form-and-amount.spec.ts
- [x] tests/send-money/fee.spec.ts
- [x] tests/send-money/confirm-and-send.spec.ts
- [x] tests/send-money/money-rules.spec.ts
- [x] Type check (new files clean)
- [x] First run. Fix attempts: 0 (no failure came from a test)

## Branch
test/PAY-101-send-money (from main @ bbbb19a). Committed after review as a563a67 (see 10). Not pushed.
Review fixes (10) changed TC-19, TC-36 to TC-38, TC-42, TC-44, TC-45 and `SendMoneyPage`; the First run below is before them, and 11 has the runs after.

## Files
| Action | File | Cases |
|---|---|---|
| create | demo/e2e/pages/SendMoneyPage.ts | all |
| create | demo/e2e/utils/clock.ts | TC-17, TC-32, TC-35, TC-36, TC-41, TC-44 |
| create | demo/e2e/tests/send-money/checks.ts | `expectNoTransfer`, `CONTACT_ID`, `KNOWN_ERRORS`; used by 3 spec files. Added to avoid copying the 03 "no transfer" check into every file. Not a spec file, so the runner doesn't collect it |
| create | demo/e2e/tests/send-money/form-and-amount.spec.ts | TC-1 to TC-10, TC-40, TC-44 (19 tests) |
| create | demo/e2e/tests/send-money/fee.spec.ts | TC-11 to TC-15, TC-39 (11 tests) |
| create | demo/e2e/tests/send-money/confirm-and-send.spec.ts | TC-16 to TC-22, TC-36, TC-37, TC-38, TC-42, TC-45 (13 tests) |
| create | demo/e2e/tests/send-money/money-rules.spec.ts | TC-23 to TC-35, TC-41, TC-43 (15 tests) |

45 cases → 58 tests (data rows: TC-5 ×2, TC-10 ×2, TC-12 ×2, TC-36 ×2, TC-39 ×5, TC-40 ×4, TC-44 ×3).
No existing file changed. No product code changed.

## Locators verified
Method: no browser MCP tool here, so verified by running the tests (09 step 3, option 2). Every locator is used by at
least one **passing** test, and no run showed "not found" or "strict mode violation".
| Element | Locator | How verified | Result |
|---|---|---|---|
| To select | getByTestId('contact') | TC-1, TC-2 pass | 1 element |
| Contact options | contact → getByRole('option') without placeholder | TC-1 pass (exactly 3, in order) | ok |
| Text inputs | getByRole('textbox') | TC-1 pass (count 1, is `amount`) | ok |
| Amount | getByTestId('amount') | TC-38 pass | 1 element |
| Continue | getByTestId('continue') | TC-2 pass | 1 element |
| Confirm To / Amount / Fee / Total | getByTestId('c-to' / 'c-amount' / 'c-fee' / 'c-total') | TC-16 pass | 1 each |
| Send | getByTestId('send') | TC-16, TC-18 pass | 1 element |
| Edit | getByTestId('edit') | TC-20 pass | 1 element |
| "Money sent" | getByText('Money sent', { exact: true }) | TC-18 pass | 1 element |
| Ref | getByTestId('ref') | TC-18 pass | 1 element |
| New balance | getByTestId('new-balance') | TC-18 pass | 1 element |
| Done | getByTestId('done') | TC-37 pass | 1 element |
| Error (BasePage) | getByTestId('error') | TC-24 / TC-27 pass and fail with the right text | 1 element |

## Self-check
- `npx tsc -p . --skipLibCheck`: no errors in new files. The only errors are in the existing `playwright.config.ts`
  (`process` unknown: the repo has no `@types/node`). Without `--skipLibCheck`, Playwright's own types fail for the
  same reason. Existing problem, not touched.

## First run
`npx playwright test --grep @PAY-101` (local, Chromium, 2026-10-28): **47 passed, 11 failed**. All 11 failures are
the planned bug-targeting cases, each failing at the assertion that targets the bug:
| Case | Result | Why |
|---|---|---|
| TC-14 | fail (expected) | Fee shows ₹2.00, spec ₹2.01: B-1 |
| TC-15 | fail (expected) | Fee shows ₹2.50, spec ₹2.51: B-1 |
| TC-19 | fail (expected) | Button "Send ₹252.80" (soft) and "New balance ₹4,747.20", spec ₹4,747.19: B-1 |
| TC-24 | fail (expected) | No error at balance ₹101.99 (confirm opens): B-2 |
| TC-26 | fail (expected) | "Daily limit exceeded" at exactly ₹10,000.00: B-3 |
| TC-28 | fail (expected) | "Daily limit exceeded" at exactly ₹1,00,000.00: B-3 |
| TC-32 | fail (expected) | Frozen wallet: no error, confirm opens: B-4 |
| TC-35 | fail (expected) | Frozen wallet shows "Insufficient balance": B-4 |
| TC-41 | fail (expected) | Frozen wallet shows the range error: B-4 |
| TC-36 mouse | fail (expected) | 2 ledger rows (PL…820, PL…871), each ₹1,000.00 + ₹10.00: B-5 |
| TC-36 keyboard | fail (expected) | 2 ledger rows: B-5 |
All other 47 pass, including every non-targeting case.

## Not automated
- None. Every selected case has a test.
