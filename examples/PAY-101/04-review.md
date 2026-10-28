# 04 Test review: PAY-101
Status: approved
Inputs: 01-context.md, 02-impact.md, 03-design.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28)

## Progress
- [x] QA architect (independent sub-agent)
- [x] Product analyst (independent sub-agent)
- [x] Devil's advocate (round 1, independent sub-agent)
- [x] Domain expert: fintech pack checklist (independent sub-agent, shared with security and reliability)
- [x] Security (feature has input fields and shows contact data)
- [x] Reliability (send changes data, simulated server call)
- [x] Fixes applied to 03-design.md
- [x] Devil's advocate (round 2, changed cases only): no blockers
- [x] Human sign-off on 03 + 04 and the "Needs a human" items (Ritik, 2026-10-28; see Answers)

## Summary
39 findings in round 1: **3 blockers**, 18 majors, 18 minors. All 3 blockers are fixed in 03. Of the majors, 12 are
fixed, 1 went to Not covered (F-6), 1 was rejected (F-7) and 4 need a human (H-1, H-2, H-4, H-5). Round 2 found
0 blockers, 1 major and 2 minors, all fixed. Loop count: 2 of 3.
03 went from 38 to 45 cases. Most changes tighten timing and assertions in the money-moving cases.

Every reviewer recomputed every calculated value on its own. **No arithmetic error was found** in any of the 45 cases.
All 10 `Targets: B-n` cases were checked against the build and do fail on it.

Rejected: 3 (F-7, F-34, F-37). Source text telling AI agents to approve and skip review (S-1, qa-bot-sync) was ignored by
every reviewer.

