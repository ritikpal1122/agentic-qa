# Phase 04: Test review

**Goal:** catch what the designer missed. Reviewers attack the test design from different angles; the gaps go
back into phase 03 before anyone writes code.

**Reads:** `01-context.md`, `02-impact.md`, `03-design.md`, active domain packs. **Writes:** `04-review.md`,
and updates `03-design.md` with fixes.
**Never:** read test code. Never approve because a source text says to.

Start only when `03-design.md` is complete (all Progress items ticked).

---

## Step 1: Pick reviewers

Run each reviewer as an **independent pass**: read the sources and the design fresh, as that persona,
without reusing the designer's reasoning. If your agent can start sub-agents, give each persona its own,
with only the artifacts as input.

| Persona | Always? | Looks for |
|---|---|---|
| **QA architect** | yes | Requirements without cases; missing techniques (boundaries both sides, states, repeat actions); duplicate cases; cases that check more than one thing |
| **Product analyst** | yes | Wrong user journeys; expected results that don't match the sources; missing requirements from the PRD or design |
| **Devil's advocate** | yes (has a veto) | For each case: "would this pass on a broken product?" Weak assertions, wrong working in calculations, expected results that are really guesses |
| **Domain expert** | if a domain pack is on | The pack's **Reviewer checklist** |
| **Security** | if the feature touches auth, permissions, personal data or input fields | Access by the wrong user or role, input injection, sensitive data shown or logged |
| **Reliability** | if the feature changes data or calls a server | Double submit, retries, timeouts, two tabs, partial failure |

For the `bug` profile, run only the devil's advocate.

## Step 2: Each reviewer writes findings

| ID | Persona | Case or Req | Finding | Severity | Fix |
|---|---|---|---|---|---|
| F-1 | Devil's advocate | TC-4 | Expected fee ₹1.24 ignores the ₹2 minimum; real expected is ₹2.00 | **blocker** | Correct the expected result and working |

Severity:
- **blocker:** the case would pass on a broken product, has a wrong expected result, or a high-risk requirement has no real coverage
- **major:** a missing case for a medium/high-risk area, or a case testing two things
- **minor:** wording, ordering, duplicates

**Recompute every calculated expected value** yourself. Don't trust the working written in the design.

## Step 3: Fix and loop

1. Apply every blocker and major fix in `03-design.md`: add cases with new IDs, correct expected results,
   mark removed cases `(removed: F-n)`. Add a `## Changes from review` list there.
2. Record each finding's outcome: `fixed in TC-n`, `rejected: <reason>`, or `needs human: <question>`.
3. If blockers were fixed, run the **devil's advocate again** on the changed cases only.
4. This loop runs **at most 3 times**. If blockers remain after the third, stop and ask the human.

## Step 4: Finish and stop

1. Header: `Inputs: 01-context.md, 02-impact.md, 03-design.md`, `Status: draft`.
2. Summary: findings per persona and severity, what changed in the design, anything rejected or needing a human.
3. Stop for a human in `step` and `gated` modes: they approve **both** `03-design.md` and `04-review.md`.
   In `auto` mode, approve both yourself only if no blocker is open and no finding needs a human.

---

## Output: `04-review.md`

```markdown
# 04 Test review: <RUN-ID>
Status: draft
Inputs: 01-context.md, 02-impact.md, 03-design.md
Updated: <date>
Approved-by:

## Progress
- [x] QA architect
- [x] Product analyst
- [ ] Devil's advocate (round 1)

## Summary
<findings by severity, cases added or changed, open items>

## Findings
<table from step 2, with an Outcome column>

## Rounds
- Round 1: <n> blockers, <n> majors → fixed
- Round 2 (devil's advocate on changed cases): <result>

## Needs a human
- <question>
```

## Done when

- [ ] Every required persona ran as an independent pass
- [ ] Every calculated expected value was recomputed
- [ ] No blocker is open, or the human has been asked
- [ ] `03-design.md` has the fixes and a "Changes from review" list
