# 04 Test review: TEAM-42
Status: approved
Inputs: 01-context.md, 02-impact.md, 03-design.md
Updated: 2026-10-28
Approved-by: Ritik (standing answer 2026-10-28: approve 03 and 04 when the review has no open blockers; 'needs human' items use the suggested default)

## Progress
- [x] QA architect (independent sub-agent)
- [x] Product analyst (independent sub-agent)
- [x] Devil's advocate round 1 (independent sub-agent)
- [x] Security (feature has roles and an input field; independent sub-agent)
- [x] Reliability (feature changes data through a simulated server; independent sub-agent)
- [x] Round 1 fixes applied to 03
- [x] Devil's advocate round 2 (changed cases only): no blockers; 2 majors and 6 minors fixed

## Summary
5 personas ran as separate sub-agents. Each read only the artifacts and sources and no test code. Round 1 raised
4 blockers (F-1 to F-4) and 11 majors, all fixed in 03. Nothing was rejected outright; 3 findings were partly
rejected with reasons. 11 items needed a human, and each was resolved with its suggested default under Ritik's standing
answer. The design went from 32 to 37 cases. Round 2 (devil's advocate on changed cases): 0 blockers, all fixed.
Every calculated value (seat counts, 604 800 s, the regex boundaries) was recomputed by the devil's advocate and
again by the designer after the fixes.

## Findings
| ID | Persona | Case or Req | Finding | Severity | Outcome |
|---|---|---|---|---|---|
| F-1 | Devil's advocate, Reliability | TC-28 | The check runs when the first response renders, so the second accept may not have landed yet. B-5 can falsely pass | blocker | fixed in TC-28 (controlled clock, check after 1 000 ms) |
| F-2 | Devil's advocate | TC-5 | Text matching that ignores case or allows substrings passes on B-1 | blocker | fixed in TC-5 and Test data (exact, case-sensitive, stored state) |
| F-3 | Product analyst | TC-4 | "No Revoke control" has no source; PRD §2 only says a Member cannot revoke | blocker | fixed in TC-4 (outcome only) |
| F-4 | QA architect | TC-19 | Passes on the build even with B-2, because the send after revoke succeeds either way | blocker | fixed in TC-19 (first prove 3/3 refuses) |
| F-5 | QA architect | TC-18/20 | A single pending row can't tell "revoke one" from "clear all" | major | fixed in TC-35 |
| F-6 | Product analyst | R-22, R-25 | No case accepts into a full workspace | major | fixed in TC-33 |
| F-7 | QA architect | R-10, R-13 | No duplicate check after a UI send in the same session | major | fixed in TC-36 |
| F-8 | Reliability | TC-28 | Two separate clicks: the race isn't guaranteed and a fixed build could time out | major | fixed in TC-28 (single dblclick, assert no message before time passes) |
| F-9 | Reliability | G-5 / R-13, R-16 | Double **Send invite**: the data outcome is sourced (one invite, seats), only the message isn't | major | fixed in TC-34; message → NH-8 |
| F-10 | QA architect | R-14, R-18 | The limit is only reached with seeded data, never through the UI | major | fixed in TC-37 |
| F-11 | QA architect, Devil's advocate | TC-10 | Missing regex boundaries (empty local, domain, TLD) | major | fixed in TC-10 |
| F-12 | Devil's advocate | TC-24 | Asserting only the sum passes when nothing changes | major | fixed in TC-24 |
| F-13 | Devil's advocate, Reliability | TC-29 | Nothing to wait on after the second click | major | fixed in TC-29 (controlled clock) |
| F-26 | Product analyst, Security, QA architect | R-4 | High risk with no case and no named API hand-off | major | partly fixed: TC-4 covers the UI-reachable part; API-1 to API-3 written in 03. Rejected: an E2E bypass case, because the build exposes no action functions (only `window.__teamhub.workspace`), so no bypass exists |
| F-27 | Product analyst | R-10 | Normalisation on accept isn't tested | major | rejected for E2E: not reachable (the `invite` param sets both the pending email and the accept email); written as API-4 |
| F-28 | Reliability | R-28 | Retry, timeout and partial failure can't be produced (fakeServer never fails) | needs human | default: API-6 plus Not covered; R-28 marked partial |
| F-14 | Devil's advocate, Security | TC-3 | Text check can hit the "Invite by email" heading; hiding with CSS would pass | minor | fixed (role + name, count 0) |
| F-15 | Security, QA architect | TC-4 | Traceability: claims R-4 while the table shows "—" | minor | fixed (traced to R-4 UI part + S-2 §2; table shows partial) |
| F-16 | Devil's advocate | TC-11 | Shortest valid is `a@b.c` | minor | fixed |
| F-17 | Devil's advocate | TC-6, TC-8 | Doesn't check stored state | minor | fixed |
| F-18 | Product analyst | TC-10 / G-4 | Empty input fails the regex; add it | minor | fixed (G-4 default) |
| F-19 | Product analyst | TC-5 | The message's email form isn't specified | minor | fixed (message prefix only; row and state exact) |
| F-20 | Product analyst | TC-15 | `Pro plan` label has no source | minor | fixed (not asserted) |
| F-21 | Product analyst | TC-21 | No source for the order within Members | minor | fixed |
| F-22 | Devil's advocate | TC-16, TC-17 | `…` in the setup; TC-17 doesn't check the row | minor | fixed |
| F-23 | Security | TC-18, TC-19 | Owner role only by default | minor | fixed (`role=owner` everywhere) |
| F-24 | QA architect | TC-1 | Six requirements in one case | minor | fixed (Expected lines tagged); kept as one case per 02's "in another case" depth |
| F-25 | Product analyst, Devil's advocate | TC-26, TC-27 | No check that the success message is absent; state reading not spelled out | minor | fixed |
| F-29 | QA architect | Coverage R-18, R-14 | Rows don't match the case headers | minor | fixed |
| F-30 | QA architect | TC-23/24 | Duplicate setup | minor | partly fixed: TC-24 kept separate with before/after reads (R-25 has its own risk) |
| F-31 | Product analyst | AC-5 / Q-6 | Record what the page shows when it opens | minor | rejected: Q-6 default (assert after Join) was approved in 01; a non-failing "record" step isn't a test |
| F-32 | Product analyst | TC-1 | Revoke is a link in the design and a button in the PRD | minor | fixed in Test data: locate by name, not by role |
| F-33 | Security | R-26 server | Expiry off-by-one on a real server | minor | fixed as API-5 |

## Needs a human (resolved with the suggested default, per Ritik's standing answer 2026-10-28)
| ID | Question | Default used |
|---|---|---|
| NH-1 | 01 has no separate requirement for "a Member cannot revoke (UI)" (PRD §2 table) | Keep TC-4 traced to R-4 and S-2 §2. Suggest adding R-29 to 01 in a later update, which would make 02–04 stale |
| NH-2 | Which message shows at the Pro limit? ("Upgrade to Pro" makes no sense on Pro) | Keep the PRD §3 text; ask pm-lena |
| NH-3 | Rule for a revoked link (Q-3) | Not covered; ask PM/dev |
| NH-4 | The invite link has no token; anyone who knows the email can join | No case (no source); raise in 12 |
| NH-5 | O-1 HTML injection through the email and the `invite` param | No case (no source); raise in 12 |
| NH-6 | `window.__teamhub` and URL-param setup in production builds | Confirm they're excluded; raise in 12 |
| NH-7 | Accept when the email is already a member (G-7) | Not covered |
| NH-8 | Message after a double **Send invite** | "Invite sent to asha@acme.test", no error |
| NH-9 | Revoke during an in-flight send re-enables **Send invite** | Not covered (no source); raise in 12 |
| NH-10 | Two tabs / two admins / retry after failure | Not covered; API-6 / integration |
| NH-11 | Message for a second accept after success | Not asserted |

## Rounds
- Round 1: 4 blockers, 11 majors, 18 minors/needs-human → all blockers and majors fixed in 03 (32 → 37 cases)
- Round 2 (devil's advocate on changed and new cases): **0 blockers**, 2 majors, 6 minors → all fixed in 03. All numbers
  recomputed and correct; every `Targets: B-n` case fails on the current build.

| ID | Case | Finding | Severity | Outcome |
|---|---|---|---|---|
| R2-1 | TC-28 | "You joined Acme" check fails a correct fix where the second call's error renders last | major | fixed: app state only |
| R2-2 | TC-29 | A correct product that disables Join after joining makes the second press time out | major | fixed: press only if still enabled |
| R2-3 | TC-34 | "No error" fails a correct product that answers "Already invited" | minor | fixed: either message |
| R2-4 | Test data | Exact matching on a whole row/header would fail every product | minor | fixed: scope stated |
| R2-5 | Test data | Installing the clock does not pause it | minor | fixed: install at T, pause at T |
| R2-6 | TC-3 | "Absent, not hidden" goes beyond PRD §2 "do not see" | minor | fixed: not visible (F-14's DOM-absence narrowed to match the source) |
| R2-7 | TC-4 | A broken Revoke locator would make the conditional step vacuous | minor | fixed: shares the locator with TC-20 (positive control) |
| R2-8 | TC-19, TC-36 | Typing could append to kept field content | minor | fixed: replace the field content |

Open blockers: none.
