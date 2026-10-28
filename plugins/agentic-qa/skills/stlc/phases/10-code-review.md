# Phase 10: Code review

**Goal:** an independent review of the new test code before it runs for real. The author can't see its own
blind spots, so the reviewer is a separate pass with a fresh context.

**Reads:** the diff of the branch, `03-design.md`, the profile, [../reference/test-code-rules.md](../reference/test-code-rules.md).
**Writes:** `10-code-review.md`, and fixes in the test code.

---

## Step 1: Review independently

If your agent can start a sub-agent, start one with **only** these inputs: the branch diff, the cases it should
implement (from `03-design.md`), the project profile and the test-code rules. Not the build notes.
Otherwise, do the review as a separate pass and read the code as if someone else wrote it.

Check every test against its case and the rules:

| Check | Question |
|---|---|
| Matches the case | Same setup data, same steps, same expected results? Nothing dropped or softened? |
| Can fail | Would this test fail if the product were broken in the way the case targets? |
| Effects | After a data change, does it assert the stored result? After a rejection, that nothing changed? |
| Exact values | Calculated values are constants with their working, not the product's own formula? |
| Locators | Profile's order, defined once in a page object, no CSS/XPath/indexes? |
| Stability | No fixed sleeps, no order dependence, own data setup? |
| Conventions | File, title, tags and structure as in the profile? Reused blocks instead of copies? |
| Scope | Only planned files changed? No product code, no unrelated tests? No secrets? |

## Step 2: Findings and fixes

| ID | File:line | Finding | Severity | Fix | Outcome |
|---|---|---|---|---|---|

- **blocker:** a test that can't fail, doesn't match its case, or changes something out of scope
- **major:** weak assertion, missing effect check, convention break that affects maintenance
- **minor:** naming, comments, small tidy-ups

Send blockers and majors back to the build (fix the code), then re-review **only the changed parts**.
**At most 3 rounds.** If blockers remain, stop and ask the human.

## Step 3: Finish

1. Header: `Inputs: 09-build.md`, `Status: draft`.
2. When no blocker or major is open, commit the test code on the branch (local commit only, no push),
   with a message naming the run: `test(<RUN-ID>): <summary>`. Record the commit SHA in the artifact.
3. Continue to phase 11.

## Done when

- [ ] Every new test was checked against its case and the rules by an independent pass
- [ ] No blocker or major is open
- [ ] The code is committed locally on the test branch, not pushed
