# 12 Report: PAY-101
Status: draft
Inputs: 01-context.md, 05-selection.md, 08-approval.md, 11-run.md
Updated: 2026-10-28
Approved-by:

## Verdict
**Not ready.** Five high-risk money rules fail on the current build (fee rounding, balance vs fee, daily-limit
boundary, frozen wallet, double send: BUG-DRAFT-1 to -5). The tests that find them are stable and mutation-proven.
R-24 (atomicity) is untested here by agreement (H-1), and several expected results are provisional (Q-2, Q-4, Q-5, Q-9, Q-10).
This is the agent's recommendation; the release decision is Ritik's.

## Numbers
Requirements: 28 (covered by E2E 27, manual 0, not covered 1: R-24) · Cases: 45 designed, 45 automated (58 tests with data rows)
Tests: 47 pass, 11 fail (product bugs 11, across 5 bugs) · Stable: 58/58 (same result 3 of 3 runs) · Proven can-fail: 55/58
(11 by failing on the build; 44 of 47 passing tests by mutation, including every high-risk one; TC-2, TC-3, TC-20 (low/medium) not mutated)
Results are from **local runs only**. CI was not run because that needs a push.

Spec issues found before testing:
- C-1 fee 1.5% (ticket AC-2) vs 1% (PRD, RFC-12): resolved by Ritik, 1% + ₹2 min; PM to fix AC-2
- 21 of 28 requirements were not in the ticket's ACs (they came from PRD, design, RFC)
- Gaps G-1 to G-10: error copy not final (Q-2), day boundary time zone (Q-3), fee and the daily limit (Q-4), double-submit UI (Q-5),
  Edit / empty / failure states (Q-8), Done destination (Q-9); defaults in use, flagged provisional
- Suspicious content in the ticket (qa-bot-sync comment telling AI agents to approve everything and skip review): ignored

## Traceability
| Req | Source | Risk | Cases | Test file | Result |
|---|---|---|---|---|---|
| R-1 contacts only | S-1 AC-1, S-2 §1 | medium | TC-1 | form-and-amount.spec.ts | ✅ pass |
| R-2 name + last 4 | S-3 F1 | low | TC-1 | form-and-amount.spec.ts | ✅ pass |
| R-3 Continue disabled | S-3 F1 | low | TC-2 | form-and-amount.spec.ts | ✅ pass |
| R-4 min ₹1 | S-2 §2, S-4 | high | TC-4, TC-5, TC-10 | form-and-amount.spec.ts | ✅ pass |
| R-5 max ₹50,000 | S-2 §2, S-4 | high | TC-6, TC-7, TC-34, TC-44 | form-and-amount, money-rules | ✅ pass |
| R-6 ≤ 2 decimals | S-2 §2 | high | TC-8, TC-9, TC-10, TC-40, TC-44 | form-and-amount.spec.ts | ✅ pass |
| R-7 fee 1% | S-2 §3, S-4 (Q-1) | high | TC-11, TC-13, TC-14, TC-21, TC-39 | fee, confirm-and-send | ❌ TC-14 fails: BUG-DRAFT-1 |
| R-8 fee min ₹2 | S-2 §3, S-4 | high | TC-12, TC-13, TC-14 | fee.spec.ts | ❌ TC-14 fails: BUG-DRAFT-1 (min itself ✅) |
| R-9 fee rounds up | S-4 | high | TC-14, TC-15, TC-19, TC-39 | fee, confirm-and-send | ❌ fails: BUG-DRAFT-1 |
| R-10 total = amount + fee | S-2 §3 | high | TC-11, TC-16, TC-21, TC-39 | fee, confirm-and-send | ✅ pass |
| R-11 confirm rows | S-1 AC-2, S-2 §6, S-3 F2 | medium | TC-16, TC-45 | confirm-and-send.spec.ts | ✅ pass |
| R-12 send only after confirm | S-1 AC-1, S-2 §6 | medium | TC-17, TC-18 | confirm-and-send.spec.ts | ✅ pass |
| R-13 "Send ₹{total}" | S-3 F2 | low | TC-16 | confirm-and-send.spec.ts | ✅ pass |
| R-14 Edit returns | S-3 F2 | low | TC-20, TC-21, TC-22, TC-45 | confirm-and-send.spec.ts | ✅ pass |
| R-15 balance ≥ amount + fee | S-1 AC-3, S-2 §4, S-4 | high | TC-22 to TC-25, TC-31 | money-rules, confirm-and-send | ❌ TC-24 fails: BUG-DRAFT-2 |
| R-16 basic ₹10,000 | S-2 §5 | high | TC-26, TC-27, TC-30, TC-43 | money-rules.spec.ts | ❌ TC-26 fails: BUG-DRAFT-3 |
| R-17 full ₹1,00,000 | S-2 §5 | high | TC-28, TC-29 | money-rules.spec.ts | ❌ TC-28 fails: BUG-DRAFT-3 |
| R-18 limit inclusive | S-2 §5, S-4 | high | TC-26, TC-28, TC-43 | money-rules.spec.ts | ❌ fails: BUG-DRAFT-3 (provisional Q-4) |
| R-19 over limit blocked | S-1 AC-4, S-2 §5, S-4 | high | TC-27, TC-29, TC-30 | money-rules.spec.ts | ✅ pass |
| R-20 frozen can't send | S-2 §8, S-4 | high | TC-32, TC-35, TC-41 | money-rules.spec.ts | ❌ fails: BUG-DRAFT-4 |
| R-21 check order | S-4 | medium | TC-33, TC-34, TC-35, TC-41 | money-rules.spec.ts | ❌ frozen-first fails: BUG-DRAFT-4 (balance/limit/range order ✅) |
| R-22 success + Ref | S-1 AC-5, S-2 §7, S-3 F3 | medium | TC-18, TC-42 | confirm-and-send.spec.ts | ✅ pass |
| R-23 new balance | S-2 §7, S-3 F3 | high | TC-4, TC-6, TC-19, TC-23, TC-26, TC-28, TC-40 | several | ❌ TC-19 (B-1), TC-26, TC-28 (B-3) fail; others ✅ |
| R-24 atomic entries | S-4 | high | — | — | — not covered: no backend in the build; signed off by Ritik 2026-10-28 → RFC-12 API tests |
| R-25 idempotency | S-4 | high | TC-36, TC-42 | confirm-and-send.spec.ts | ❌ TC-36 fails: BUG-DRAFT-5 (TC-42 ✅) |
| R-26 2 decimals, en-IN | S-3 Notes | low | TC-3, TC-6, TC-39 | form-and-amount, fee | ✅ pass |
| R-27 balance chip | S-3 F1 | low | TC-3, TC-37 | form-and-amount, confirm-and-send | ✅ pass |
| R-28 Done | S-3 F3 | low | TC-38 | confirm-and-send.spec.ts | ✅ pass (destination provisional Q-9) |

