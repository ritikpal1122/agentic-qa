# 02 Impact: PAY-101
Status: approved
Inputs: 01-context.md
Sources: build:demo/app/index.html@sha256-e153f86b
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28)

## Progress
- [x] Evidence picked (build, no diff)
- [x] Changes listed
- [x] Blast radius
- [x] Risk per requirement
- [x] Regression areas
- [x] N-1 and N-4a applied to 01 (R-27, R-28 added; B-1 example fixed), approved by Ritik 2026-10-28

## Summary
Evidence: build (confidence: **medium**). The repo has no commits and no PR, so there is no diff; the whole feature
in `demo/app/index.html` is treated as new. It is one self-contained page (164 lines); no other product code exists
in the repo, so the blast radius stays inside the send flow and the wallet state it mutates.
Riskiest parts: the money rules in the Continue handler and `fee()` (4 of the 5 likely bugs from 01 live there) and
the Send handler (no double-submit guard). 16 of 28 requirements are high risk, all because they move or price money.

Build version note: the file's mtime moved from 17:33 (read in 01) to 19:54, the same time as every source file, so it
looks like a re-copy. There is no commit to compare. The content still matches every 01 observation (B-1 to B-5,
error texts in G-1, test hooks in G-7), so 01 was **not** marked stale.

## Changes
| ID | Where | What changed | Serves |
|---|---|---|---|
| CH-1 | `contacts` list + `<select id="contact">` (L79–83, L102–107) | Hard-coded 3 contacts rendered as `Name ••last4`; no free-text recipient | R-1, R-2 |
| CH-2 | `updateContinue()` (L109–113) | Continue enabled only when a contact is picked and the trimmed amount is non-empty | R-3 |
| CH-3 | Continue handler: format check (L119) | Regex `^\d+(\.\d{1,2})?$`; else "Enter a valid amount" | R-6, G-1 |
| CH-4 | Continue handler: paise conversion + range (L120–121) | `Math.round(Number(raw)*100)`; rejects <100 or >5,000,000 paise with "Amount must be between ₹1 and ₹50,000" | R-4, R-5, G-1 |
| CH-5 | Continue handler: balance check (L122) | `amount > balance` → "Insufficient balance". **Ignores the fee (B-2)** | R-15 |
| CH-6 | Continue handler: daily limit (L78, L123) | `LIMITS` basic 1,000,000 / full 10,000,000 paise; `sentToday + amount >= limit` → "Daily limit exceeded". **`>=` not `>` (B-3)**; fee not counted (matches Q-4 default) | R-16, R-17, R-18, R-19 |
| CH-7 | Check order (L119–123) | Format → range → balance → limit. **No frozen check at all (B-4)** | R-20, R-21 |
| CH-8 | `fee()` (L90–92) | `max(200, Math.round(amount*0.01))`. **Rounds half-up/down, not up (B-1)** | R-7, R-8, R-9 |
| CH-9 | Confirm screen fill (L125–132) | To = contact name only; Amount, Fee, Total = amount + fee; button "Send ₹{total}" | R-10, R-11, R-13, G-9 |
| CH-10 | Edit (L135) | Shows the form again; inputs are not cleared | R-14, G-5 |
| CH-11 | Send handler (L137–150) | 400 ms simulated call, then debits amount + fee, adds amount to `sentToday`, pushes one ledger row, shows Ref and new balance. **Button not disabled, no idempotency key (B-5)** | R-12, R-22, R-23, R-24, R-25 |
| CH-12 | `rupees()` (L88) | `en-IN` grouping, exactly 2 decimals | R-26 |
| CH-13 | Balance chip `render()` (L98–100, called on load and after send) | Shows "Balance ₹x" | R-27 |
| CH-14 | Done (L152–157) | Clears contact + amount, returns to form | R-28, Q-9 |
| CH-15 | URL setup params + `window.__paylite` (L70–77, L160) | Test setup and state inspection hooks | not a requirement (test hook, G-7; phase 06 decides) |

CSS and markup-only lines skipped as formatting.

## Blast radius
| ID | Flow affected | Why | How we know | Sure? |
|---|---|---|---|---|
| A-1 | Balance chip on the send form | Send changes `wallet.balance`; chip must show the new value after Done | `render()` called at L147 after the debit | yes |
| A-2 | Second and later sends in the same session | Each send adds to `sentToday` and lowers balance, so the next send's balance and limit checks use updated state | L141–142 mutate shared `wallet` | yes |
| A-3 | Send form after Done | Form reset; stale error text or state could leak into the next send | L152–157 clear inputs but not the error div | yes |
| A-4 | Form after Edit | Amount/contact kept; re-Continue recalculates fee and re-runs checks | L135 only toggles sections; L115 recomputes `pending` | yes |
| A-5 | Ledger / transaction history | One ledger row per send; no separate credit or fee rows | L144 | yes (but see N-3: no UI shows it) |
| A-6 | Any other wallet screen (home, history, statements) | Would read the same balance/ledger | Not in this repo | **possible**: no other product code present; Q-7 epic PAY-100 might name them |

