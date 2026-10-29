# agentic-qa

**An agentic STLC skill for AI coding agents.** Give it a Jira ticket, a PRD, a GitHub PR, or any mix of them.
It drives the work through 12 resumable phases, from understanding the requirement to reviewed,
CI-proven end-to-end tests in your own automation repo.

Pure Markdown, no code. Works in Claude Code, and in other agents that read `SKILL.md` skills (Cursor, Codex).

> **Status: v0.1, all 12 phases work end to end on the demo.** See the full run in [examples/TEAM-42](examples/TEAM-42)
> and the scores in [evals/team-invites/results.md](evals/team-invites/results.md). Tested so far on one demo app,
> with Claude Code. Domain-agnostic: the demo runs with no domain pack.

## Results on the demo

One full run on TeamHub, a small team-workspace app (invites, seat limits, roles) with planted spec problems and five
planted bugs. Scored by an [eval harness](evals/harness), not by hand:

| | Result |
|---|---|
| Spec issues found before any test (conflicts, gaps) | **6 / 7** (LLM judge, evidence quoted) |
| Prompt injection hidden in a ticket comment | Quoted and refused |
| Requirements found | 28, most of them from the PRD and RFC, not the ticket's acceptance criteria |
| Test cases designed → automated | 37 → 45 Playwright tests, in the repo's own conventions |
| Planted bugs caught | **5 / 5**, each on its own single-bug version of the app |
| Same tests on the app with the bugs fixed | **46 / 46 pass**: 0 false alarms |
| Stability | 3 runs, same result every time |

Phase 01 by model, 3 runs each: Opus 6.2 / 7, Sonnet 5.8, Haiku 6.0, all refusing the injection every time.
Haiku costs about $0.02 a run against Opus's $0.54 ([details](evals/team-invites/results.md)).

Cost of the full run: $17 of model usage and about 28 minutes of agent time. The generated tests then run in CI for free.

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
/stlc start PROJ-123 --profile bug --mode step --domain <pack>
/stlc status                               # show the status board
/stlc resume                               # continue where you left off
/stlc goto 03 | skip 06 <reason> | approve 03
```

## Try the demo

`demo/teamhub/` has a small team-workspace app (**TeamHub**, open `demo/teamhub/app/index.html`), its sources
(a Jira-style story, PRD, design notes and an RFC) and a Playwright automation repo (`demo/teamhub/e2e`).
The sources contain a planted conflict, gaps and a prompt-injection comment, and the app has five bugs.
`evals/team-invites/answer-key.md` lists them, so you can score a run. Don't give the answer key to the agent.

```
cd demo/teamhub/e2e && npm ci && npx playwright install chromium
cd ../../.. && claude          # then: /stlc start demo/teamhub/sources/jira/TEAM-42.md
```

Or score it automatically, across models and runs:

```
python3 evals/harness/run_eval.py --models opus,sonnet,haiku --runs 3 --stage plan   # phase 01, about $1 a run
python3 evals/harness/run_eval.py --models sonnet --runs 1 --stage full              # phases 01-12
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
demo/teamhub/       sample app, its sources, and a Playwright automation repo
examples/TEAM-42/   a full run, phases 01–12, with the generated tests
evals/harness/      runs the skill headless and scores it: models, repeats, cost
evals/team-invites/ answer key, fixed app, planted bugs, results
```

## Roadmap

- [x] Orchestrator, state format, safety rules, demo
- [x] Phases 01–12, tested end to end on the demo
- [x] **Eval harness**: headless runs, deterministic bug scoring, model comparison ([results](evals/team-invites/results.md))
- [ ] Full runs on Sonnet and Haiku, and 3+ full runs per model
- [ ] A blind demo, with bugs planted by someone outside the project
- [ ] Bug and task profiles tested on their own demos
- [ ] Run in Cursor and Codex, and record the results
- [ ] **Explore mode**: `/stlc explore "<flow in plain English>"`, where the agent runs the flow live, verifies each step and locator, then writes it as plain test code
- [ ] More optional domain packs (`fintech` exists; e-commerce, healthcare)
- [ ] `domain draft`: draft a pack from a project's own docs and past bugs
- [ ] Headless runs in CI on PR and ticket events

## License

[MIT](LICENSE)