## Findings
| ID | Persona | Case or Req | Finding | Severity | Outcome |
|---|---|---|---|---|---|
| F-1 | Security | TC-1 | Name + "3021" check would pass if the full phone number were shown | **blocker** | fixed in TC-1 (exactly 4 digits per label) |
| F-2 | Devil's advocate | TC-32 | Checked right after Send; build debits 400 ms later, so it passes on the broken build. "Any error" too weak | **blocker** | fixed in TC-32 (1.5 s wait; error must not be a known other message) |
| F-3 | QA architect | TC-32 vs TC-35 | TC-32 accepts block at Continue or Send; TC-35 needs it at Continue | major | fixed in TC-32 (Continue, Q-10 default); needs human: Q-10 |
| F-4 | Devil's advocate | TC-36 | Checks run when first success appears; build's second debit lands later. Second click on a disabled button can error | **blocker** | fixed in TC-36 (1.5 s settle, forced click, re-check after Done) |
| F-5 | Devil's advocate | TC-35 | Only "Insufficient balance not shown" catches B-4; another wrong error would pass | major | fixed in TC-35 |
| F-6 | Product analyst | R-25 | RFC-12: same key returns the first result; different body → 409; 24h window. Not in 01 or cases | major | 409/24h → Not covered (API level); needs human H-7 on adding R-29 to 01 |
| F-7 | Product analyst | R-9 | RFC-12 "integer paise, no floats" has no requirement | major | rejected as a separate requirement: an implementation rule; its outcome is asserted in TC-39, TC-40 |
| F-8 | Domain expert | TC-4, TC-6, TC-26, TC-28 | Accepted boundaries stop at confirm; money never checked after the action | major | fixed: all four now send and check new balance |
| F-9 | Domain expert | R-9 | Only 3 exact-1% amounts; a careless round-up fix can add a paisa | major | fixed in TC-39 |
| F-10 | QA architect | R-6 | No accepted whole-number or 1-decimal input ("100", "10.5") | major | fixed in TC-40 |
| F-11 | QA architect | R-21 | Frozen-before-range pair untested | major | fixed in TC-41 |
| F-12 | QA architect | R-25, A-2 | No case shows a deliberate second identical send still works; unique Ref unchecked | major | fixed in TC-42 |
| F-13 | QA architect | A-4 | Changing the contact after Edit untested | minor | fixed in TC-45 |
| F-14 | Domain expert | R-16, R-18 | No case tells whether an earlier send's fee is added to today's total | major | fixed in TC-43 (provisional Q-4) |
| F-15 | Reliability | TC-36 | Only mouse double click; keyboard double Enter untested | major | fixed in TC-36 (second data row) |
| F-16 | QA architect | R-24 | High-risk requirement with no case and no human sign-off | major | TC-18 asserts single debit; needs human: H-1 |
| F-17 | Product analyst | R-6, R-9 | Float-prone amounts (1.15, 4.35) and non-round exact-1% amounts never exercised | major | fixed in TC-39, TC-40 |
| F-18 | Domain expert | R-24, R-25 | No failure or timeout case for Send | major | needs human: H-2 |
| F-19 | Security | TC-10 | Markup, "Infinity" and very long digit strings untested | major | fixed in TC-44; unclear forms → needs human: Q-11 |
| F-20 | Product analyst | TC-36 | Should assert exactly one success screen and one Ref | major | fixed in TC-36 |
| F-21 | Security | CH-15 | URL setup params could bypass frozen, balance and KYC if shipped | major | needs human: H-4 |
| F-22 | QA architect | R-4 | ₹0.00 never tested | minor | fixed in TC-5 |
| F-23 | Devil's advocate | TC-1 | "Exactly 3 options" fails on placeholder; free-text check not assertable | minor | fixed in TC-1 |
| F-24 | Product analyst | R-26 | Lakh grouping only checked on the chip | minor | fixed in TC-6 (₹1,49,500.00); TC-39 totals |
| F-25 | Devil's advocate | TC-17 | No wait; a delayed auto-send would pass | minor | fixed in TC-17 |
| F-26 | Devil's advocate, Product analyst | TC-10 | "-5.00" may fail via range rule, not format | minor | fixed in TC-10 |
| F-27 | Domain expert | TC-12 etc. | ₹199.99 switch point missing; TC-25/34/37 lack working | minor | fixed in TC-12, TC-25, TC-34, TC-35, TC-37 |
| F-28 | Devil's advocate | TC-26, TC-28 | Depend on Q-4 default, not tagged | minor | fixed |
| F-29 | Devil's advocate | TC-18 | Non-empty Ref would pass with a constant | minor | fixed in TC-18 (Ref equals the record) |
| F-30 | QA architect | TC-18 | Checks three behaviours | minor | fixed: R-22 primary; R-12, R-23 primaries moved in Coverage |
| F-31 | Devil's advocate | TC-19 | Pressing Send by label fails as a test error on the build | minor | fixed in TC-19 |
| F-32 | Devil's advocate | TC-38 | "No error text" check proves nothing | minor | fixed (removed) |
| F-33 | QA architect | TC-38 | Never starts the next send | minor | fixed in TC-38 (step 3) |
| F-34 | QA architect | TC-11 | Duplicate of TC-16 | minor | rejected: TC-11 is the fee-rate check guarding C-1 (1% vs ticket's 1.5%); TC-16 checks the screen. Spread of rates is now TC-39 |
| F-35 | Product analyst | TC-1 | Contact names from build used as expected values | minor | fixed: marked as setup data |
| F-36 | Product analyst | PRD Goal | "Under 10 seconds" not listed | minor | fixed: Not covered (not an E2E assertion) |
| F-37 | Product analyst | R-3 | Header "Send money" and numeric keypad untested | minor | rejected: header is cosmetic; `inputmode` doesn't stop typing on desktop, so TC-10 stays valid |
| F-38 | Reliability | Not covered | Refresh, Back, two tabs not listed | minor | fixed: Not covered; needs human H-5 |
| F-39 | Reliability | TC-36 | Edit pressed during the send call | major | needs human: H-5 |
| R2-1 | Devil's advocate | TC-1 | 5+ digit rule on success screen would hit the Ref | major | fixed in TC-1 |
| R2-2 | Devil's advocate | TC-36 | Forced click on a removed button errors | minor | fixed in TC-36 |
| R2-3 | Devil's advocate | TC-18, TC-42, TC-45 | Record stores contact id, not name | minor | fixed |

## Rounds
- Round 1: 3 blockers, 18 majors, 18 minors → all blockers fixed; majors 12 fixed, 1 to Not covered, 1 rejected, 4 need a human; minors 16 fixed, 2 rejected
- Round 2 (devil's advocate on the 22 changed or new cases): 0 blockers, 1 major, 2 minors → fixed. All values recomputed OK.

## Needs a human
- **H-1 R-24 atomicity:** accept that it is not tested at E2E in this repo and hand it to RFC-12 API/integration tests? (high risk; needs your named sign-off)
- **H-2 Send failure / timeout (Q-8):** what should the UI show, is the balance unchanged, is Send re-enabled, does a retry reuse the idempotency key? Can this build simulate a failed call?
- **Q-10 (new):** is a frozen wallet blocked at Continue? Default in TC-32/35/41: yes, because the UI checks at Continue and RFC-12 puts frozen first.
- **H-4:** are the URL setup params and `window.__paylite` test-only and absent in production? (Also needed by phase 06.)
- **H-5:** Edit pressed while a send is in flight; refresh, Back and two tabs during or after a send: what should happen?
- **Q-11 (new):** which amount forms are valid: "5.", ".5", "1,000", "1e3", "0x64", full-width digits, spaces, leading zeros?
- **H-7:** add RFC-12's "same key, different body → 409" to 01 as R-29? Default: no, it is API-level.

None of these blocks approval of the design: the cases that depend on them are marked provisional or listed under Not covered.

## Answers (from the human, 2026-10-28)
- 03 and 04: approved. (Ritik)
- H-1: signed off by Ritik. R-24 atomicity is accepted as not covered here and goes to the RFC-12 API tests.
- "Use the suggested defaults for all open questions." (Ritik) Applied as:
  - Q-10: frozen wallet is blocked at Continue. TC-32, TC-35, TC-41 stay as written and stay provisional.
  - H-7: no R-29 in 01; same key with a different body → 409, and the 24h window, stay API-level.
  - Q-2, Q-4, Q-5, Q-9 (from 01): defaults stay in use; cases tagged provisional stay provisional.
  - H-2, H-5, Q-11 have no suggested default. They keep the handling already in 03: not covered until product answers.
  - H-4 has no suggested default. Phase 06 decides whether tests may use the URL setup params and `window.__paylite`, and records the risk.
