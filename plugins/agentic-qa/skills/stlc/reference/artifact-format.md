# Artifact format and state rules

Every phase writes one Markdown file in the run folder. These files are the only state.
A new session, a different person, or a CI job can pick up the run by reading them.

## The header

Every artifact starts with exactly this shape, so it can be read without reading the whole file:

```markdown
# 03 Test design: PROJ-123
Status: draft
Inputs: 01-context.md, 02-impact.md
Sources: jira:PROJ-123@2026-10-19T10:42, pr:#42@a1b2c3d
Updated: 2026-10-20
Approved-by:

## Progress
- [x] Techniques picked per requirement
- [ ] Cases for R-1 to R-3
- [ ] Cases for R-4 to R-7
```

| Field | Meaning |
|---|---|
| `Status` | `draft`, `approved`, `skipped` or `stale` (see below) |
| `Inputs` | The earlier artifacts this one was built from. Used for stale tracking |
| `Sources` | Outside sources and the version read: ticket updated time, PR head commit, doc date, or a content hash for local files (never a file's modified time). Only phases that read outside sources fill this |
| `Updated` | Date of the last change |
| `Approved-by` | Who approved it, written only when a human says yes |
| `## Progress` | Optional checklist for long phases. Tick items as they are done, so a stopped session can continue mid-phase |

Everything after the header is the phase's content, as its phase guide describes.

## Statuses

| Status | Meaning | Next phase may start? |
|---|---|---|
| (no file) | Not started | — |
| `draft` | Work in progress, or done and waiting for review | No |
| `approved` | A human accepted it, or the mode allows auto-approval for this phase | Yes |
| `skipped` | Not needed for this run; the reason is written under the header | Yes |
| `stale` | Was approved, but something it depends on changed | No, recheck it first |

Only a human approval, or a mode rule that allows it, may set `approved`. Never set it on your own judgement.

## Status board

Show this at the start of every invocation, before doing anything else:

```
PROJ-123 · profile: feature · mode: gated
01 context      approved   (2026-10-19, Ritik)
02 impact       approved   (2026-10-19, Ritik)
03 design       stale      ← next: 01 changed after this was approved
04 review       —
05 selection    —
06 codebase     —
...
12 report       —
```

- Mark the next phase with `← next` and say why in a few words.
- Phases left out by the profile show as `(not in profile)`.
- If any file has a broken header, show `?` and the problem. Don't guess its status.

## Finding the next phase

Walk the phases in the profile's order. The next phase is the first one where:
1. the file is missing, or
2. `Status` is `draft` or `stale`.

If that file has a `## Progress` list, continue from the first unticked item.

## Stale rules

Something becomes stale in two ways:

1. **An earlier artifact changed after approval.** Every later artifact whose `Inputs` lists it, directly or
   through another artifact, becomes `stale`.
2. **An outside source changed.** On every invocation, compare the `Sources` in `01-context.md` with the
   current versions (ticket updated time, PR head commit). If any differ, mark `01-context.md` stale, and rule 1 follows.

When you redo a stale phase:
- Find what changed (the diff of the input, or the new commits).
- Update **only the parts affected by the change**. Keep the rest as it is.
- Add a `## Changes since last approval` section listing what you changed and why.
- Set `Status: draft` and ask for re-approval. Show only the changed parts.

## Writing rules

- Write the file as you go, not only at the end. Tick Progress items as you finish them.
- Keep IDs stable: requirements `R-1`, test cases `TC-1`, open questions `Q-1`. Never renumber; mark removed ones `(removed)`.
- Use relative dates only in conversation. In files, write absolute dates.
