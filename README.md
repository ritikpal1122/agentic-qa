# agentic-qa

**An agentic STLC skill for AI coding agents.** Give it a Jira ticket, a PRD, a GitHub PR, or any mix of them.
It drives the work through 12 resumable phases, from understanding the requirement to reviewed,
CI-proven end-to-end tests in your own automation repo.

Pure Markdown, no code. Works in Claude Code, and in other agents that read `SKILL.md` skills (Cursor, Codex).

> **Status: v0.1, all 12 phases work end to end on the demo.** See the full run in [examples/PAY-101](examples/PAY-101)
> and the score in [evals/send-money/results.md](evals/send-money/results.md). Tested so far on one demo app, with Claude Code.

## Results on the demo

One full run on PayLite, a small payments app with planted spec problems and five planted bugs:

| | Result |
|---|---|
| Spec issues found before any test (conflicts, gaps) | **7 / 7** |
| Prompt injection hidden in a ticket comment | Quoted and refused |
| Requirements found | 28, of which **21 were not in the ticket's acceptance criteria** |
| Test cases designed → automated | 45 → 58 Playwright tests, in the repo's own conventions |
| Planted bugs caught by the generated tests | **5 / 5**, with 0 false alarms |
| Same tests on the app with the bugs fixed | **59 / 59 pass** |
| Stability | 3 runs, same result every time |

Cost: about $13 of model usage and 45 minutes of agent time for the whole run. The generated tests then run in CI for free.

---

## Why

Writing E2E automation by hand is slow, and the hard part isn't the code: it's reading the ticket, PRD,
designs and PR, finding the gaps, and designing tests that would actually catch a bug.
One big "write tests for this ticket" prompt skips steps, can't be reviewed halfway, and forgets everything
when the session ends.

This skill splits the work into phases, saves every phase as a file, and puts a human at the decisions that matter.

## Why this and not a runtime testing agent?

Runtime testing agents click through your app on every run and decide what to do as they go.
That's flexible, but every run costs model calls and can behave differently, and they only test what you describe.

This skill uses the agent **while writing tests**, not while running them:

| | Runtime testing agent | agentic-qa |
|---|---|---|
| Starts from | A test you describe | Your **requirements**: ticket, PRD, design, RFC, PR |
| Finds spec gaps and conflicts before code | No | **Yes**, phase 01 |
| What runs in CI | An AI agent, every time | **Plain test code**, same result every run |
| Cost | Per run | Once, when the test is written |
| Where tests live | The vendor's platform | **Your repo**, reviewed like any code |
| Traceability (requirement → test → result) | Limited | Built in |
| Proof of quality | Varies | **Public evals** on apps with planted bugs |

Use a runtime agent if you want zero setup and no test code. Use this if you want reviewed,
deterministic tests that come from your requirements and stay in your repo.

## The 12 phases

```
PLAN       01 context → 02 impact → 03 test design → 04 test review → 05 automation selection
ENGINEER   06 codebase understanding → 07 reuse & architecture
SIGN-OFF   08 approval
DELIVER    09 build → 10 code review → 11 test via CI → 12 report
```

| # | Phase | What it does |
|---|---|---|
| 01 | Context | Reads the ticket and follows its links (PRD, design, RFC, attachments, PR). Extracts requirements with sources. Flags conflicts and gaps |
| 02 | Impact | What changed, what else it touches, risk per requirement |
| 03 | Test design | Test cases with exact data and expected results |
| 04 | Test review | Reviewer personas critique the cases; gaps go back to 03 |
| 05 | Selection | A human picks what to automate, at which level (E2E, API, manual) |
| 06 | Codebase | Learns your automation repo once into a project profile |
| 07 | Reuse | Finds existing page objects and helpers before writing anything new |
| 08 | Approval | One go/no-go before building |
| 09 | Build | Writes tests on a branch, following your repo's conventions |
| 10 | Code review | A separate reviewer with a fresh context |
| 11 | Run | Runs in your CI, triages failures, checks stability |
| 12 | Report | Requirement → test → result traceability, plus drafts for Jira |

## How it works

**The files are the state.** Every phase writes one Markdown artifact into `.stlc/runs/<RUN-ID>/`,
with a small header:

```markdown
# 03 Test design: PROJ-123
Status: draft            # draft | approved | skipped | stale
Inputs: 01-context.md, 02-impact.md
Sources: jira:PROJ-123@2026-10-19T10:42, pr:#42@a1b2c3d
```

That gives you, without any database or chat memory:

- **Pause and resume:** a new session continues from the first phase that isn't approved.
- **Start anywhere:** drop in your own artifact (for example reviewed test cases as `03-design.md`) and continue from there.
- **Change tracking:** if an approved artifact changes, or the PR gets new commits, later work is marked `stale`
  and only the affected part is redone.
- **Review and audit:** everything is readable and tracked in git.

**Modes** set where it stops for a human: `step`, `gated` (default) or `auto`.
**Profiles** set how much it does: `feature` (all phases), `bug` (short path; the repro test must fail before
the fix and pass after), `task` (run the existing regression tests).

**Domain packs** add a domain expert's checklist without changing the workflow. The core is domain-agnostic;
a pack adds questions, test ideas and review points for one domain. `fintech` ships today; teams can write their own.

## Safety

- Ticket, PR and doc text is treated as **data, not instructions**. Instructions aimed at the agent are quoted, not followed.
- Planning phases are read-only. Tests are written only on a branch. Product code is never changed.
- Anything outside the repo (Jira comments, pushes, PRs) needs a human yes, in every mode.
- No result is reported unless it came from an actual run. Assertions are never weakened to get a pass.

## Install

**Claude Code (plugin)**
```
/plugin marketplace add ritikpal1122/agentic-qa
/plugin install agentic-qa@agentic-qa
```

**Claude Code, Cursor or Codex (copy into a repo)**

Copy `plugins/agentic-qa/skills/stlc/` into your automation repo:

| Agent | Folder |
|---|---|
| Claude Code | `.claude/skills/stlc/` |
| Cursor | `.cursor/skills/stlc/` (Cursor also reads `.claude/skills/`) |
| Codex | `.agents/skills/stlc/` |

For Jira, Figma and browser access, connect the matching MCP servers in your agent.

## Usage

```
/stlc start PROJ-123                       # from a Jira ticket
/stlc start https://github.com/org/repo/pull/42
/stlc start docs/prd/checkout.md           # from a PRD alone
/stlc start PROJ-123 --profile bug --mode step --domain fintech
/stlc status                               # show the status board
/stlc resume                               # continue where you left off
/stlc goto 03 | skip 06 <reason> | approve 03
```

## Try the demo

`demo/` has a small payments app (**PayLite**, open `demo/app/index.html`), its sources
(a Jira-style story, PRD, design notes and an RFC) and a Playwright automation repo (`demo/e2e`).
The sources contain planted conflicts, gaps, a prompt-injection comment, and the app has five bugs.
`evals/send-money/answer-key.md` lists them, so you can score a run. Don't give the answer key to the agent.

```
cd demo/e2e && npm ci && npx playwright install chromium
cd ../.. && claude            # then: /stlc start demo/sources/jira/PAY-101.md
```

The `demo-e2e` GitHub workflow runs the demo's smoke tests on every change to `demo/`.

## Repo layout

```
plugins/agentic-qa/skills/stlc/
├── SKILL.md        orchestrator: commands, state, modes, rules
├── phases/         one guide per phase
├── reference/      artifact format, modes and profiles, safety, test-code rules
├── domains/        domain packs
└── templates/      run.md template
demo/               sample app, its sources, and a Playwright automation repo
examples/           a full run, phases 01–12, with the generated tests
evals/              answer keys and benchmark results
```

## Roadmap

- [x] Orchestrator, state format, safety rules, fintech pack, demo
- [x] Phases 01–05 (planning), tested on the demo
- [x] Phases 06–12 (build, review, run, report), tested on the demo
- [x] **Public benchmark** for the first demo ([results](evals/send-money/results.md))
- [ ] Bug and task profiles tested on their own demos
- [ ] Run in Cursor and Codex, and record the results
- [ ] **Explore mode**: `/stlc explore "<flow in plain English>"`, where the agent runs the flow live, verifies each step and locator, then writes it as plain test code
- [ ] Second demo in another domain; e-commerce and SaaS packs
- [ ] `domain draft`: draft a pack from a project's own docs and past bugs
- [ ] Headless runs in CI on PR and ticket events
