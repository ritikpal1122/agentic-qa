# Phase 06: Codebase understanding

**Goal:** learn how this automation repo works, once, so every generated test looks like the team wrote it.
The result is a **project profile** reused by every later run in this repo.

**Reads:** the automation repo (config, docs, a few tests, page objects, fixtures, CI). **Writes:**
`.stlc/project-profile.md` (shared by all runs) and `06-codebase.md` (this run).
**Never:** change any repo file.

This is the first phase allowed to read test code.

---

## Step 1: Reuse or refresh the profile

If `.stlc/project-profile.md` exists:
- Check its `Sources:` line (config file hashes, last commit it was learned from). If the config, CI workflow
  or folder layout changed since, refresh the parts that changed. Otherwise reuse it as is.
- Write `06-codebase.md` saying which profile version this run uses, and finish.

If it doesn't exist, learn it (steps 2–3).

## Step 2: Learn the repo

Find the automation project first: it may be the repo root or a folder (look for `playwright.config.*`,
`cypress.config.*`, `wdio.conf.*`, `pytest.ini` with browser plugins, and so on). If there are several, ask which one.

Read, in this order, and stop when you can answer every row of the profile:
1. `CLAUDE.md`, `AGENTS.md`, `README`, `CONTRIBUTING` and any testing docs: written conventions win over anything inferred.
2. Runner config: test folder, base URL, projects/browsers, retries, reporters, web server, timeouts.
3. `package.json` / build files: run commands, framework and language versions.
4. 3–5 representative tests, including a recent one (`git log` on the test folder).
5. Page objects, fixtures, helpers, test data builders, auth setup.
6. CI workflow files: how and where tests run, which command, which tags or shards.

When written docs and the code disagree, note it; follow the docs unless the code shows the doc is outdated.

## Step 3: Write the profile

Every row must point to where you learned it, so the team can review it fast.

```markdown
# Project profile: <repo name>
Status: draft
Sources: <config files with hashes>, commit <sha>
Updated: <date>
Approved-by:

| Topic | Convention | Learned from |
|---|---|---|
| Framework | Playwright 1.64, TypeScript | package.json |
| Test folder and naming | tests/<feature>/<name>.spec.ts | README §Conventions |
| Test titles | Start with case ID: "TC-7: ..." | README |
| Tags | In title: @smoke, @regression, @<TICKET> | README, existing tests |
| Locators | getByTestId first, then getByRole; no CSS/XPath | README |
| Page objects | pages/, extend BasePage, getters + action methods, no assertions | README, pages/BasePage.ts |
| Fixtures and setup | signInAs(page, user) | fixtures/auth.ts |
| Test data | ... | |
| Auth | ... | |
| Assertions | web-first expect; check stored state after a save | README |
| Waiting | never waitForTimeout | README |
| Run locally | npm test; one ticket: npx playwright test --grep @<TICKET> | package.json, README |
| Run in CI | <workflow file, trigger, command> or "none found" | .github/workflows/... |
| Environments | base URL, how the app is started | playwright.config.ts |
| Branch naming | <from git history> or default test/<RUN-ID>-<name> | git log |

## Reusable building blocks
| Kind | Name | File | What it does |
|---|---|---|---|

## Things to be careful about
- <flaky areas, slow setups, shared test accounts, anything the docs warn about>
```

The profile needs a human approval **once**. After that, runs reuse it without asking.

## Step 4: Finish

1. `06-codebase.md`: header (`Inputs: run.md`, `Status: draft`), which profile version was used or created,
   and anything from the profile that matters for this run (for example "no CI workflow found").
2. Stop for the human only if the profile was created or changed (they approve it once). Otherwise continue.

## Done when

- [ ] Every profile row is filled or marked "not found", with where it was learned
- [ ] Reusable building blocks are listed
- [ ] The run command and CI path are known, or their absence is stated
- [ ] No repo file was changed
