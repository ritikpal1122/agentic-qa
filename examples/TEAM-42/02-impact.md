# 02 Impact: TEAM-42
Status: approved
Inputs: 01-context.md
Sources: build:demo/teamhub/app/index.html@0df62595
Updated: 2026-10-28
Approved-by: auto (gated mode; Ritik's standing answer 2026-10-28: "approve 02 as you write it unless it changes phase 01")

## Summary
Evidence: build, no diff (confidence: medium). TEAM-42 has no PR; the whole invite feature in the single-file
demo app is treated as changed.
The feature adds invite send, the pending list with revoke, the seat header, and the accept page. All of it is
browser-side in one script. The riskiest parts are the seat-limit check (B-2), the 7-day boundary (B-3), the
email normalisation (B-1) and the missing role gate (B-4), all confirmed in the code. Everything shares
one `render()`, so a broken handler can break the whole Members screen, including the app-load smoke flow.
Nothing in this phase changes phase 01. One extra observation (O-1, unescaped HTML) is recorded for the human
and does not add a requirement.

## Changes
| ID | Where | What changed | Serves |
|---|---|---|---|
| CH-1 | `SEAT_LIMITS`, `seatLimit()`, `seatsUsed()` (index.html:36, 64–65) | Free = 3, Pro = 10; used = members + pending | R-14, R-15, R-16, R-17 |
| CH-2 | `sendInvite()` (index.html:68–78) | Trim, regex, member dup, pending dup, seat check, push pending, notice | R-1, R-2, R-5, R-10–R-13, R-18 |
| CH-3 | `revoke()` (index.html:80–84) | Remove pending row, clear message, re-render | R-8, R-19, R-20 |
| CH-4 | `accept()` (index.html:86–92) | Unknown → "no longer valid"; expiry check; push member; drop pending; notice | R-22–R-28 |
| CH-5 | `renderMembers()` (index.html:100–124) | Seats header, members with role, pending with Revoke, invite form | R-3, R-7, R-8, R-9, R-17 |
| CH-6 | `renderAccept()` (index.html:126–135) | "You're invited to Acme", invited email, Join button | R-21 |
| CH-7 | `render()` handlers (index.html:137–164) | Submit disables button for the call, keeps input on error; Join not disabled | R-6, R-28, G-5, G-8 |
| CH-8 | URL-param setup (index.html:31–60) | Test seams: `view`, `plan`, `role`, `members`, `pending`, `invite`, `age`; frozen clock `now`; `window.__teamhub` | test setup only (no requirement) |

Notes on what the code shows (facts, used in 03):
- `role` (index.html:55) is read and never used again: confirms B-4. Members see the form and Revoke.
- Seat check is `members.length >= seatLimit()` (index.html:73): confirms B-2. The header uses `seatsUsed()`, so the header can show `Seats 4 / 3`.
- Expiry is `now - sentAt > SEVEN_DAYS_MS` (index.html:88): confirms B-3. Exactly 7 days is accepted.
- `raw.trim()` with no lower-casing (index.html:69): confirms B-1. Both the duplicate checks and the stored email are case-sensitive.
- Join handler finds the invite before the 400 ms delay and the button stays enabled (index.html:158–161): confirms B-5. Two clicks within 400 ms each push a member.
- Send button is disabled during the call (index.html:147), so a double-submit of **Send invite** sends once (answers G-5 for this build only, not for the spec).
- On error the typed value is put back (index.html:150); on success the form re-renders empty (R-6).
- The accept view does not render the members list. The state is in memory only and resets on each page load. So R-22, R-23 and R-25 can only be seen on the accept page through `window.__teamhub.workspace`, and a "revoke, then open the link" journey across the two views can't be done in one page.
- "This invite is no longer valid" shows only when the invite isn't in pending: the accept page opened without `invite`, or Join pressed again after a successful join.

## Blast radius
| ID | Flow affected | Why | How we know | Sure? |
|---|---|---|---|---|
| A-1 | Members screen loads with plan and seat header | Header uses `seatsUsed()`/`seatLimit()` changed by CH-1 | index.html:114 | yes |
| A-2 | Members list with roles | Same `renderMembers()` as the pending list and form | index.html:102–104 | yes |
| A-3 | Every action on the Members screen (send, revoke) | All handlers re-bound in one `render()`; an exception there blanks the screen | index.html:137–164 | yes |
| A-4 | Error and notice messages on both views | Shared `messageHtml()` and `ui.message` | index.html:94–98 | yes |
| A-5 | Plan switching (Free ↔ Pro display) | `plan` drives both the label and the limit | index.html:43, 101 | yes |
| A-6 | App load (any view) | Single inline script; a load-time error breaks the whole app | index.html:29–166 | yes |
| A-7 | Real backend, email delivery, epic TEAM-40 flows | Not in the demo build; RFC rules would run on a server | S-4, S-6 not readable | possible |

## Risk by requirement
| Req | Impact | Likelihood | Risk | Depth | Reason (for high) |
|---|---|---|---|---|---|
| R-1 | medium | medium | medium | main + negative | |
| R-2 | high | low | medium | main + negative | |
| R-3 | high | high | high | full | Security/permission; code ignores role (B-4) |
| R-4 | high | high | high | full (API level, see Q-7) | Server role check; no server in demo (B-4, G-10) |
| R-5 | low | low | low | one check | |
| R-6 | low | low | low | in another case | |
| R-7 | high | low | medium | main path | |
| R-8 | medium | low | low | in another case | |
| R-9 | low | low | low | in another case | |
| R-10 | high | high | high | full | Normalisation feeds duplicate and seat checks; code doesn't lower-case (B-1) |
| R-11 | medium | medium | medium | main + boundaries of the regex | |
| R-12 | medium | medium | medium | main + case variant | |
| R-13 | high | high | high | full | Duplicate invites waste seats; case variant slips through (B-1) |
| R-14 | high | medium | high | full | Plan limit decides billing/upgrade; value was disputed (Q-1 → 3) |
| R-15 | high | medium | medium | boundary at 10 | |
| R-16 | high | high | high | full | Seat accounting (money); pending not counted in the check (B-2) |
| R-17 | medium | high | medium | in seat cases | |
| R-18 | high | high | high | full, both sides of the limit | Upgrade/billing gate; can be bypassed with pending invites (B-2) |
| R-19 | medium | low | medium | main path | |
| R-20 | high | medium | high | full | Seat freeing affects the limit check; logic is the seat count |
| R-21 | low | low | low | one check | |
| R-22 | high | medium | high | full | Core journey: invitee can't join otherwise |
| R-23 | medium | low | low | in R-22 case | |
| R-24 | low | low | low | in R-22 case | |
| R-25 | high | medium | medium | in R-22 case | |
| R-26 | high | high | high | full, both sides of 7 days | Date boundary; code uses `>` instead of `>=` (B-3) |
| R-27 | high | medium | high | full | Expired links must not grant access |
| R-28 | high | high | high | full | Concurrency; duplicate members (B-5) |

High risk: 12 (R-3, R-4, R-10, R-13, R-14, R-16, R-18, R-20, R-22, R-26, R-27, R-28).

## Regression areas
- Members screen loads and shows plan and seats for Free and Pro (A-1, A-5, A-6)
- Members list shows each person with their role (A-2)
- App loads without script errors on both views (A-6)

## Observations for the human (no source, so no requirement)
- O-1 Emails are put into the page with `innerHTML` and no escaping: the Pending list (index.html:107–108)
  and the accept page (`invite` URL param, index.html:131). An address like `<img/src=x/onerror=...>@x.test`
  passes the RFC regex, so this looks like stored and reflected HTML injection. No source asks for output
  escaping, so this run adds no requirement or test for it. Suggest raising it with the team (draft in 12).

## Notes for test design
- Setup is by URL params only (CH-8); the clock is frozen at page load, so `age=604800` is exactly 7 days and `age=604799` is 1 s before.
- To reach the seat limit with pending invites on Free: `members=` one extra person plus `pending=` one, giving 3/3 with only 2 members (the case that exposes B-2).
- Accept-side state (member added, pending dropped, seat count) can only be read via `window.__teamhub.workspace` on the accept page; there is no shared state with the members view.
- Double accept (B-5) needs two clicks within the 400 ms delay.
- R-4 can't be proven in E2E in this build (Q-7 default: UI hiding in E2E, R-4 marked for API-level tests).
- Expected-to-fail cases: B-1, B-2, B-3, B-4, B-5. Tests must keep the spec's expected results (never adjust to the build).
