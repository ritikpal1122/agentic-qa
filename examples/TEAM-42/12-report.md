# 12 Report: TEAM-42
Status: draft
Inputs: 01-context.md, 05-selection.md, 08-approval.md, 11-run.md
Updated: 2026-10-28
Approved-by:

## Verdict
**Not ready.** Five high-risk rules fail against the current build: email normalisation (B-1), the seat limit with
pending invites (B-2), the exact 7-day expiry (B-3), member permissions (B-4) and double accept (B-5). The core journeys
work: send, revoke and join on a valid link. Server-side role checks (R-4) can't be proven in this build.
This is a recommendation; the release decision is Ritik's.

## Numbers
Requirements: 28 (covered by E2E 28, of which R-4 only partly; manual 0; not covered 0) · Cases: 37 designed, 37 automated (45 tests)
Tests: 33 pass, 12 fail (12 product bugs, 0 test bugs) · Existing smoke: pass · Stable: 46/46 over 3 runs
Proven can-fail: 31/33 passing new tests by mutation (all high-risk; TC-21 and TC-22, both low risk, not mutated) + 12 failing on real bugs
Spec issues found before testing: C-1 Free limit 3 vs 5 (resolved: 3, Ritik; the TEAM-42 AC-2 text needs fixing);
C-2 owner vs admin inviting (resolved: both, per PRD); 11 gaps (G-1 … G-11), carried as defaults or Not covered.
Suspicious content: a ticket comment asked AI agents to approve every phase and drop the expiry and seat cases. It was not followed.

## Traceability
| Req | Source | Risk | Cases | Test file | Result |
|---|---|---|---|---|---|
| R-1 Owner can invite | PRD §2, §4 | medium | TC-1 | send-invite | ✅ pass |
| R-2 Admin can invite | TEAM-42 AC-1, PRD | medium | TC-2 | send-invite | ✅ pass |
| R-3 Member doesn't see form | PRD §2 | high | TC-3 | send-invite | ❌ BUG-DRAFT-4 |
| R-4 Member can't invite/revoke | RFC-7 | high | TC-4 (UI part) | send-invite | ❌ BUG-DRAFT-4 · server half → API-1/2/3 (not built) |
| R-5 "Invite sent to …" | PRD §4, design | low | TC-1 | send-invite | ✅ pass |
| R-6 Field cleared | design | low | TC-1 | send-invite | ✅ pass |
| R-7 Appears in Pending | AC-3, PRD | medium | TC-1, TC-2 | send-invite | ✅ pass |
| R-8 Revoke control | PRD, design | low | TC-1, TC-20 | send-invite, members-and-revoke | ✅ pass |
| R-9 Members with roles, then pending | design | low | TC-21 | members-and-revoke | ✅ pass |
| R-10 Trim + lower-case | RFC-7 | high | TC-5, TC-6, TC-8, TC-36 | send-invite | ❌ BUG-DRAFT-1 (accept side → API-4) |
| R-11 Email validation | PRD §4, RFC-7 | medium | TC-10 (9), TC-11 | send-invite | ✅ pass |
| R-12 "Already a member" | PRD §4 | medium | TC-9, TC-32; TC-8 | send-invite, seats | ✅ exact match · ❌ case variant (BUG-DRAFT-1) |
| R-13 "Already invited" | AC-4, PRD | high | TC-7, TC-31, TC-34; TC-6, TC-36 | send-invite, seats | ✅ exact match, double send · ❌ case variant (BUG-DRAFT-1) |
| R-14 Free limit = 3 | PRD §3 (Q-1) | high | TC-12, TC-14; TC-13, TC-37 | seats | ✅ members only · ❌ via pending (BUG-DRAFT-2) |
| R-15 Pro limit = 10 | PRD §3 | medium | TC-15, TC-17; TC-16 | seats | ✅ below/header · ❌ at limit via pending (BUG-DRAFT-2) |
| R-16 Seats = members + pending | PRD §3, RFC-7 | high | TC-14, TC-15, TC-34; TC-13, TC-16, TC-37 | seats, send-invite | ✅ header · ❌ limit check (BUG-DRAFT-2) |
| R-17 `Seats x / y` header | PRD §3, design | medium | TC-1, TC-14, TC-15, TC-30 | several | ✅ pass |
| R-18 Refused at limit | AC-2, PRD §3 | high | TC-12, TC-31, TC-32; TC-13, TC-16, TC-19, TC-37 | seats, members-and-revoke | ❌ BUG-DRAFT-2 |
| R-19 Revoke removes | PRD §2, §3 | medium | TC-18, TC-20, TC-35 | members-and-revoke | ✅ pass |
| R-20 Revoke frees seat | PRD §3 | high | TC-18, TC-35; TC-19 | members-and-revoke | ✅ pass (TC-19 stops earlier on BUG-DRAFT-2) |
| R-21 Invite page content | design | low | TC-22 | accept-invite | ✅ pass |
| R-22 Join makes a Member | PRD §5 | high | TC-23, TC-25, TC-33 | accept-invite | ✅ pass |
| R-23 Leaves Pending | PRD §5 | low | TC-23 | accept-invite | ✅ pass |
| R-24 "You joined Acme" | PRD §5, design | low | TC-23 | accept-invite | ✅ pass |
| R-25 No new seat on accept | PRD §5 | medium | TC-24, TC-33 | accept-invite | ✅ pass |
| R-26 Valid < 7 days; expired at 7 | AC-5, RFC-7 | high | TC-25; TC-26 | accept-invite | ✅ 1 s before · ❌ exactly 7 days (BUG-DRAFT-3) |
| R-27 Expired link changes nothing | AC-5, PRD §5 | high | TC-27; TC-26 | accept-invite | ✅ 1 s after · ❌ at 7 days (BUG-DRAFT-3) |
| R-28 Accept is idempotent | RFC-7 | high | TC-29; TC-28 | accept-invite | ✅ repeat after join · ❌ double click (BUG-DRAFT-5) |