## Risk by requirement
| Req | Impact | Likelihood | Risk | Depth | Reason (for high) |
|---|---|---|---|---|---|
| R-1 contacts only | high | low | medium | medium | |
| R-2 contact label | low | low | low | low | |
| R-3 Continue disabled | low | low | low | low | |
| R-4 min ₹1 | high | medium | **high** | high | Boundary on a money amount; float→paise conversion at L120 sits right at it (0.99 / 1.00) |
| R-5 max ₹50,000 | high | medium | **high** | high | Boundary on a money amount (50,000.00 / 50,000.01) |
| R-6 ≤2 decimals | high | medium | **high** | high | Parsing decides how many paise move; regex rejects forms like ".5", "1.", "1,000" with no spec text (G-1) |
| R-7 fee 1% | high | high | **high** | high | Prices every transfer; source conflict C-1 only just resolved (Q-1) |
| R-8 fee min ₹2 | high | medium | **high** | high | Switch point at amount ₹200 (1% = ₹2) needs both sides |
| R-9 fee rounds up | high | high | **high** | high | Likely bug B-1: `Math.round` undercharges on fractional paise |
| R-10 total = amount + fee | high | medium | **high** | high | Sender is charged this total |
| R-11 confirm rows | high | low | medium | medium | |
| R-12 send only after confirm | high | low | medium | medium | |
| R-13 "Send ₹{total}" | medium | low | low | low | |
| R-14 Edit returns | low | low | low | low | |
| R-15 balance ≥ amount + fee | high | high | **high** | high | Likely bug B-2: wallet can go negative |
| R-16 basic limit ₹10,000 | high | medium | **high** | high | Regulatory KYC limit |
| R-17 full limit ₹1,00,000 | high | medium | **high** | high | Regulatory KYC limit |
| R-18 limit inclusive | high | high | **high** | high | Likely bug B-3: `>=` blocks the exact-limit send |
| R-19 limit exceeded blocks | high | medium | **high** | high | Regulatory; over-limit money must not move |
| R-20 frozen cannot send | high | high | **high** | high | Likely bug B-4: no check exists |
| R-21 check order | medium | medium | medium | medium | |
| R-22 success + Ref | high | low | medium | medium | |
| R-23 new balance | high | medium | **high** | high | Must subtract the fee too; ties R-9 and R-10 together on screen |
| R-24 atomic entries | high | unknown | **high** | high | Partial transfers lose money. **Not observable in this build** (see N-3) |
| R-25 idempotency | high | high | **high** | high | Likely bug B-5: double click can debit twice |
| R-26 2 decimals + en-IN grouping | medium | low | low | low | Cover inside other cases (e.g. a ₹1,00,000.00 balance) |
| R-27 balance chip | medium | low | low | low | Cover inside A-1 regression case |
| R-28 Done | low | low | low | low | Cover inside A-3 regression case; destination per Q-9 default |

High: 16 · medium: 5 (R-1, R-11, R-12, R-21, R-22) · low: 7 (R-2, R-3, R-13, R-14, R-26, R-27, R-28).

## Regression areas
- Balance chip updates after a send (A-1)
- Two sends in a row: second uses the reduced balance and the increased daily total (A-2)
- Done → new send starts clean, no leftover error or confirm data (A-3)
- Edit → change amount → Continue recalculates fee/total and re-runs every check (A-4)

## Notes for test design
- **N-1 (applied to 01 on 2026-10-28 as R-27, R-28; Done destination moved to Q-9):** design S-3 has two items 01 did not list as requirements: the balance chip "Balance ₹{balance}"
  on the send form (Frame 1) and a "Done" button on success (Frame 3). The build implements both (CH-13, CH-14).
  Proposed: add **R-27** balance chip shows the current balance, **R-28** Done returns to an empty send form. Both would
  be low/medium risk; they mainly back the regression areas above.
- **N-2 setup:** every state is reachable through URL params in paise (`balance`, `sent`, `kyc`, `frozen=1`), so
  limit, low-balance and frozen cases need no real money or backend. Whether tests may use this hook is phase 06.
- **N-3 R-24 / R-25 at UI level:** the build has no backend; atomicity (R-24) cannot be observed here, and the ledger
  has one row per send (no debit/credit/fee split). Phase 03 should still design these; phase 05 will likely mark R-24
  as not automatable at E2E in this repo. For R-25, a double click on Send and checking the debit happens once is testable.
- **N-4 boundaries worth hitting:** amounts ₹0.99 / ₹1.00 / ₹50,000.00 / ₹50,000.01; fee switch ₹199.99 / ₹200.00 / ₹200.01;
  balance exactly amount + fee and one paisa short; basic daily total landing exactly on ₹10,000.00 and one paisa over.
- **N-4a correction to 01 B-1's example (applied to 01 on 2026-10-28):** ₹123.45 does not expose the rounding bug: 1% = 123.45 paise is under the
  ₹2 minimum, so spec and build both give a fee of ₹2.00. To expose B-1, the amount must be ≥ ₹200 and its 1% must have a
  fraction **below** half a paisa, e.g. **₹250.30** → 250.3 paise → spec fee ₹2.51, build fee ₹2.50. (₹250.50 would
  not work: 250.5 rounds up under both.) Suggest fixing the example in 01's B-1 when N-1 is applied.
- **N-5 observed build quirk:** an unknown `kyc` value (e.g. `kyc=gold`) makes `LIMITS[kyc]` undefined, so the limit
  check never fires. Only reachable through the URL hook; worth one negative case only if phase 06 accepts that hook.
- **N-6 expected results follow the spec, not the build** (per 01): cases for B-1 to B-5 are expected to fail on this build.
