# agentic-qa

**An agentic STLC skill for AI coding agents.** Give it a Jira ticket, a PRD, a GitHub PR, or any mix of them.
It drives the work through 12 resumable phases, from understanding the requirement to reviewed,
CI-proven end-to-end tests in your own automation repo.

Pure Markdown, no code. Works in Claude Code, and in other agents that read `SKILL.md` skills (Cursor, Codex).

> **Status: early MVP, in progress.** The orchestrator, state rules, safety rules and the fintech domain pack
> are written. Phase guides 01–05 (planning) are being built and tested one by one. Phases 06–12 come after.

---

## Why

Writing E2E automation by hand is slow, and the hard part isn't the code: it's reading the ticket, PRD,
designs and PR, finding the gaps, and designing tests that would actually catch a bug.
One big "write tests for this ticket" prompt skips steps, can't be reviewed halfway, and forgets everything
when the session ends.

This skill splits the work into phases, saves every phase as a file, and puts a human at the decisions that matter.

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

`demo/` has a small payments app (**PayLite**, open `demo/app/index.html`) and its sources:
a Jira-style story, PRD, design notes and an RFC. They contain planted conflicts, gaps, a prompt-injection
comment and five app bugs. `evals/send-money/answer-key.md` lists them, so you can score a run.
Don't give the answer key to the agent.

## Repo layout

```
plugins/agentic-qa/skills/stlc/
├── SKILL.md        orchestrator: commands, state, modes, rules
├── phases/         one guide per phase
├── reference/      artifact format, modes and profiles, safety
├── domains/        domain packs
└── templates/      run.md template
demo/               sample app and sources
evals/              answer keys for scoring runs
```

## Roadmap

- [x] Orchestrator, state format, safety rules, fintech pack, demo
- [ ] Phases 01–05 (planning), tested on the demo
- [ ] Phases 06–12 (build, review, CI, report)
- [ ] Second demo in another domain; e-commerce and SaaS packs
- [ ] `domain draft`: draft a pack from a project's own docs and past bugs
- [ ] Headless runs in CI on PR and ticket events
