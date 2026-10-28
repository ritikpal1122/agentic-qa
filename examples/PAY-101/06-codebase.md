# 06 Codebase understanding: PAY-101
Status: approved
Inputs: run.md
Sources: commit bbbb19a, demo/e2e/playwright.config.ts@sha256-7d451924, .github/workflows/demo-e2e.yml@sha256-730bab94
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, profile approved as written, in advance in the resume message)

## Progress
- [x] No profile existed; learned it from demo/e2e and the CI workflow
- [x] `.stlc/project-profile.md` written (first version)
- [x] Human approval of the profile

## Summary
Created the first project profile (`.stlc/project-profile.md`, from commit bbbb19a). Automation lives in `demo/e2e`:
Playwright 1.64.1 + TypeScript, `data-testid` locators, page objects extending `BasePage`, wallet setup only through
`openWallet()`, state checks through `walletState()`, integer paise, no `waitForTimeout`. `npx playwright --version`
and `npx playwright test --list` both work locally (1 existing test).

## What matters for this run
- **H-4 decided here:** tests use the URL setup params and `window.__paylite`, because the repo's written convention
  requires it (README: "Wallet setup: always through `openWallet`"; "assert `walletState(page)`"). Whether these hooks
  ship to production is still open (H-4). It doesn't change any expected result. Listed as a risk in 08.
- Contact ids in the ledger (`to`): `c_41` Aman Verma, `c_42` Priya Nair, `c_43` Kabir Shah (from `demo/app/index.html`
  L79–83). This is the "contact identifier" field TC-18, TC-42, TC-45 match on (R2-3).
- **CI:** `.github/workflows/demo-e2e.yml` exists. Push and PR run `@smoke` only; `@PAY-101` needs `workflow_dispatch`
  with `grep=@PAY-101`. Both need a push, which Ritik said not to do in this run. Phase 11 runs locally only.
- `demo/e2e/node_modules` is a git-tracked symlink to a folder outside the repo; local runs work through it. Flagged in
  the profile; not changed.
- `README` forbids `waitForTimeout`. The "wait 1.5 s to prove nothing else happens" steps in 03 need another way: see 07.
