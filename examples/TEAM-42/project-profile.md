# Project profile: team-run1 (TeamHub demo)
Status: approved
Sources: demo/teamhub/e2e/README.md@f274127d, package.json@1355f712, playwright.config.ts@22a3e6e9, fixtures/workspace.ts@3ac8fc09, pages/BasePage.ts@304b43ab, .github/workflows/demo-e2e.yml@11e085e9, commit 032e395
Updated: 2026-10-28
Approved-by: Ritik (standing answer 2026-10-28: "Approve the project profile in 06 as written")

Automation project: `demo/teamhub/e2e/` (the only `playwright.config.*` in the repo). No CLAUDE.md, AGENTS.md or CONTRIBUTING.

| Topic | Convention | Learned from |
|---|---|---|
| Framework | Playwright 1.64.1, TypeScript 5.9.3 (strict, commonjs, noEmit), Node 22 | package.json, tsconfig.json, workflow |
| Test folder and naming | `tests/<feature>/<name>.spec.ts` | README §Conventions, playwright.config.ts `testDir` |
| Test titles | Start with the case ID: `TC-3: invite is refused when seats are full` | README §Conventions |
| Tags | In the title: `@smoke`, `@regression`, ticket key (`@TEAM-42`) | README §Conventions |
| Locators | `getByTestId` first (every control has `data-testid`), then `getByRole`; no CSS/XPath | README §Conventions |
| Page objects | `pages/`, one class per screen, extend `BasePage`; locators as getters, user actions as methods; no assertions | README, pages/BasePage.ts |
| Fixtures and setup | `openWorkspace(page, { plan, as, members, pending })`, `openInvite(page, email, ageSeconds, setup)`; never build URLs in a test | README, fixtures/workspace.ts |
| Test data | Per-test, through the setup objects above; emails on `acme.test` | fixtures/workspace.ts, smoke test |
| Auth | None; signed-in role via `as` | fixtures/workspace.ts |
| Assertions | Web-first (`toHaveText`); after a change, assert `workspaceState(page)` too | README §Conventions |
| Time | App clock frozen at page load; reach a moment via invite age, never by waiting | README §Conventions |
| Waiting | Never `waitForTimeout` | README §Conventions |
| Imports | `test`, `expect` and helpers from `fixtures/workspace` | smoke test |
| Run locally | `npm test`; one ticket: `npx playwright test --grep @TEAM-42`; types: `npm run typecheck` | package.json, README |
| Run in CI | `.github/workflows/demo-e2e.yml`: on push/PR touching `demo/**`, runs `--grep @smoke`; `workflow_dispatch` input `grep` for other tags; `retries: 1` in CI; uploads `test-results` | workflow file, playwright.config.ts |
| Environments | `python3 -m http.server 4174 --directory ../app`, baseURL `http://localhost:4174`, Chromium only | playwright.config.ts |
| Branch naming | No history beyond one commit on `main`; use default `test/<RUN-ID>-<name>` | git log |

## Reusable building blocks
| Kind | Name | File | What it does |
|---|---|---|---|
| Fixture | `openWorkspace` | fixtures/workspace.ts | Opens the Members screen with plan, signed-in role, members, pending |
| Fixture | `openInvite` | fixtures/workspace.ts | Opens the invite page for an email at a given age, plus optional workspace setup |
| Helper | `workspaceState` | fixtures/workspace.ts | Reads members and pending from `window.__teamhub.workspace` |
| Types | `Role`, `WorkspaceSetup`, `WorkspaceState` | fixtures/workspace.ts | Setup and state shapes |
| Page object | `BasePage` | pages/BasePage.ts | `seats`, `errorMessage`, `notice` locators |

## Things to be careful about
- The existing smoke test title has no case ID (`members screen loads and shows seats @smoke`), unlike the README rule. Doc wins for new tests; the old test is left alone.
- No page object exists yet for the Members screen or the invite page.
- The fixtures have no clock option. Tests needing a paused browser clock must call `page.clock` before the `open*` helper.
- CI only runs `@smoke` on push; other tags need `workflow_dispatch` (which needs a push of the branch first).
- `fullyParallel: true`: tests must not share state (they don't; state is per page load).
