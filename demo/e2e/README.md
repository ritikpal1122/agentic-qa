# PayLite E2E tests

Playwright tests for the PayLite web app (`../app`).

## Run
```
npm ci
npx playwright install chromium
npm test              # all tests
npm run test:smoke    # @smoke only
npx playwright test --grep @PAY-101
```
The config starts the app on http://localhost:4173.

## Conventions
- **Locators:** `getByTestId` first (the app has `data-testid` on every control), then `getByRole`. No CSS or XPath.
- **Page objects** in `pages/`, one class per screen, extending `BasePage`. Expose locators as getters and user actions as methods. No assertions inside page objects.
- **Wallet setup:** always through `openWallet(page, {...})` in `fixtures/wallet.ts`. Never build URLs in a test.
- **Money:** integer paise everywhere. When asserting displayed amounts, write the expected text literally (`'₹1,00,000.00'`). `rupees()` mirrors the app's own formatting, so it can't catch a formatting bug; use it only for logs and messages.
- **State checks:** after an action that moves money, assert `walletState(page)` (balance, ledger), not only the screen.
- **Files:** `tests/<feature>/<name>.spec.ts`. Titles start with the case ID: `TC-7: balance must cover amount + fee`.
- **Tags:** in the title: `@smoke`, `@regression`, and the ticket key, e.g. `@PAY-101`.
- **Waiting:** web-first assertions (`expect(...).toHaveText`). Never `waitForTimeout`.
