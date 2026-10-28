# 07 Reuse & architecture: PAY-101
Status: approved
Inputs: 05-selection.md, 06-codebase.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, covered by the "go" at 08)

## Summary
Create 1 page object, 1 small util and 4 spec files; extend nothing; change no existing file. Reuse `openWallet`,
`walletState`, `BasePage` (`balanceChip`, `errorMessage`) and the fixture's `test`/`expect`. 0 of 45 cases are
already automated (the only test, `tests/smoke/app-loads.spec.ts`, checks the chip at ₹5,000.00; TC-3 needs
₹1,00,000.00 and grouping, so it isn't a duplicate).

## Files
| Action | File | What | Used by |
|---|---|---|---|
| create | pages/SendMoneyPage.ts | Extends `BasePage`. Locators for form, confirm and success; actions `chooseContact`, `enterAmount`, `continue`, `fillAndContinue`, `send`, `edit`, `done` | all |
| create | utils/clock.ts | `controlClock(page)` installs Playwright's clock before the page loads; `letLateEffectsLand(page)` advances it 1.5 s. Replaces the 03 "wait 1.5 s" steps without `waitForTimeout` (README) | TC-17, TC-32, TC-35, TC-36, TC-41, TC-44 |
| create | tests/send-money/form-and-amount.spec.ts | TC-1 to TC-10, TC-40, TC-44 | |
| create | tests/send-money/fee.spec.ts | TC-11 to TC-15, TC-39 | |
| create | tests/send-money/confirm-and-send.spec.ts | TC-16 to TC-22, TC-36, TC-37, TC-38, TC-42, TC-45 | |
| create | tests/send-money/money-rules.spec.ts | TC-23 to TC-35, TC-41, TC-43 | |
| extend | fixtures/wallet.ts | none needed: `openWallet` covers balance, sent, kyc, frozen; `walletState` has `ledger[].to` | |

Decisions:
- **Displayed money is asserted as literal text** (`'₹1,00,000.00'`), not `rupees(...)`. `rupees()` uses the app's own
  formula, so it can't catch an R-26 grouping bug, and 03 states every expected string. State checks use integer paise
  constants with the working in a comment (test-code-rules §Assertions 6). Deviation from README noted for review.
- **"Wait 1.5 s"** in 03 becomes `letLateEffectsLand(page)`: the app's send is a `setTimeout`, so advancing the fake
  clock by 1.5 s fires anything due in that window, deterministically. Tests that need it call `controlClock(page)` before `openWallet`.
- Data rows (TC-5, TC-10, TC-12, TC-36, TC-39, TC-40, TC-44) become one test per row in a `for` loop, title
  `TC-n: … [row]`, so each row passes or fails on its own.
- Screen visibility: the sections have no test id. "Confirm screen open" = `send` visible; "success screen" = `done`
  visible plus the "Money sent" text; "form shown" = `continue` visible.

## Case map
| Case | Level | Status | Test file | Building blocks |
|---|---|---|---|---|
| TC-1 to TC-10, TC-40, TC-44 | E2E | new | form-and-amount.spec.ts | openWallet, walletState, SendMoneyPage, clock (TC-44) |
| TC-11 to TC-15, TC-39 | E2E | new | fee.spec.ts | openWallet, SendMoneyPage |
| TC-16 to TC-22, TC-36 to TC-38, TC-42, TC-45 | E2E | new | confirm-and-send.spec.ts | openWallet, walletState, SendMoneyPage, clock (TC-17, TC-36) |
| TC-23 to TC-35, TC-41, TC-43 | E2E | new | money-rules.spec.ts | openWallet, walletState, SendMoneyPage, clock (TC-32, TC-35, TC-41) |

## Locators needed
All from `demo/app/index.html`.
| Page object | Element | Planned locator | Verified? |
|---|---|---|---|
| BasePage (reuse) | Balance chip | getByTestId('balance') | yes, existing smoke test passes |
| BasePage (reuse) | Error | getByTestId('error') | 09 |
| SendMoneyPage | To select | getByTestId('contact') | 09 |
| SendMoneyPage | Contact options with a value | contact select → getByRole('option') filtered to non-placeholder | 09 |
| SendMoneyPage | Amount | getByTestId('amount') | 09 |
| SendMoneyPage | Text inputs on the page | getByRole('textbox') | 09 |
| SendMoneyPage | Continue | getByTestId('continue') | 09 |
| SendMoneyPage | Confirm To / Amount / Fee / Total | getByTestId('c-to' / 'c-amount' / 'c-fee' / 'c-total') | 09 |
| SendMoneyPage | Send | getByTestId('send') | 09 |
| SendMoneyPage | Edit | getByTestId('edit') | 09 |
| SendMoneyPage | "Money sent" | getByText('Money sent', { exact: true }) | 09 |
| SendMoneyPage | Ref | getByTestId('ref') | 09 |
| SendMoneyPage | New balance | getByTestId('new-balance') | 09 |
| SendMoneyPage | Done | getByTestId('done') | 09 |

## Regression run
- All regression areas (A-1 to A-4): `npx playwright test --grep @PAY-101` (TC-21, TC-22, TC-30, TC-31, TC-37, TC-38, TC-42, TC-43, TC-45 are in it)
- Plus the existing smoke test: `npm run test:smoke`

## Branch
test/PAY-101-send-money