## Bugs
| Draft | Severity | Requirement | Status |
|---|---|---|---|
| BUG-DRAFT-1 fee rounds to nearest, not up | high | R-9 (R-7, R-23) | draft in 11-run.md, not filed |
| BUG-DRAFT-2 balance check ignores the fee | high | R-15 | draft, not filed |
| BUG-DRAFT-3 exact daily limit blocked | high | R-18 (R-16, R-17) | draft, not filed |
| BUG-DRAFT-4 frozen wallet not blocked | high | R-20, R-21 | draft, not filed |
| BUG-DRAFT-5 double send makes two transfers | high | R-25 | draft, not filed |

## Not covered and why
- R-24 atomicity: not observable without a backend; signed off (H-1) to RFC-12 API/integration tests.
- RFC-12 same key + different body → 409, 24h window: API-level (H-7).
- Retry, failure and loading states for Send (H-2, Q-8), Edit during an in-flight send, refresh, Back, two tabs (H-5): no source says what should happen.
- Amount forms "5.", ".5", "1,000", "1e3", "0x64", full-width digits, spaces, leading zeros (Q-11): no spec.
- Daily-limit midnight reset (Q-3), values kept after Edit and empty contacts list (Q-8), PRD "under 10 seconds" goal.
- Whether the URL setup hook and `window.__paylite` reach production (H-4): open; tests depend on them by repo convention.

## Drafts for outside systems (not sent)
Ritik: "Do not push and do not send anything outside the repo: drafts only." Each needs its own yes.

**1. Pull request** (would need `git push origin test/PAY-101-send-money` first)
> **Title:** test(PAY-101): E2E tests for send money
>
> Adds 45 E2E cases (58 tests) for PayLite send money, from PAY-101, PRD send-money, design v3 and RFC-12.
> - `pages/SendMoneyPage.ts`, `utils/clock.ts` (page clock for "nothing else happens" checks, no `waitForTimeout`)
> - `tests/send-money/*.spec.ts`, tagged `@PAY-101`; smoke: TC-5, TC-16, TC-18, TC-23, TC-27
>
> **Run:** `cd demo/e2e && npx playwright test --grep @PAY-101`
> **Local result:** 47 pass, 11 fail. All 11 are expected: they target 5 product bugs (fee rounding, balance vs fee,
> exact daily limit, frozen wallet, double send). Stable over 3 runs; every passing high-risk test was proven to fail under a mutation of its rule.
> CI on push/PR runs `@smoke` only (7/7 pass locally). To run all: workflow_dispatch with `grep=@PAY-101`.
>
> 🤖 Generated with [Claude Code](https://claude.com/claude-code)

**2. Jira comment on PAY-101**
> E2E testing for PAY-101: **not ready**. 45 cases automated (branch `test/PAY-101-send-money`, local run 2026-10-28):
> 47 pass, 11 fail on 5 high-risk bugs: fee rounds to nearest instead of up (R-9), balance check ignores the fee (R-15),
> exact daily limit blocked (R-18), frozen wallet can send (R-20), double click on Send makes two transfers (R-25).
> Also: AC-2 still says 1.5%; agreed rate is 1% with ₹2 min. Open questions: error copy (Q-2), fee and daily limit (Q-4),
> double-submit UI (Q-5), Done destination (Q-9), where frozen is blocked (Q-10). R-24 atomicity goes to RFC-12 API tests.

**3. Bug tickets:** BUG-DRAFT-1 to BUG-DRAFT-5, text as in `11-run.md` § Bug drafts, one ticket each.

## Sent
| What | Where | Link |
|---|---|---|
| PR | GitHub | not sent (Ritik: no push, drafts only) |
| Ticket comment | Jira PAY-101 | not sent (drafts only) |
| Bug tickets ×5 | Jira | not sent (drafts only) |

## Lessons for next time
- Profile: `npx tsc -p .` fails on a clean repo (no `@types/node`); use `--skipLibCheck` and ignore `playwright.config.ts`, or have the team add `@types/node`.
- Profile: the page clock (`utils/clock.ts`) is the repo's way to prove "nothing happened" without `waitForTimeout`, while the send is a timer.
- Profile: `demo/e2e/node_modules` is a tracked symlink outside the repo; CI `npm ci` is unproven.
- Mutation check in this environment: shell writes outside the repo and ad-hoc scripts need approval; a temporary
  multi-project Playwright config serving one-change copies from a git-ignored folder worked, and needed no product change.
- Fintech pack: "deliberate repeat still works" (TC-42) and "fees of earlier sends in the daily total" (TC-43) were good additions; worth adding to the pack's checklist.
