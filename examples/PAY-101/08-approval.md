# 08 Approval: PAY-101
Status: approved
Inputs: 01-context.md, 02-impact.md, 03-design.md, 04-review.md, 05-selection.md, 06-codebase.md, 07-architecture.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28, "At 08 my answer is go", given in advance in the resume message)

## Readiness
- 01 to 07 approved, none stale. Blocking questions Q-1, Q-2 answered in 01. Project profile approved.

## What will be built
- 45 cases as E2E tests (one test per data row, so the run will show more than 45 tests) in
  `demo/e2e/tests/send-money/*.spec.ts`, tagged `@PAY-101`; `@smoke` on TC-5, TC-16, TC-18, TC-23, TC-27; the rest `@regression`
- New: `pages/SendMoneyPage.ts`, `utils/clock.ts`. Extended: nothing
- Branch: `test/PAY-101-send-money`, committed locally only. **No push** (Ritik)

## What they prove
| Req | Risk | Cases |
|---|---|---|
| R-4, R-5, R-6 amount range and format | high | TC-4 to TC-10, TC-40, TC-44 |
| R-7 to R-10 fee 1%, ₹2 min, round up, total | high | TC-11 to TC-15, TC-39 |
| R-15 balance covers amount + fee | high | TC-22 to TC-25, TC-31 |
| R-16 to R-19 daily limits | high | TC-26 to TC-30, TC-43 |
| R-20 frozen | high | TC-32, TC-35, TC-41 |
| R-23 new balance | high | TC-4, TC-6, TC-18, TC-19, TC-23, TC-26, TC-28, TC-40 |
| R-25 no double send | high | TC-36, TC-42 |
| R-1, R-11, R-12, R-21, R-22 | medium | TC-1, TC-16 to TC-18, TC-33 to TC-35, TC-41, TC-45 |
| R-2, R-3, R-13, R-14, R-26 to R-28 | low | TC-1 to TC-3, TC-16, TC-20, TC-37, TC-38 |

## Expected to fail (likely product bugs)
| Bug | Case | Why it will fail |
|---|---|---|
| B-1 | TC-14, TC-15, TC-19 | `fee()` rounds to nearest: ₹2.00 not ₹2.01, ₹2.50 not ₹2.51 |
| B-2 | TC-24 | Only amount checked against balance: confirm opens at ₹101.99 |
| B-3 | TC-26, TC-28 | `>=` blocks the exact-limit send |
| B-4 | TC-32, TC-35, TC-41 | No frozen check: confirm opens (TC-41: range error shows instead) |
| B-5 | TC-36 (both rows) | Send not disabled: two transfers |

## Not automated
- Manual: none. API (suggested to the team, once an API exists): TC-12, TC-39, fee part of TC-40.
- Not covered: R-24 atomicity (signed off by Ritik, goes to API tests); RFC-12 409 / 24h; retry, failure and loading
  states (H-2); Edit during send, refresh, Back, two tabs (H-5); amount forms in Q-11; midnight reset (Q-3); values
  kept after Edit and empty contacts (Q-8); PRD 10 s goal.

## Decisions made so far
- 2026-10-27 Ritik: Q-1 fee is 1% with ₹2 minimum; fintech pack on; other 01 questions use the defaults.
- 2026-10-28 Ritik: 03, 04 approved; H-1 signed off; defaults for every open question (Q-10 block at Continue, H-7 no R-29);
  05 proposal accepted as is; project profile approved; go at 08; no push, nothing sent outside the repo.
- 06: tests use the URL setup hook and `window.__paylite`, per the repo README (H-4 still open for production).

## Risks
- Expected results on Q-2 (error text), Q-4, Q-5, Q-9, Q-10 are provisional. If product answers differ, those tests change.
- CI not exercised: it needs a push. Results in 11 come from local runs only.
- `node_modules` is a symlink outside the repo; a clean CI `npm ci` is not proven by this run.

## Go / no-go
**Go**, Ritik, 2026-10-28.
