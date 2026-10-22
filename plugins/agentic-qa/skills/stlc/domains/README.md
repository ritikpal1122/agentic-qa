# Domain packs

The skill is generic. A domain pack adds what a domain expert would check, as an extra checklist.
Packs never change the phases or rules. They only add questions, test ideas and review points.

## How a pack is chosen

1. **Set by the team:** `.stlc/config.md` has a line like `Domains: fintech` (applies to every run in the repo).
2. **Set for one run:** `start PROJ-123 --domain fintech`, written into `run.md`.
3. **Suggested:** if neither is set, phase 01 may suggest a pack when the sources clearly match its
   "Signals" list. Ask the human; never switch one on yourself.

More than one pack can be on (`Domains: fintech, healthcare`). No pack is fine too.

## Where each phase uses a pack

| Phase | Uses section |
|---|---|
| 01 Context | **Questions to ask**: gaps to check in the sources |
| 03 Test design | **Test ideas**: cases to consider for every matching requirement |
| 04 Test review | **Reviewer checklist**: the domain expert persona uses it |

## Pack format

Copy this shape to add a new domain (`domains/<name>.md`):

```markdown
# Domain pack: <name>

## Signals
Words or features in the sources that suggest this pack.

## Questions to ask (phase 01)
Gaps a domain expert would spot in a ticket or PRD.

## Test ideas (phase 03)
Cases worth considering, grouped by topic.

## Reviewer checklist (phase 04)
What the domain expert persona checks in the test design.
```

## Available packs

| Pack | Status |
|---|---|
| [fintech](fintech.md) | Ready |
| e-commerce | Planned |
| saas (accounts, roles, billing) | Planned |
| healthcare | Planned |
