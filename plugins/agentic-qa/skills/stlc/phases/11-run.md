# Phase 11: Test via workflow

**Goal:** prove the tests with real runs. A result counts only if it came from an actual run, and a passing
test counts only if it has also been seen to fail when the product is wrong.

**Reads:** the branch, the profile (run command, CI path), `08-approval.md` (expected failures).
**Writes:** `11-run.md`, and run output under the repo's usual results folder.
**Never:** change product code on any branch, weaken an assertion, or mark a failure as passed.

---

## Step 1: Pick where to run

| Option | When |
|---|---|
| The repo's **CI workflow** on the test branch | The profile has a CI path. Pushing the branch to trigger it is an outside write: **ask first** |
| The repo's **local run command** | No CI, the human said no to pushing, or as a first pass before CI |

Use the profile's command with the run's tag (for example `npx playwright test --grep @<RUN-ID>`).
Also run the **regression selection** from `07-architecture.md`.

## Step 2: Triage every failure

Classify each failing test before changing anything:

| Class | Signs | Action |
|---|---|---|
| **Product bug** | The app does something the requirement says it must not; matches a likely bug, or a new one | Keep the test red. Draft a bug (step 5) |
| **Test bug** | Locator not found, wrong setup, wrong expected value against the sources | Back to phase 09 to fix, then phase 10 for the change only |
| **Environment** | Server errors, many timeouts at once, app not starting, auth expired | Fix or restart the environment, re-run. Don't touch the tests |
| **Flaky** | Passes on a re-run with no change | Find the race (missing wait for state). Not done until stable |

If a failure's class isn't clear, show the evidence (error, screenshot, trace) and ask. **Loops back to 09 are capped at 3.**

## Step 3: Stability

Run the new **passing** tests **3 times**. Any test that doesn't pass all 3 is flaky: fix it, or mark it and tell the human.

## Step 4: Prove the tests can fail

A green test proves nothing until it has failed when it should.

- **Bug profile:** run TC-1 on the **base branch** (before the fix). It must **fail** there and **pass** on the PR.
  If it passes on base, it doesn't reproduce the bug: back to 03.
- **Mutation check** for each passing high-risk test, in a **temporary copy** (a separate worktree or copied
  folder that is deleted afterwards, never committed):
  - If the product code is reachable: make the smallest change that breaks the rule the test guards
    (flip a comparison, change a constant, skip a check). The test must fail.
  - If it isn't: change the test's **input** so the expected result no longer holds (one second past a limit, a
    different account state). The test must fail.
  Record what was changed and the result. A test that still passes is weak: back to 09.
- Tests that already fail because of a product bug have proven they can fail. Skip them here.

## Step 5: Draft bugs

For every product-bug failure, write a draft in the artifact. **Never create it in the tracker without a yes.**

```markdown
### BUG-DRAFT-1: Expired reset link still changes the password
Severity: high (security) · Found by: TC-7 · Requirement: R-2 (PRD §3)
Steps: <from the case>
Expected: "This link has expired"; old password still works
Actual: password is changed; old password is rejected
Evidence: <screenshot/trace path>, run <id>
```

## Output: `11-run.md`

```markdown
# 11 Run: <RUN-ID>
Status: draft
Inputs: 10-code-review.md
Sources: branch <name>@<sha>
Updated: <date>
Approved-by:

## Where
<local command | CI run link>

## Results
| Case | Result | Class | Evidence |
|---|---|---|---|

## Stability (3 runs)
| Case | 1 | 2 | 3 |
|---|---|---|---|

## Can-fail proof
| Case | How (mutation / fail on base) | Change made | Failed? |
|---|---|---|---|

## Regression
<selection, result>

## Bug drafts
<from step 5>
```

Stop for the human in `step` mode, or if any failure is unclassified. Otherwise continue to phase 12.

## Done when

- [ ] Every result comes from a real run, with evidence
- [ ] Every failure is classified
- [ ] Passing new tests are stable over 3 runs
- [ ] Every passing high-risk test failed under a mutation (or, for bugs, failed on base)
- [ ] Temporary copies are deleted; no product code changed anywhere
