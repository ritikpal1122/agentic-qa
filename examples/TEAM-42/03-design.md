# 03 Test design: TEAM-42
Status: approved
Inputs: 01-context.md, 02-impact.md
Updated: 2026-10-28
Approved-by: Ritik (standing answer 2026-10-28: approve 03 and 04 when the review has no open blockers)

## Progress
- [x] R-1 to R-9 (send, roles, list)
- [x] R-10 to R-13 (normalisation, validation, duplicates)
- [x] R-14 to R-20 (seats, limit, revoke)
- [x] R-21 to R-28 (accept, expiry, idempotency)
- [x] Regression areas and coverage table
- [x] Review round 1 fixes applied (04 F-1 … F-33)
- [x] Review round 2 fixes applied (04 R2-1 … R2-8)

## Summary
37 cases: 9 positive, 11 negative, 10 boundary, 4 state, 3 repeat (TC-10 is data-driven over 9 invalid inputs).
Likely bugs targeted: B-1 (TC-5, TC-6, TC-8, TC-36), B-2 (TC-13, TC-16, TC-19, TC-37), B-3 (TC-26),
B-4 (TC-3, TC-4), B-5 (TC-28).
Not covered in E2E (see Not covered): R-4 server half and other API-level checks (API-1 … API-6), revoked link (Q-3),
expired-invite seat use (Q-4), retry/timeout/two tabs, revoke during an in-flight send, accept by an existing member (G-7).

## Test data
App: `demo/teamhub/app/index.html`, set up only through URL params (02 CH-8). The demo clock is frozen at page load.
- Owner always present: `owner@acme.test` (Owner). Workspace name: Acme.
- `plan=free|pro` (Free limit 3, Pro limit 10 per Q-1 answer and S-2 §3).
- `role=owner|admin|member` = the signed-in user on the Members view. Always set explicitly in setups.
- `members=ravi@acme.test,adi@acme.test:admin` = people besides the owner (default role Member).
- `pending=mia@acme.test` = pending invites sent just now. Also works on the accept view.
- Accept view: `view=accept&invite=asha@acme.test&age=<seconds since sent>`.
- Accept-side effects (member added, pending removed, seats) are not shown on the accept page; they are read from
  the app state `window.__teamhub.workspace` ("app state" below). Seats used = members + pending (R-16).
- 7 days = 7 × 24 × 3600 = 604 800 s.
- Matching rule: the email inside a row, the messages and the `Seats <used> / <limit>` text are matched **exactly and
  case-sensitively** (F-2). This applies to those parts, not to a whole row ("email + Revoke") or the whole header (R2-4).
- Text entry: always *replace* the field content with the given value, never append (R2-8).
- The **Revoke** control is a "link" in the design and a "button" in the PRD (G-9): identify it by its name "Revoke", not by its kind (F-32).
- Repeat cases (TC-28, TC-29, TC-34) control the browser clock: install a fake clock at a fixed time T and pause it at
  T before opening the page, so the 400 ms responses wait until the test advances time; then advance 1 000 ms and check.
  Both clicks land before any response, and the check runs only after every response has landed (F-1, F-8, R2-5).
- Pro member set used by TC-16 and TC-17: `m1@acme.test,m2@acme.test,m3@acme.test,m4@acme.test,m5@acme.test,m6@acme.test,m7@acme.test,m8@acme.test` ("8 Pro members").

## Cases

### TC-1 Owner sends an invite on the Free plan (happy path)
Covers: R-1, R-5, R-6, R-7, R-8, R-17 · Risk: medium · Type: positive
Setup: `plan=free&role=owner&members=ravi@acme.test` → header `Seats 2 / 3`
Steps:
1. Type `asha@acme.test` in "Invite by email"
2. Press **Send invite**
Expected:
- [R-5] Message "Invite sent to asha@acme.test"
- [R-7, R-8] Pending list has exactly one row, `asha@acme.test`, with a **Revoke** control
- [R-17] Header shows `Seats 3 / 3`
- [R-6] The email field is empty
Working: before 1 owner + 1 member + 0 pending = 2; after +1 pending = 3

