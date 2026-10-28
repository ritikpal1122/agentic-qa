# Project profile: host-run5 (PayLite demo)
Status: approved
Sources: demo/e2e/README.md@sha256-13f1da50, demo/e2e/package.json@sha256-e7e54c3f, demo/e2e/playwright.config.ts@sha256-7d451924, demo/e2e/tsconfig.json@sha256-6b0335ca, demo/e2e/fixtures/wallet.ts@sha256-7786d178, demo/e2e/pages/BasePage.ts@sha256-d0494939, demo/e2e/utils/money.ts@sha256-61cfcc51, .github/workflows/demo-e2e.yml@sha256-730bab94, commit bbbb19a
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, "Approve the project profile in 06 as written", given in advance in the PAY-101 resume message)

Automation project: `demo/e2e/` (the only `playwright.config.*` in the repo). Product under test: `demo/app/index.html`.

| Topic | Convention | Learned from |
|---|---|---|
| Framework | Playwright `@playwright/test` 1.64.1, TypeScript 5.9.3 (strict, ES2022, commonjs, noEmit) | package.json, tsconfig.json |
| Test folder and naming | `demo/e2e/tests/<feature>/<name>.spec.ts` | README §Conventions, tests/smoke/app-loads.spec.ts |
| Test titles | Start with the case ID: `TC-7: balance must cover amount + fee` | README §Conventions |
| Tags | In the title: `@smoke`, `@regression`, ticket key (`@PAY-101`) | README §Conventions, app-loads.spec.ts |
| Locators | `getByTestId` first (the app has `data-testid` on every control), then `getByRole`. No CSS or XPath | README §Conventions, demo/app/index.html |
| Page objects | `pages/`, one class per screen, extend `BasePage`; locators as getters, user actions as methods; no assertions | README §Conventions, pages/BasePage.ts |
| Fixtures and setup | Wallet state only through `openWallet(page, { balance, sent, kyc, frozen })` (paise). Never build URLs in a test | README, fixtures/wallet.ts |
| State checks | After money moves, assert `walletState(page)` (balance, sentToday, ledger), not only the screen | README, fixtures/wallet.ts |
| Test data | Integer paise everywhere. Display text via `rupees(paise)` from `utils/money.ts` | README, utils/money.ts |
| Imports | `test`, `expect`, `openWallet` from `../../fixtures/wallet` (re-exports Playwright's) | app-loads.spec.ts, fixtures/wallet.ts |
| Auth | None. The app has no login | demo/app/index.html |
| Assertions | Web-first `expect(...).toHaveText(...)` | README, app-loads.spec.ts |
| Waiting | Never `waitForTimeout` | README §Conventions |
| Run locally | `cd demo/e2e && npm ci && npx playwright install chromium && npm test`; smoke: `npm run test:smoke`; one ticket: `npx playwright test --grep @PAY-101` | README §Run, package.json |
| Run in CI | `.github/workflows/demo-e2e.yml`: on push / PR touching `demo/**`, and `workflow_dispatch` with input `grep` (default `@smoke`). Push and PR runs only `@smoke`. Node 22, ubuntu, Chromium only, `CI=true` → 1 retry. Uploads `test-results` | .github/workflows/demo-e2e.yml, playwright.config.ts |
| Environments | `baseURL` http://localhost:4173; `webServer` runs `python3 -m http.server 4173 --directory ../app`; reuses a running server locally | playwright.config.ts |
| Reporters | `list` + JSON at `test-results/results.json`; trace and screenshot on failure | playwright.config.ts |
| Parallelism | `fullyParallel: true`; every test must stand alone | playwright.config.ts |
| Branch naming | Not found (one commit on `main`). Default: `test/<RUN-ID>-<name>` | git log |

## Reusable building blocks
| Kind | Name | File | What it does |
|---|---|---|---|
| Fixture | `openWallet(page, setup)` | fixtures/wallet.ts | Opens `/` with `balance`, `sent`, `kyc`, `frozen` URL params (paise) |
| Fixture | `walletState(page)` | fixtures/wallet.ts | Reads `window.__paylite`: `{ balance, sentToday, ledger[{reference, to, amount, fee}] }` |
| Types | `WalletSetup`, `WalletState` | fixtures/wallet.ts | Setup and state shapes |
| Page object | `BasePage` | pages/BasePage.ts | `balanceChip` (`balance`), `errorMessage` (`error`) |
| Util | `rupees(paise)` | utils/money.ts | `₹` + en-IN, 2 decimals (same formula as the app) |
| Util | `paise(rupees)` | utils/money.ts | `Math.round(rupees * 100)` |

## Things to be careful about
- **`demo/e2e/node_modules` is tracked in git as a symlink** to a folder outside this repo
  (`<local folder outside the repo>`), while `.gitignore` lists `node_modules/`.
  Local runs depend on that folder; CI runs `npm ci`, which may fail or replace the link. Worth fixing by the team (not by tests).
- `rupees()` uses the same formula as the app, so it can't catch a formatting bug in the app. For R-26 style checks
  (Indian grouping), write the expected text literally (e.g. `'₹1,00,000.00'`).
- `paise()` goes through floating point. Write paise as integer literals in tests instead.
- The setup hook (URL params) and `window.__paylite` are **test hooks in the product page**. Whether they exist in
  production is unknown (PAY-101 04 H-4). Tests in this repo depend on them by convention.
- CI on push/PR runs `@smoke` only; other tags need `workflow_dispatch` with `grep`.
- The app's send call is a 400 ms `setTimeout`; there is no network request to wait on. Wait on the success screen.
