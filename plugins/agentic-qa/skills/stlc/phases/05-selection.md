# Phase 05: Automation selection

**Goal:** decide which reviewed cases get automated, at which level, and which stay manual.
The agent proposes with reasons; **a human decides**.

**Reads:** `02-impact.md`, `03-design.md`, `04-review.md`. **Writes:** `05-selection.md`.
**Never:** read test code (mapping to existing tests happens in phase 07).

Start only when `03-design.md` and `04-review.md` are `approved`.

---

## Step 1: Propose a level for every case

| Level | Choose when |
|---|---|
| **E2E** | A user journey across screens; what the user sees matters; a high-risk flow end to end |
| **API** | Rules and calculations that don't need the UI (validation, limits, calculations); many data variations |
| **Unit** | Pure logic inside one function. Suggest it to developers; this skill doesn't write unit tests |
| **Manual** | Visual or exploratory checks, one-off checks, or states too costly to set up automatically |
| **Skip** | Duplicates, or covered fully by another case |

Score each case on:
- **Value:** risk from `02-impact.md`, and how often it will run (every release? every PR?).
- **Stability:** can it be made deterministic? Avoid E2E for animations, third-party pages, real time or randomness.
- **Cost:** setup needed (special accounts, data, states), and how long it runs.
- **Level fit:** the cheapest level that can still catch the bug. Don't test 20 password rules through the UI:
  keep one or two E2E cases to prove the UI shows the error, and push the rest to API.

If the app has no API the tests can reach, say so and keep those cases at E2E (or manual), with the reason.

## Step 2: Suggest a split and a tag set

```markdown
| Case | Title | Risk | Proposed | Why |
|---|---|---|---|---|
| TC-7 | Reset link one second after expiry | high | E2E | Security; user-visible error; no API in this app |
| TC-19 | Password rules for 12 inputs | medium | API | Data-heavy; UI adds nothing |
| TC-25 | Reset email layout | low | Manual | Visual; checked once per release |
```

Then a short summary: how many E2E, API, manual, skipped, and a suggested **smoke set** (the 3–5 E2E cases
to run on every PR). Use tags like `@<RUN-ID>`, `@smoke`, `@regression`.

Also list which **regression areas** from `02-impact.md` need running, as flows. Phase 07 maps them to existing tests.

## Step 3: Ask the human

This phase **always stops for a human**, except in `auto` mode, which may approve the proposal as is.

Show the table grouped by proposed level, and ask the human to confirm or change it. Accept answers like
"automate all high-risk at E2E, rest manual", "move TC-19 to E2E", or "category: all boundary cases".
Record their changes in the table (`Decided:` column) and who decided.

---

## Output: `05-selection.md`

```markdown
# 05 Automation selection: <RUN-ID>
Status: draft
Inputs: 02-impact.md, 03-design.md, 04-review.md
Updated: <date>
Approved-by:

## Summary
E2E: n · API: n · Manual: n · Skip: n · Smoke set: TC-a, TC-b, TC-c

## Selection
| Case | Title | Risk | Proposed | Decided | Why |
|---|---|---|---|---|---|

## Regression areas to run
- <flow>

## Human decisions
- <what changed from the proposal, who, when>
```

## Done when

- [ ] Every reviewed case has a level and a reason
- [ ] Data-heavy checks are pushed below E2E where an API exists
- [ ] A smoke set is proposed
- [ ] A human decided (or `auto` mode approved), and the decisions are recorded