### TC-2 Admin sends an invite
Covers: R-2 · Risk: medium · Type: positive
Setup: `plan=pro&role=admin&members=adi@acme.test:admin` → `Seats 2 / 10`
Steps: type `asha@acme.test`, press **Send invite**
Expected: message "Invite sent to asha@acme.test"; pending row `asha@acme.test`; header `Seats 3 / 10`
Working: 1 owner + 1 admin = 2; +1 pending = 3

### TC-3 A Member does not see the invite form
Covers: R-3 · Risk: high · Type: negative · Targets: B-4
Setup: `plan=free&role=member&members=mia@acme.test`
Steps: open the Members screen
Expected: no visible textbox named "Invite by email" and no visible button named "Send invite" (PRD §2 "do not see";
the "Invite by email" section heading is not part of the check, R2-6); the members list still shows `owner@acme.test` Owner and `mia@acme.test` Member

### TC-4 A Member cannot revoke a pending invite
Covers: R-4 (the part reachable from the UI: a Member cannot revoke; source also S-2 §2 table) · Risk: high · Type: negative · Targets: B-4
Setup: `plan=free&role=member&members=mia@acme.test&pending=asha@acme.test` → `Seats 3 / 3`
Steps:
1. Open the Members screen
2. If a **Revoke** control is shown for `asha@acme.test`, press it
Expected: `asha@acme.test` is still in the Pending list and the header still shows `Seats 3 / 3`
(the sources say a Member cannot revoke; they don't say whether the control is hidden, so only the outcome is asserted, F-3).
The Revoke locator is the same one TC-20 uses, so TC-20 proves the locator finds the control (R2-7).

### TC-5 Email is trimmed and lower-cased before saving
Covers: R-10 · Risk: high · Type: negative (input variant) · Targets: B-1
Setup: `plan=free&role=owner` (`Seats 1 / 3`)
Steps: type `  Asha@Acme.test  ` (two spaces each side), press **Send invite**
Expected:
- A message starting "Invite sent to" is shown (the email's form in the message is not specified, F-19)
- Pending list has exactly one row, with text exactly `asha@acme.test` (case-sensitive)
- App state pending emails = [`asha@acme.test`]
- `Seats 2 / 3`

### TC-6 Case variant of a pending invite is "Already invited"
Covers: R-10, R-13 · Risk: high · Type: negative · Targets: B-1
Setup: `plan=free&role=owner&pending=asha@acme.test` → `Seats 2 / 3`
Steps: type `ASHA@acme.test`, press **Send invite**
Expected: error "Already invited"; pending list has exactly one row (`asha@acme.test`); app state pending emails = [`asha@acme.test`]; `Seats 2 / 3`

### TC-7 Exact duplicate of a pending invite is "Already invited"
Covers: R-13 · Risk: high · Type: negative
Setup: `plan=free&role=owner&pending=asha@acme.test` → `Seats 2 / 3`
Steps: type `asha@acme.test`, press **Send invite**
Expected: error "Already invited"; one pending row; `Seats 2 / 3`

### TC-8 Case variant of an existing member is "Already a member"
Covers: R-10, R-12 · Risk: high · Type: negative · Targets: B-1
Setup: `plan=free&role=owner&members=ravi@acme.test` → `Seats 2 / 3`
Steps: type `Ravi@Acme.test`, press **Send invite**
Expected: error "Already a member"; pending shows "(none)"; app state pending is empty; `Seats 2 / 3`

### TC-9 Exact email of an existing member is "Already a member"
Covers: R-12 · Risk: medium · Type: negative
Setup: `plan=free&role=owner&members=ravi@acme.test`
Steps: type `ravi@acme.test`, press **Send invite**
Expected: error "Already a member"; pending "(none)"; `Seats 2 / 3`

### TC-10 Invalid addresses are refused (data-driven)
Covers: R-11 · Risk: medium · Type: negative (equivalence classes and regex boundaries)
Setup: `plan=free&role=owner` (`Seats 1 / 3`)
Steps: for each input, open a fresh page, type it, press **Send invite**
| Input | Class (fails `^[^@\s]+@[^@\s]+\.[^@\s]+$` after trim + lower-case because) |
|---|---|
| `asha.acme.test` | no `@` |
| `asha@acme` | no `.` after `@` |
| `asha@@acme.test` | two `@` |
| `asha smith@acme.test` | space inside |
| `@acme.test` | empty local part (boundary, F-11) |
| `asha@.test` | empty domain label (boundary) |
| `asha@acme.` | empty top-level part (boundary) |
| `` (empty) | empty after trim (G-4 default: regex applies, F-18) |
| `   ` (three spaces) | empty after trim |
Expected for each: error "Enter a valid email address"; pending "(none)"; `Seats 1 / 3`

### TC-11 Shortest valid address is accepted (regex boundary)
Covers: R-11 · Risk: medium · Type: boundary
Setup: `plan=free&role=owner`
Steps: type `a@b.c`, press **Send invite**
Expected: message "Invite sent to a@b.c"; pending row `a@b.c`; `Seats 2 / 3`
Working: one character in each of the three `[^@\s]+` parts: `a` @ `b` . `c` (5 characters, the shortest match)

### TC-12 Free plan at the limit with members only
Covers: R-14, R-18 · Risk: high · Type: boundary (at limit)
Setup: `plan=free&role=owner&members=ravi@acme.test,mia@acme.test` → `Seats 3 / 3`
Steps: type `asha@acme.test`, press **Send invite**
Expected: error "Seat limit reached. Upgrade to Pro to add more people."; pending "(none)"; `Seats 3 / 3`
Working: 1 + 2 = 3 = limit 3 → refused (`seatsUsed >= seatLimit`)

### TC-13 Free plan at the limit because of a pending invite
Covers: R-14, R-16, R-18 · Risk: high · Type: boundary (at limit) · Targets: B-2
Setup: `plan=free&role=owner&members=ravi@acme.test&pending=mia@acme.test` → `Seats 3 / 3`
Steps: type `asha@acme.test`, press **Send invite**
Expected: error "Seat limit reached. Upgrade to Pro to add more people."; pending has only `mia@acme.test`; `Seats 3 / 3`
Working: 1 owner + 1 member + 1 pending = 3 = limit → refused

### TC-14 Free plan one below the limit with a pending invite
Covers: R-14, R-16, R-17, R-18 · Risk: high · Type: boundary (just below)
Setup: `plan=free&role=owner&pending=mia@acme.test` → `Seats 2 / 3`
Steps: type `asha@acme.test`, press **Send invite**
Expected: message "Invite sent to asha@acme.test"; pending rows `mia@acme.test`, `asha@acme.test`; `Seats 3 / 3`
Working: 1 + 0 + 1 = 2 < 3 → allowed; after 3

### TC-15 Pro plan header counts members and pending
Covers: R-15, R-16, R-17 · Risk: medium · Type: positive
Setup: `plan=pro&role=owner&members=ravi@acme.test&pending=mia@acme.test`
Steps: open the Members screen
Expected: header shows `Seats 3 / 10` (the Pro plan label has no source and is not asserted, F-20)
Working: 1 + 1 + 1 = 3; Pro limit 10

### TC-16 Pro plan at the limit, reached with a pending invite
Covers: R-15, R-16, R-18 · Risk: high · Type: boundary (at limit) · Targets: B-2
Setup: `plan=pro&role=owner&members=<8 Pro members>&pending=p1@acme.test` → `Seats 10 / 10`
Steps: type `asha@acme.test`, press **Send invite**
Expected: error "Seat limit reached. Upgrade to Pro to add more people." (PRD §3 text as written; wording on Pro is NH-2);
pending only `p1@acme.test`; `Seats 10 / 10`
Working: 1 + 8 + 1 = 10 = limit → refused

### TC-17 Pro plan one below the limit
Covers: R-15, R-18 · Risk: medium · Type: boundary (just below)
Setup: `plan=pro&role=owner&members=<8 Pro members>` → `Seats 9 / 10`
Steps: type `asha@acme.test`, press **Send invite**
Expected: message "Invite sent to asha@acme.test"; pending row `asha@acme.test`; `Seats 10 / 10`
Working: 1 + 8 = 9 < 10 → allowed; after 10

### TC-18 Revoke removes the invite and frees its seat
Covers: R-19, R-20 · Risk: high · Type: state
Setup: `plan=free&role=owner&members=ravi@acme.test&pending=mia@acme.test` → `Seats 3 / 3`
Steps: press **Revoke** on `mia@acme.test`
Expected: pending shows "(none)"; header `Seats 2 / 3`
Working: 3 − 1 pending = 2

### TC-19 A seat freed by revoke can be used straight away
Covers: R-18, R-20 · Risk: high · Type: state · Targets: B-2 (step 2)
Setup: as TC-18 (`role=owner`, `Seats 3 / 3`)
Steps:
1. Type `asha@acme.test`, press **Send invite**
2. Check: error "Seat limit reached. Upgrade to Pro to add more people."; pending only `mia@acme.test`
3. Press **Revoke** on `mia@acme.test`
4. Type `asha@acme.test`, press **Send invite**
Expected (after step 4): message "Invite sent to asha@acme.test"; pending only `asha@acme.test`; `Seats 3 / 3`
Working: 3/3 → refused; revoke → 2/3; send → 3/3. Step 2 proves the seat was really full before revoke (F-4)

### TC-20 Admin can revoke
Covers: R-8, R-19 · Risk: medium · Type: positive
Setup: `plan=free&role=admin&members=adi@acme.test:admin&pending=mia@acme.test` → `Seats 3 / 3`
Steps: press **Revoke** on `mia@acme.test`
Expected: pending "(none)"; `Seats 2 / 3`

### TC-21 Members listed with roles, then pending invites
Covers: R-9 · Risk: low · Type: positive · Regression: A-2
Setup: `plan=pro&role=owner&members=ravi@acme.test,adi@acme.test:admin&pending=mia@acme.test`
Steps: open the Members screen
Expected: the Members section has exactly 3 rows: `owner@acme.test` Owner, `ravi@acme.test` Member,
`adi@acme.test` Admin (row order within the section not asserted, F-21); the Pending section, below Members,
lists `mia@acme.test` with **Revoke**

### TC-22 Invite page shows the workspace, the email and Join
Covers: R-21 · Risk: low · Type: positive
Setup: `view=accept&invite=asha@acme.test&age=0`
Steps: open the invite page
Expected: heading "You're invited to Acme"; text `asha@acme.test`; button **Join workspace**

### TC-23 Joining with a valid link makes the person a Member
Covers: R-22, R-23, R-24 · Risk: high · Type: positive
Setup: `view=accept&invite=asha@acme.test&age=0`
Steps: press **Join workspace**
Expected: message "You joined Acme"; app state members include `asha@acme.test` with role `member`; app state has no pending invite for `asha@acme.test`

### TC-24 Accepting does not use a new seat
Covers: R-25 · Risk: medium · Type: positive
Setup: as TC-23
Steps:
1. Read app state: members = 1 (owner), pending = 1 (asha), seats used = 2
2. Press **Join workspace**, wait for "You joined Acme"
Expected: members = 2, pending = 0, seats used = 2 (each asserted separately, F-12)
Working: members 1 → 2, pending 1 → 0; 1 + 1 = 2 before, 2 + 0 = 2 after

### TC-25 Link one second before 7 days still works
Covers: R-22, R-26 · Risk: high · Type: boundary (just below)
Setup: `view=accept&invite=asha@acme.test&age=604799`
Steps: press **Join workspace**
Expected: "You joined Acme"; `asha@acme.test` is a member in app state
Working: 604 799 s < 604 800 s → valid

### TC-26 Link at exactly 7 days is expired
Covers: R-26, R-27 · Risk: high · Type: boundary (at limit) · Targets: B-3
Setup: `view=accept&invite=asha@acme.test&age=604800`
Steps: press **Join workspace**
Expected: error "This invite has expired"; "You joined Acme" is not shown; app state members = [`owner@acme.test`] only; app state pending = [`asha@acme.test`] (nothing changes)
Working: valid only while now < sentAt + 604 800 s; now = sentAt + 604 800 → not valid

### TC-27 Link one second past 7 days is expired
Covers: R-27 · Risk: high · Type: boundary (just past)
Setup: `view=accept&invite=asha@acme.test&age=604801`
Steps: press **Join workspace**
Expected: error "This invite has expired"; "You joined Acme" is not shown; app state members = [`owner@acme.test`]; app state pending = [`asha@acme.test`]

### TC-28 Double click on Join creates exactly one member
Covers: R-28 · Risk: high · Type: repeat · Targets: B-5
Setup: `view=accept&invite=asha@acme.test&age=0`, with the browser clock under test control (paused) from page load
Steps:
1. Double-click **Join workspace** (one action, two clicks)
2. Check: no message is shown yet (both clicks went in before any response)
3. Let 1 000 ms of clock time pass (more than two 400 ms responses)
Expected: app state members contain `asha@acme.test` exactly once; members = 2; no pending invite for `asha@acme.test`.
The final message is not asserted: which response renders last is not specified (NH-11, R2-1)
Working: owner + asha = 2. Check runs only after both responses have landed (F-1)

### TC-29 Pressing Join again after joining does not add a second member
Covers: R-28 · Risk: high · Type: repeat
Setup: as TC-28 (clock under test control)
Steps:
1. Press **Join workspace**; let 400 ms pass; wait for "You joined Acme"
2. If **Join workspace** is still shown and enabled, press it again (R2-2); let 1 000 ms pass
Expected: app state members contain `asha@acme.test` exactly once; members = 2. The second message is not specified (NH-11) and not asserted.

### TC-30 Members screen loads with plan and seats (Free, owner only)
Covers: R-17 · Risk: low · Type: positive · Regression: A-1, A-6
Setup: `role=owner` (no other params)
Steps: open the Members screen
Expected: heading "Acme"; `Free plan · Seats 1 / 3` as in the design mock (S-3); member `owner@acme.test` Owner; pending "(none)"; no page errors

### TC-31 At the limit, a pending duplicate gets "Already invited"
Covers: R-13, R-18 (error order, Q-5 default) · Risk: medium · Type: negative
Setup: `plan=free&role=owner&members=ravi@acme.test&pending=mia@acme.test` → `Seats 3 / 3`
Steps: type `mia@acme.test`, press **Send invite**
Expected: error "Already invited"; pending only `mia@acme.test`; `Seats 3 / 3`

### TC-32 At the limit, a member's email gets "Already a member"
Covers: R-12, R-18 (error order, Q-5 default) · Risk: medium · Type: negative
Setup: `plan=free&role=owner&members=ravi@acme.test,mia@acme.test` → `Seats 3 / 3`
Steps: type `ravi@acme.test`, press **Send invite**
Expected: error "Already a member"; pending "(none)"; `Seats 3 / 3`

### TC-33 A full workspace can still accept its pending invite
Covers: R-22, R-25 · Risk: high · Type: state (F-6, source S-2 §3 "so a workspace can never end up with more people…", §5)
Setup: `view=accept&plan=free&members=ravi@acme.test&invite=asha@acme.test&age=0` → seats used 3 of 3
Steps: press **Join workspace**
Expected: "You joined Acme"; app state members = 3 including `asha@acme.test`; pending = 0; seats used = 3
Working: before 1 + 1 members + 1 pending = 3; after 3 members + 0 pending = 3

### TC-34 Double press of Send invite creates one invite
Covers: R-13, R-16 · Risk: high · Type: repeat (F-9)
Setup: `plan=free&role=owner` (`Seats 1 / 3`), clock under test control
Steps: type `asha@acme.test`; double-click **Send invite**; let 1 000 ms pass
Expected: exactly one pending row `asha@acme.test`; `Seats 2 / 3`; the message shown is "Invite sent to asha@acme.test"
(NH-8 default) or "Already invited" (a correct answer to the second submit per R-13, R2-3)
Working: 1 + 1 = 2

### TC-35 Revoking one of two invites leaves the other
Covers: R-19, R-20 · Risk: medium · Type: state (F-5)
Setup: `plan=free&role=owner&pending=mia@acme.test,lee@acme.test` → `Seats 3 / 3`
Steps: press **Revoke** on `mia@acme.test`
Expected: pending has exactly one row, `lee@acme.test`; `Seats 2 / 3`
Working: 1 + 2 = 3; −1 = 2

### TC-36 Duplicate check after a send with different case
Covers: R-10, R-13 · Risk: high · Type: negative · Targets: B-1 (F-7)
Setup: `plan=free&role=owner` (`Seats 1 / 3`)
Steps:
1. Type `Asha@Acme.test`, press **Send invite**, wait for the message
2. Type `asha@acme.test`, press **Send invite**
Expected: error "Already invited"; exactly one pending row, `asha@acme.test`; `Seats 2 / 3`

### TC-37 Filling the Free plan through the UI
Covers: R-14, R-16, R-18 · Risk: high · Type: boundary (at limit) · Targets: B-2 (F-10)
Setup: `plan=free&role=owner` (`Seats 1 / 3`)
Steps:
1. Send `a1@acme.test` → "Invite sent to a1@acme.test", `Seats 2 / 3`
2. Send `a2@acme.test` → "Invite sent to a2@acme.test", `Seats 3 / 3`
3. Send `a3@acme.test`
Expected (step 3): error "Seat limit reached. Upgrade to Pro to add more people."; pending rows exactly `a1@acme.test`, `a2@acme.test`; `Seats 3 / 3`
Working: 1 + 2 pending = 3 = limit → refused

## Coverage
| Req | Risk | Cases | Techniques | Gap? |
|---|---|---|---|---|
| R-1 | medium | TC-1 | positive | — |
| R-2 | medium | TC-2 | positive | — |
| R-3 | high | TC-3 (+ TC-1, TC-2 show the form for Owner/Admin) | decision table (role), negative | — |
| R-4 | high | TC-4 (UI-reachable revoke part) | negative | partial: server half → API-1, API-2 |
| R-5 | low | TC-1 | in case | — |
| R-6 | low | TC-1 | in case | — |
| R-7 | medium | TC-1, TC-2 | positive | — |
| R-8 | low | TC-1, TC-20 | in case | — |
| R-9 | low | TC-21 | positive | — |
| R-10 | high | TC-5, TC-6, TC-8, TC-36 | input variants, negative, repeat | accept-side normalisation → API-4 |
| R-11 | medium | TC-10, TC-11 | equivalence classes, boundary both sides | — |
| R-12 | medium | TC-8, TC-9, TC-32 | negative | — |
| R-13 | high | TC-6, TC-7, TC-31, TC-34, TC-36 | negative, variant, repeat | — |
| R-14 | high | TC-12, TC-13, TC-14, TC-37 | boundary both sides, via UI | — |
| R-15 | medium | TC-15, TC-16, TC-17 | boundary both sides | — |
| R-16 | high | TC-13, TC-14, TC-15, TC-16, TC-34, TC-37 | boundary, header, repeat | — |
| R-17 | medium | TC-1, TC-14, TC-15, TC-30 | in case | — |
| R-18 | high | TC-12, TC-13, TC-14, TC-16, TC-17, TC-19, TC-31, TC-32, TC-37 | boundary both sides, state, error order | — |
| R-19 | medium | TC-18, TC-20, TC-35 | state | — |
| R-20 | high | TC-18, TC-19, TC-35 | state transition | — |
| R-21 | low | TC-22 | positive | — |
| R-22 | high | TC-23, TC-25, TC-33 | positive, boundary, state | — |
| R-23 | low | TC-23 | in case | — |
| R-24 | low | TC-23 | in case | — |
| R-25 | medium | TC-24, TC-33 | positive, state | — |
| R-26 | high | TC-25, TC-26 | boundary both sides | server side → API-5 |
| R-27 | high | TC-26, TC-27 | boundary, negative | — |
| R-28 | high | TC-28, TC-29 | repeat | partial: retry after failure, two tabs → API-6 / integration |

Likely bugs: B-1 → TC-5, TC-6, TC-8, TC-36 · B-2 → TC-13, TC-16, TC-19, TC-37 · B-3 → TC-26 · B-4 → TC-3, TC-4 · B-5 → TC-28.
Regression areas: A-1/A-6 → TC-30; A-5 → TC-15 (limit 10); A-2 → TC-21.

## Not covered
API-level cases for the team (the demo build has no server; Q-7 default):
- API-1 (R-4) Member `POST /workspaces/:id/invites` `{ email: "asha@acme.test" }` is refused; no invite is created; seats unchanged. Status code not in RFC-7 (ask).
- API-2 (R-4) Member `DELETE /workspaces/:id/invites/mia@acme.test` is refused; `mia@acme.test` stays pending.
- API-3 (R-4) Owner and Admin can do both (control for API-1/2).
- API-4 (R-10) `POST /invites/accept` `{ email: "Asha@Acme.test" }` for pending `asha@acme.test` succeeds; exactly one member `asha@acme.test`. Not reachable in the demo (the `invite` param sets both the pending email and the accept email).
- API-5 (R-26) `POST /invites/accept` at sentAt + 604 800 s → 410 `expired`, no member; at sentAt + 604 799 s → success.
- API-6 (R-28) Same accept body sent twice, and retried after a forced 5xx/timeout → exactly one member, invite removed.

Other:
- Revoked link opened by the invitee (Q-3, NH-3): state does not cross page loads in the demo. Needs an integration environment.
- Expired invite still using a seat / staying in Pending (Q-4): unanswered, left untested by the default.
- Two tabs / two admins taking the last seat at once (NH-10): not reachable in the demo.
- Revoke pressed while a send is in flight (NH-9): no source for the expected result.
- Accepting an invite whose email is already a member (G-7, NH-7): no source.
- Field content after an error (G-8): no source.
- Security observations with no source requirement (O-1 HTML injection, invite link without a token, test seam
  exposure; NH-4 … NH-6): reported in 12 for the team, no cases.

## Changes from review
Round 1 (04 findings): TC-1 Expected lines tagged with R-ids (F-24). TC-3 asserts absence by role and name (F-14).
TC-4 asserts the outcome, not a hidden control, and is traced to R-4/S-2 §2 (F-3, F-15). TC-5 exact, case-sensitive and
checks stored state (F-2, F-19). TC-6, TC-8 check app state (F-17). TC-10 adds 5 inputs (F-11, F-18). TC-11 uses `a@b.c` (F-16).
TC-15 drops the unsourced `Pro plan` label (F-20). TC-16, TC-17 write out the emails; TC-17 checks the row (F-22).
TC-18–TC-20 set the role (F-23). TC-19 first proves the plan is full (F-4). TC-21 doesn't assert row order (F-21).
TC-24 asserts members and pending separately (F-12). TC-26, TC-27 check no success message and the app state (F-25).
TC-28, TC-29 use a controlled clock (F-1, F-8, F-13).
Round 2: TC-28 no final-message check (R2-1); TC-29 second press only if Join is still enabled (R2-2); TC-34 accepts either
message (R2-3); Test data: exact matching scope, clock pause, replace-not-append (R2-4, R2-5, R2-8); TC-3 visible check (R2-6);
TC-4 shares the Revoke locator with TC-20 (R2-7). New: TC-33 (F-6), TC-34 (F-9), TC-35 (F-5), TC-36 (F-7), TC-37 (F-10).
API-1 … API-6 written out (F-26, F-27, F-28). Coverage table rows R-4, R-14, R-18 corrected (F-29, F-30).
