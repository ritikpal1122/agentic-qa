# Modes and profiles

## Modes: where you stop for a human

| Mode | You stop at |
|---|---|
| `step` | The end of every phase. Use for learning, or for high-risk features |
| `gated` (default) | Blocking open questions in 01, test review sign-off in 04, selection in 05, approval in 08 |
| `auto` | Blocking open questions in 01, approval in 08 |

In **every** mode you also stop before any write outside the repo (Jira, GitHub, Slack, test management).

"Stop" means: save the artifact as `draft`, show a short summary and exactly what you need, then wait.
When a mode doesn't stop at a phase, you may set it `approved` yourself and write `Approved-by: auto (<mode> mode)`.

A **blocking** question is one where the answer changes the expected result of a test,
for example "PRD says the session expires after 15 minutes, ticket says 30". Non-blocking questions are listed and carried forward.

## Profiles: which phases run

Pick the profile from the ticket type, unless the user sets one. Write the choice and the reason in `run.md`.

| Ticket type | Profile |
|---|---|
| Story, feature, epic child | `feature` |
| Bug, defect, incident | `bug` |
| Task, chore, refactor, tech debt, dependency upgrade | `task` |
| Only a PR or a doc, no ticket | Ask. Suggest `feature` for a new user-facing flow, `bug` for a fix |

| Phase | feature | bug | task |
|---|---|---|---|
| 01 Context | ✓ | ✓ defect, repro steps, expected vs actual | ✓ |
| 02 Impact | ✓ | ✓ | ✓ |
| 03 Test design | ✓ | ✓ TC-1 = the exact repro, plus a small regression ring | — select existing regression tests instead |
| 04 Test review | ✓ all personas | ✓ light: devil's advocate only | — |
| 05 Selection | ✓ | ✓ | ✓ confirm the selected regression set |
| 06–12 | ✓ | ✓ | build skipped; run and report only |

**Bug rule:** the repro test TC-1 must **fail on the base branch and pass on the fix**. If it passes on base,
it doesn't test the bug.

## Loops back

| Found in | Problem | Go back to |
|---|---|---|
| 04 review | Coverage gap, wrong expected result | 03 design |
| 10 code review | Weak assertion, convention break | 09 build |
| 11 CI run | Test bug | 09 build |
| 11 CI run | Environment or data issue | Fix env, re-run 11 |
| 11 CI run | Product bug | Draft a bug, keep the test red, stop for a human |

Count attempts in the artifact's Progress list. **After 3 attempts on the same loop, stop** and ask the human,
with a summary of what failed each time.
