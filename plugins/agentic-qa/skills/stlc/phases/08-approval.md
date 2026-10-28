# Phase 08: Approval

**Goal:** one go/no-go before anything is written into the repo. The human sees the whole plan in one place.

**Reads:** all earlier artifacts. **Writes:** `08-approval.md`.
This phase **always stops for a human, in every mode**.

---

## Step 1: Check everything is ready

All of these must be true. If one isn't, say which and stop:
- `01`–`07` are `approved` or `skipped`, and none is `stale`.
- No blocking open question is unanswered.
- The project profile is approved.

## Step 2: Write the one-page summary

```markdown
# 08 Approval: <RUN-ID>
Status: draft
Inputs: 01-context.md, 02-impact.md, 03-design.md, 04-review.md, 05-selection.md, 06-codebase.md, 07-architecture.md
Updated: <date>
Approved-by:

## What will be built
- <n> E2E tests in <files>, tagged @<RUN-ID>
- New: <page objects, helpers>; extended: <...>
- Branch: test/<RUN-ID>-<name>

## What they prove
| Req | Risk | Cases |
|---|---|---|
(high-risk requirements first)

## Expected to fail (likely product bugs)
| Bug | Case | Why it will fail |
|---|---|---|

## Not automated
- Manual: <cases>; API (suggested to the team): <cases>; not covered: <requirements and why>

## Decisions made so far
- <answers to open questions, selection changes, who and when>

## Risks
- <anything that could make this run unreliable: no CI, test data limits, states that can't be reached>

## Go / no-go
Reply "go" to build, or say what to change.
```

## Step 3: Wait

- **go:** set `Status: approved`, `Approved-by: <name> (<date>)`, and continue to phase 09.
- **change:** apply the change in the phase it belongs to (that phase becomes `draft`, later phases `stale`),
  then come back here.
- **no-go:** set `Status: draft`, write the reason, stop.

## Done when

- [ ] All earlier phases approved or skipped, none stale
- [ ] The summary fits on one screen
- [ ] A human said go
