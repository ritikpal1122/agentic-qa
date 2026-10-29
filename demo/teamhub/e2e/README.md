# TeamHub E2E tests

Playwright tests for the TeamHub web app (`../app`).

## Run
```
npm ci
npx playwright install chromium
npm test              # all tests
npm run test:smoke    # @smoke only
npx playwright test --grep @TEAM-42
```
The config starts the app on http://localhost:4174.

## Conventions
- **Locators:** `getByTestId` first (the app has `data-testid` on every control), then `getByRole`. No CSS or XPath.
- **Page objects** in `pages/`, one class per screen, extending `BasePage`. Expose locators as getters and user actions as methods. No assertions inside page objects.
- **Setup:** always through `openWorkspace(page, {...})` or `openInvite(page, ...)` in `fixtures/workspace.ts`. Never build URLs in a test.
- **Time:** the app's clock is frozen at page load. Reach a moment by setting the invite's age (`openInvite(page, email, ageSeconds)`), never by waiting.
- **State checks:** after an action that changes the workspace, assert `workspaceState(page)` (members, pending), not only the screen.
- **Files:** `tests/<feature>/<name>.spec.ts`. Titles start with the case ID: `TC-3: invite is refused when seats are full`.
- **Tags:** in the title: `@smoke`, `@regression`, and the ticket key, e.g. `@TEAM-42`.
- **Waiting:** web-first assertions (`expect(...).toHaveText`). Never `waitForTimeout`.