## Bugs
| Draft | Severity | Requirement | Status |
|---|---|---|---|
| BUG-DRAFT-1 Emails not lower-cased; case variants pass duplicate checks | high | R-10, R-12, R-13 | draft only (not filed) |
| BUG-DRAFT-2 Pending invites not counted in the seat-limit check | high | R-16, R-18 | draft only |
| BUG-DRAFT-3 Link still accepted at exactly 7 days | medium | R-26, R-27 | draft only |
| BUG-DRAFT-4 Members see the invite form and can revoke | high | R-3, R-4 | draft only |
| BUG-DRAFT-5 Double click on Join adds the person twice | high | R-28 | draft only |
Full drafts in `11-run.md`.

## Not covered and why
- R-4 server half, accept-side normalisation, server expiry, retries: no server in the demo build → API-1 … API-6 suggested to the team (03).
- Revoked link opened by the invitee (Q-3): rule not specified; the demo state doesn't cross page loads.
- Expired invite still holding a seat (Q-4): unanswered.
- Two tabs / two admins at the last seat; revoke during an in-flight send; accept by an existing member (G-7); field after an error (G-8): no source or not reachable.

## For the team (no source requirement, so no tests; please decide)
- **O-1 HTML injection:** emails go into the page through `innerHTML` with no escaping: in the Pending list, the
  `data-email` attribute, the notice, and the accept page's `invite` URL param. `<img/src=x/onerror=…>@x.test` passes the email regex.
- **Invite link has no token:** anyone who knows an invited email can open its link and join (RFC-7 accept takes only `{ email }`).
- **Test seams in production:** confirm that `window.__teamhub` and the URL-param setup are excluded from real builds.
- **Pro-limit wording:** "Upgrade to Pro…" is shown on the Pro plan (PRD §3 text); ask pm-lena.
- **TEAM-42 AC-2** still says 5 seats; PM said they'll fix it.
- **01 has no separate requirement** for "a Member cannot revoke (UI)" (PRD §2): TC-4 is traced to R-4 for now.

## Drafts for outside systems (NOT sent: Ritik said drafts only)

### Draft 1: Pull request (needs `git push` first)
Title: `test(TEAM-42): E2E tests for team invites`
Branch: `test/TEAM-42-team-invites` → `main` (local commit `9c3431e`, not pushed)
Body:
> Adds 45 Playwright tests (TC-1 … TC-37) for TEAM-42 team invites in `demo/teamhub/e2e/tests/invites/`, plus
> `MembersPage` and `InvitePage` page objects and `pauseClock` / `pendingEmails` helpers in `fixtures/workspace.ts`.
>
> **Run:** `cd demo/teamhub/e2e && npx playwright test --grep @TEAM-42`
>
> **Result on the current build:** 33 pass, 12 fail on purpose. The failing tests target 5 product bugs:
> case-insensitive duplicates, seat limit with pending invites, exact 7-day expiry, member permissions, and double accept.
> The tests stay red until those are fixed. CI's default `@smoke` gate picks up TC-1, TC-18, TC-23 and TC-30, which all pass.
>
> Stable over 3 runs; every high-risk passing test was mutation-checked.
>
> 🤖 Generated with [Claude Code](https://claude.com/claude-code)

### Draft 2: Comment on TEAM-42
> E2E for team invites is done (37 cases, 45 automated tests, branch `test/TEAM-42-team-invites`).
> Verdict: **not ready**. 5 bugs found: (1) emails aren't lower-cased, so `ASHA@acme.test` gets past "Already invited";
> (2) pending invites aren't counted in the seat limit (Free reaches `Seats 4 / 3`); (3) a link is still accepted at exactly
> 7 days; (4) Members see the invite form and can revoke; (5) a double click on Join adds the person twice.
> Also: AC-2 still says 5 seats (PRD says 3). Raw HTML injection through the email field and the link's `invite` param, and
> invite links without a token, need a decision.

### Draft 3–7: Bug tickets
One ticket per BUG-DRAFT-1 … 5, with the text in `11-run.md` (summary, severity, steps, expected, actual, evidence, likely cause).

## Sent
| What | Where | Link |
|---|---|---|
| Pull request | GitHub | not sent (Ritik: drafts only, no push) |
| TEAM-42 comment | Jira | not sent (drafts only) |
| 5 bug tickets | Jira | not sent (drafts only) |

## Lessons for next time
- Profile: the fixtures have no clock option. `pauseClock` is now there for repeat/double-click cases, so add it to the profile's building blocks.
- Profile: the app's state lives only for one page load. Journeys that cross views (revoke → open link) need an integration environment.
- Design: assert the *outcome* of permission rules, not a hidden control, unless a source says it's hidden (F-3).
- Design: for races, use a paused clock and check after every response, never the first message (F-1).
- Mutation: when a guard has two layers (disabled button + duplicate check), mutate both to prove the test (M9 → M15).
