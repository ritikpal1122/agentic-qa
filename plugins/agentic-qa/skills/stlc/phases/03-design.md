# Phase 03: Test design

**Goal:** turn requirements and risk into test cases a person could run by hand, with exact data and exact
expected results. If a case would pass on a broken product, it's not done.

**Reads:** `01-context.md`, `02-impact.md`, active domain packs. **Writes:** `03-design.md`.
**Never:** read test code, or invent a value the sources don't give.

Start only when `02-impact.md` is `approved`.

---

## Step 1: Plan coverage per requirement

For each requirement, use the **Depth** from `02-impact.md` and pick the techniques that fit:

| Technique | Use when the requirement has | Example |
|---|---|---|
| Boundary values | A limit, range or threshold | min, min − 1 step, max, max + 1 step; exactly at a limit |
| Equivalence classes | Many inputs that behave the same | one valid, one per kind of invalid |
| Decision table | Several conditions combine | role × account state × amount |
| State transition | Screens or statuses that change | form → confirm → success; edit and back |
| Error and recovery | Something can fail | invalid input, server error, timeout, retry |
| Repeat and concurrency | An action that changes data | double click, refresh, two tabs, back button |
| Persistence | Data saved or changed | the value is right after reload, and in the other screens that show it |

`high` depth uses every technique that fits. `medium` uses the main path plus the most likely negatives and
boundaries. `low` gets one check or is covered inside another case.

Also cover:
- Every **likely product bug** from `01-context.md`: at least one case that fails on the current code.
- Every **regression area** from `02-impact.md`: one case, or say which case covers it.
- The active domain pack's **Test ideas** that match a requirement.

Progress list for this phase: one item per group of requirements, so a stopped session can continue.

## Step 2: Write each case

```markdown
### TC-7 Reset link used one second after it expires (boundary, just past)
Covers: R-2 · Risk: high · Type: boundary · Targets: B-2
Setup: user asha@example.com, reset link sent at 10:00:00, clock set to 10:30:01
Steps:
1. Open the reset link from the email
2. Enter new password "N3w-passw0rd!" in both fields
3. Press Save
Expected:
- Message "This link has expired" is shown
- Password is not changed: signing in with the old password still works
Working: expires at 10:00:00 + 30 min = 10:30:00; 10:30:01 is after that → expired
```

Rules:
- **Exact data.** Real values in setup and steps. Never "a valid amount".
- **Exact expected results.** The visible result *and* the effect: what was saved, what changed, what did not.
  Never "works correctly" or "an error is shown".
- **Show the working** for any calculated value, so a reviewer can check it in seconds.
- **One reason to fail.** A case checks one behaviour. Several assertions are fine if they check that one behaviour.
- **Assert outcomes, not mechanisms:** what the user sees and what the system stored, not which function ran.
- **Unknowns stay unknown.** If an expected value depends on an unanswered question, write `Expected: blocked by Q-n`
  and keep the case.
- **Stable IDs:** TC-1, TC-2… in order. Never renumber.

## Step 3: Check your own coverage

Fill the coverage table, then fix what it shows:

| Req | Risk | Cases | Techniques | Gap? |
|---|---|---|---|---|
| R-2 | high | TC-6, TC-7, TC-8 | boundary, negative | — |

- Every requirement has at least one case, or a written reason why not (for example "not testable from the UI").
- Every high-risk requirement has a boundary or negative case, not only the happy path.
- Every likely bug has a case marked `Targets: B-n`.

## Step 4: Finish and stop

1. Header: `Inputs: 01-context.md, 02-impact.md`, `Status: draft`.
2. Summary for the human: number of cases by type (positive, negative, boundary, state, repeat),
   which likely bugs are targeted, and anything not covered and why.
3. Phase 03 always flows into review: stop only in `step` mode. Otherwise go straight to phase 04.

---

## Output: `03-design.md`

```markdown
# 03 Test design: <RUN-ID>
Status: draft
Inputs: 01-context.md, 02-impact.md
Updated: <date>
Approved-by:

## Progress
- [x] R-1 to R-8
- [ ] R-9 to R-16

## Summary
<counts by type, bugs targeted, what's not covered>

## Test data
<shared setup: users, accounts, data, how to reach each state>

## Cases
### TC-1 <title>
...

## Coverage
<table from step 3>

## Not covered
- R-n: <reason>
```

## Done when

- [ ] Every requirement is covered, or has a reason it isn't
- [ ] Every case has exact data, exact expected results, and working for calculated values
- [ ] Every likely bug has a case that would fail on the current code
- [ ] No case was based on test code or a guessed value
