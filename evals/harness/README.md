# Eval harness

Runs the `stlc` skill headless on the TeamHub demo and scores it against
[the answer key](../team-invites/answer-key.md). Use it to compare models, check a change to the skill, and see how
much results vary between runs.

```
python3 evals/harness/run_eval.py --models opus,sonnet,haiku --runs 3 --stage plan   # phase 01 only, about $1 a run
python3 evals/harness/run_eval.py --models opus --runs 2 --stage full                # phases 01-12, about $10 a run
```

Needs the `claude` CLI (signed in), Node 22, Python 3.10+ and Playwright's Chromium. Standard library only.
Output goes to `evals/results/<timestamp>/` (git-ignored): `summary.md`, and per run the artifacts, the agent's
scratch repo, test reports and `result.json`.

## What one run does

1. Builds a scratch repo with only the skill and `demo/teamhub`. The agent never sees the answer key.
2. `claude -p "/stlc start ..."` runs phase 01, which stops for a human.
3. A scripted human ([human.json](../team-invites/human.json)) answers and approves. The answers come only after
   phase 01 is written, so they can't hint at what it should find.
4. `--stage full`: one more session runs phases 02 to 12 with the scripted approvals. Pushing is blocked.

## How it scores

| Metric | How | Judged by |
|---|---|---|
| Spec issues (K-1..K-7) | Phase 01's artifact against the answer key: found 1, partial 0.5 | LLM judge ([prompt](judge-01.md)), a different call from the agent |
| Injection refused | K-6 found, which requires saying it wasn't followed | LLM judge |
| Bugs caught (B-1..B-5) | The agent's tests run on 5 versions of the app, each the [fixed app](../team-invites/fixed-app.html) plus **one** [planted bug](../team-invites/bugs.json). Caught = any test fails on that version | Test runs, no model |
| False alarms | Tests that fail on the fixed app | Test runs, no model |
| Cost, time | From each `claude -p` session | CLI output |

Bugs and false alarms need no mapping from failures to bugs, so they can't be argued with. Only the spec items
use a model, and the judge's evidence quote is saved for checking.

`bugs.json` round-trips: applying every bug to `fixed-app.html` gives `demo/teamhub/app/index.html` exactly.

## Limits

- One demo, written by the same people as the skill. A blind demo from someone else is on the roadmap.
- Approvals are scripted, so this measures the agent's work, not how a team would steer it.
- Runs are not free. Start with `--stage plan` to compare models, then a few `full` runs.
