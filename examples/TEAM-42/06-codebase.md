# 06 Codebase understanding: TEAM-42
Status: approved
Inputs: run.md
Sources: commit 032e395
Updated: 2026-10-28
Approved-by: Ritik (standing answer 2026-10-28: "Approve the project profile in 06 as written")

## Profile
Created `.stlc/project-profile.md` (first run in this repo), approved as written.

## What matters for this run
- Automation project: `demo/teamhub/e2e/`, Playwright 1.64.1 + TypeScript.
- Setup only through `openWorkspace` / `openInvite`; state checks through `workspaceState`.
- `page.clock` is available in 1.64.1 for the repeat cases (TC-28, TC-29, TC-34). The fixtures have no clock option.
- CI exists (`demo-e2e.yml`), but running `@TEAM-42` there needs a push + `workflow_dispatch`. **Ritik said: do not push.**
  Phase 11 runs locally only.
- No page object for the Members screen or the invite page yet.
