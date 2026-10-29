# Phase 09: Build

**Goal:** write the planned tests into the automation repo, on a branch, following the project profile and
[../reference/test-code-rules.md](../reference/test-code-rules.md).

**Reads:** `03-design.md` (the cases), `05-selection.md`, `07-architecture.md`, the profile, the repo.
**Writes:** test files, page objects and helpers in the repo, on a branch; `09-build.md`.
**Never:** change product code, change unrelated tests, commit to the main branch, or push.

Start only when `08-approval.md` is `approved`.

---

## Step 1: Branch

Create or switch to the branch from `07-architecture.md` (`test/<RUN-ID>-<name>`). If the working tree has
unrelated uncommitted changes, stop and ask.

## Step 2: Write the code

Follow the file plan in `07-architecture.md`, in this order: page objects and helpers, then tests.
- Each test implements **one case**, with the case's exact data and expected results.
- Titles: `<TC-id>: <title> @<RUN-ID> <other tags>`.
- Tests that are expected to fail because of a likely product bug stay as normal tests (no `skip`, no `fail` marker).
  They must fail for the right reason. Phase 11 confirms that.
- If a case can't be automated as written (a state you can't reach), don't bend it: note it and move on.

Tick each file in the Progress list as you finish it.

## Step 3: Verify every new locator

For each new locator, prove it matches exactly one element on the real page:
1. **Preferred:** a browser tool (for example a Playwright MCP server): open the page in the right state,
   check the locator resolves to one element with the expected text or role.
2. **Otherwise:** run the new tests once (`--grep @<RUN-ID>`) and read every failure. "Locator not found" or
   "strict mode violation" means the locator is wrong: fix it and re-run.

Record each locator's result in the `07-architecture.md` locator table (`Verified? yes, via <how>`).

## Step 4: Self-check

- Type-check or lint with the project's tools if it has them.
- Run the new tests once. Separate the results:
  - fails because of **the test** (locator, wait, setup): fix it now (counts toward the loop limit)
  - fails because the **product disagrees with the expected result**: leave it red; note the case and bug ID
- **Stop after 3 fix attempts on the same test.** Note what keeps failing and move on.

Do not commit yet. Phase 10 reviews first.

## Output: `09-build.md`

```markdown
# 09 Build: <RUN-ID>
Status: draft
Inputs: 07-architecture.md, 08-approval.md
Updated: <date>
Approved-by:

## Progress
- [x] pages/ResetPasswordPage.ts
- [ ] tests/password-reset/reset.spec.ts

## Branch
test/<RUN-ID>-<name> (from <base> @ <sha>)

## Files
| Action | File | Cases |
|---|---|---|

## Locators verified
| Element | Locator | How verified | Result |
|---|---|---|---|

## First run
| Case | Result | Why |
|---|---|---|
| TC-7 | fail (expected) | product accepts an expired link: B-2 |

## Not automated
- <case>: <reason>
```

Then go to phase 10 without stopping (the code review is the check).

## Done when

- [ ] Every planned case has a test, or a reason it doesn't
- [ ] Every new locator is verified
- [ ] Every failing test fails for a product reason, not a test reason (or hit the 3-attempt limit)
- [ ] Nothing was committed, pushed, or changed outside the planned files
