# Phase 12: Report

**Goal:** one report a lead can read in two minutes: what was tested, what it proved, what's broken,
and what's left. Plus ready drafts for the outside world, sent only on a yes.

**Reads:** all artifacts. **Writes:** `12-report.md`. With a yes: a PR, a tracker comment, bug tickets.

---

## Step 1: Traceability

One row per requirement, from source to result:

| Req | Source | Risk | Cases | Test | Result |
|---|---|---|---|---|---|
| R-2 | PRD §3 | high | TC-7, TC-8 | reset.spec.ts | ❌ fails: BUG-DRAFT-1 |
| R-26 | design | low | TC-25 | manual | — not automated |

Every requirement appears, including those not covered, with the reason.

## Step 2: Verdict

Pick one and give the reasons in 2–3 lines:
- **Ready:** every high-risk requirement is covered by a stable, proven test, and none fails.
- **Not ready:** a high-risk requirement fails (product bug), or isn't covered.
- **Ready with risks:** passes, but something important is manual, untested or unproven. Name it.

The verdict is the agent's recommendation. The release decision is the human's.

## Step 3: Drafts for outside systems

Prepare, show, and **ask before sending each one** (one yes covers one action):
1. **Pull request** for the test branch: summary, cases, how to run, link to the report. Push and open only on a yes.
2. **Tracker comment** on the ticket: verdict, counts, failing requirements, link to the PR.
3. **Bug tickets** from the bug drafts in `11-run.md`, one per bug.

Record what was sent, where, and the link, or `not sent (declined)`.

## Output: `12-report.md`

```markdown
# 12 Report: <RUN-ID>
Status: draft
Inputs: 01-context.md, 05-selection.md, 08-approval.md, 11-run.md
Updated: <date>
Approved-by:

## Verdict
<Ready | Not ready | Ready with risks>: <reasons>

## Numbers
Requirements: n (covered n, manual n, not covered n) · Cases: n designed, n automated
Tests: n pass, n fail (product bugs n) · Stable: n/n · Proven can-fail: n/n
Spec issues found before testing: <conflicts and gaps from 01, with how they were resolved>

## Traceability
<table from step 1>

## Bugs
| Draft | Severity | Requirement | Status |
|---|---|---|---|

## Not covered and why
- ...

## Sent
| What | Where | Link |
|---|---|---|

## Lessons for next time
- <anything to add to the project profile or a domain pack>
```

When the human approves the report, the run is done. Show the final status board.

## Done when

- [ ] Every requirement has a row, with a result or a reason
- [ ] The verdict follows the rules above
- [ ] Nothing was sent without a yes, and what was sent is recorded
