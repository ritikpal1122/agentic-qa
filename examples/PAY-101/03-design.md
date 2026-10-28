# 03 Test design: PAY-101
Status: approved
Inputs: 01-context.md, 02-impact.md
Updated: 2026-10-28
Approved-by: Ritik (2026-10-28)

## Progress
- [x] Techniques picked per requirement
- [x] R-1 to R-3, R-26, R-27 (send form)
- [x] R-4 to R-6 (amount)
- [x] R-7 to R-10 (fee)
- [x] R-11 to R-14, R-22, R-23 (confirm, send, success)
- [x] R-15 (balance)
- [x] R-16 to R-19 (daily limit)
- [x] R-20, R-21 (frozen, check order)
- [x] R-24, R-25 (atomicity, idempotency)
- [x] Regression areas A-1 to A-4, R-28
- [x] Coverage check
- [x] Review round 1 fixes applied (see Changes from review)

## Summary
45 cases (38 + 7 added in review): 9 positive, 8 negative, 15 boundary, 12 state, 1 repeat.
Likely bugs targeted: B-1 (TC-14, TC-15, TC-19), B-2 (TC-24), B-3 (TC-26, TC-28), B-4 (TC-32, TC-35, TC-41), B-5 (TC-36).
These 10 cases are expected to **fail on the current build**, because expected results follow the spec (01 N-6).
Provisional expected results: error text for range, format and frozen (Q-2), fee not counted toward the limit (Q-4),
double-submit behaviour (Q-5), Done destination (Q-9), frozen blocked at Continue (Q-10). Not covered: R-24 atomicity
(not observable from the UI in this build; needs sign-off), and the unspecified paths listed under Not covered.

## Test data
- **Wallet defaults** (when a case gives no setup): balance ₹5,000.00, KYC basic, sent today ₹0.00, not frozen.
- **Contacts** (S-5 demo data; the sources name no contacts): Aman Verma (last 4: 3021), Priya Nair (7788),
  Kabir Shah (1450). Cases use Priya Nair unless stated.
- **Reaching a state:** the build takes setup through URL params in paise: `balance`, `sent`, `kyc` (`basic`/`full`),
  `frozen=1` (02 N-2). Phase 06 decides whether tests may use that hook. Cases below give setup in rupees.
- **Fee formula used in all working** (01 R-7 to R-9, Q-1): fee = max(₹2.00, 1% of amount rounded **up** to the
  next paisa). Total = amount + fee (R-10).
- **Daily limit** (R-16 to R-19, Q-4 default): allowed when sent today + amount ≤ limit; the fee is not counted.
- **"No transfer"** in expected results means: no success screen, balance chip unchanged, and no new transfer
  recorded in wallet state (how to read wallet state: phase 06, G-7).
- **Provisional error text (Q-2):** range → "Amount must be between ₹1 and ₹50,000"; format → "Enter a valid amount".
  Both come from the build, not from a spec. Frozen: no text known at all.

## Cases

### Send form

### TC-1 "To" lists only saved contacts, as name + last 4 digits
Covers: R-1, R-2 · Risk: medium · Type: positive
Setup: defaults
Steps:
1. Open the send form
2. Open the "To" dropdown
Expected:
- Counting only options with a contact value (not the "Choose a contact" placeholder): 3 options, one each for
  "Aman Verma" + "3021", "Priya Nair" + "7788", "Kabir Shah" + "1450" (the 3 contacts are setup data, not a spec value)
- Each option label holds exactly 4 digits (the last 4), so no label contains a run of 5 or more phone digits
- "To" is a select, not an editable input or combobox; the only text input on the form is Amount

### TC-2 Continue is disabled until both a contact and an amount are entered
Covers: R-3 · Risk: low · Type: state
Setup: defaults
Steps:
1. Open the send form; check Continue
2. Pick "Priya Nair", leave amount empty; check Continue
3. Clear the contact, enter amount 100.00; check Continue
4. Pick "Priya Nair" with amount 100.00; check Continue
Expected:
- Steps 1 to 3: Continue is disabled
- Step 4: Continue is enabled

### TC-3 Balance chip shows the current balance with 2 decimals and Indian grouping
Covers: R-27, R-26 · Risk: low · Type: positive
Setup: balance ₹1,00,000.00
Steps:
1. Open the send form
Expected:
- Chip reads "Balance ₹1,00,000.00" (not "₹100,000.00", not "₹1,00,000")

### Amount

### TC-4 Minimum amount ₹1.00 is accepted
Covers: R-4 · Risk: high · Type: boundary
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1.00, press Continue
2. Press the Send button
Expected:
- Step 1: confirm screen opens with Amount ₹1.00, Fee ₹2.00, Total ₹3.00; no error shown
- Step 2: "New balance ₹4,997.00"; exactly one transfer recorded
Working: 1% of ₹1.00 = ₹0.01, below the minimum → fee ₹2.00; total ₹1.00 + ₹2.00 = ₹3.00; ₹5,000.00 − ₹3.00 = ₹4,997.00

### TC-5 Amount ₹0.99 and ₹0.00 are rejected
Covers: R-4 · Risk: high · Type: boundary
Setup: defaults
Data (run once per row): 0.99 · 0.00
Steps:
1. Pick "Priya Nair", enter the amount, press Continue
Expected:
- Confirm screen does not open; no transfer; chip still "Balance ₹5,000.00"
- Error "Amount must be between ₹1 and ₹50,000" (provisional, Q-2)

### TC-6 Maximum amount ₹50,000.00 is accepted
Covers: R-5 · Risk: high · Type: boundary
Setup: balance ₹2,00,000.00, KYC full, sent today ₹0.00
Steps:
1. Pick "Priya Nair", enter 50000.00, press Continue
2. Press the Send button
Expected:
- Step 1: confirm screen opens with Amount ₹50,000.00, Fee ₹500.00, Total ₹50,500.00
- Step 2: "New balance ₹1,49,500.00" (Indian grouping, not "₹149,500.00"); exactly one transfer recorded
Working: 1% of ₹50,000.00 = ₹500.00 (exact); total ₹50,500.00 ≤ balance ₹2,00,000.00; KYC full used so the ₹10,000
basic limit does not block it (0 + ₹50,000.00 ≤ ₹1,00,000.00); ₹2,00,000.00 − ₹50,500.00 = ₹1,49,500.00

### TC-7 Amount ₹50,000.01 is rejected
Covers: R-5 · Risk: high · Type: boundary
Setup: balance ₹60,000.00, KYC full, sent today ₹0.00
Steps:
1. Pick "Priya Nair", enter 50000.01, press Continue
Expected:
- Confirm screen does not open; no transfer; chip still "Balance ₹60,000.00"
- Error "Amount must be between ₹1 and ₹50,000" (provisional, Q-2)
Working: balance and limit both allow it (total ₹50,500.02 ≤ ₹60,000.00; ₹50,000.01 ≤ ₹1,00,000.00), so only the range rule can reject it

### TC-8 Amount with 2 decimals is accepted as entered
Covers: R-6 · Risk: high · Type: positive
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 10.25, press Continue
Expected:
- Confirm screen opens with Amount ₹10.25, Fee ₹2.00, Total ₹12.25
Working: 1% of ₹10.25 = ₹0.1025 → ₹0.11 rounded up, below minimum → fee ₹2.00; total ₹10.25 + ₹2.00 = ₹12.25

### TC-9 Amount with 3 decimals is rejected, not rounded
Covers: R-6 · Risk: high · Type: boundary
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 10.255, press Continue
Expected:
- Confirm screen does not open (it must not show ₹10.25 or ₹10.26); no transfer
- Error "Enter a valid amount" (provisional, Q-2)

### TC-10 Non-numeric and negative amounts are rejected
Covers: R-4, R-6 · Risk: high · Type: negative
Setup: defaults
Data (run once per row):
| Amount entered | Error (provisional, Q-2) |
|---|---|
| abc | "Enter a valid amount" |
| -5.00 | either "Enter a valid amount" or "Amount must be between ₹1 and ₹50,000" (no source says which rule applies) |
Steps:
1. Pick "Priya Nair", enter the amount, press Continue
Expected:
- Confirm screen does not open; no transfer; chip still "Balance ₹5,000.00"
- Error as in the row

### Fee

### TC-11 Fee is 1% of the amount
Covers: R-7, R-10 · Risk: high · Type: positive
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
Expected:
- Fee ₹10.00, Total ₹1,010.00
Working: 1% of ₹1,000.00 = ₹10.00 (exact, so rounding up adds nothing; not 1.5% = ₹15.00); total ₹1,010.00

### TC-12 Fee minimum ₹2.00 applies to small amounts
Covers: R-8 · Risk: high · Type: positive
Setup: defaults
Data (run once per row):
| Amount | Fee | Total | Working |
|---|---|---|---|
| 150.00 | ₹2.00 | ₹152.00 | 1% = ₹1.50 < ₹2.00 → ₹2.00 |
| 199.99 | ₹2.00 | ₹201.99 | 1% = ₹1.9999 → rounded up ₹2.00 = minimum → ₹2.00 |
Steps:
1. Pick "Priya Nair", enter the amount, press Continue
Expected:
- Fee and Total as in the row

### TC-13 Fee at the switch point ₹200.00
Covers: R-7, R-8 · Risk: high · Type: boundary
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 200.00, press Continue
Expected:
- Fee ₹2.00, Total ₹202.00
Working: 1% of ₹200.00 = ₹2.00 = minimum → fee ₹2.00; total ₹202.00

### TC-14 Fee just above the switch point rounds up
Covers: R-7, R-9 · Risk: high · Type: boundary · Targets: B-1
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 200.01, press Continue
Expected:
- Fee ₹2.01, Total ₹202.02
Working: 1% of ₹200.01 = ₹2.0001 → rounded up ₹2.01 (> ₹2.00 minimum); total ₹200.01 + ₹2.01 = ₹202.02.
Current build rounds to nearest → ₹2.00 / ₹202.01, so this case should fail on it.

### TC-15 Fee with a fraction under half a paisa rounds up
Covers: R-9 · Risk: high · Type: boundary · Targets: B-1
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 250.30, press Continue
Expected:
- Fee ₹2.51, Total ₹252.81
Working: 1% of ₹250.30 = ₹2.503 → rounded up ₹2.51; total ₹250.30 + ₹2.51 = ₹252.81.
Current build gives ₹2.50 / ₹252.80.

### Confirm, send, success

### TC-16 Confirm screen shows recipient, amount, fee, total and the send button
Covers: R-11, R-13, R-10 · Risk: medium · Type: positive
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
Expected:
- To row shows "Priya Nair" (whether last 4 also shows is open, G-9; not asserted)
- Amount ₹1,000.00, Fee ₹10.00, Total ₹1,010.00
- Confirm button text is "Send ₹1,010.00"
Working: as TC-11

### TC-17 No money moves before the user confirms
Covers: R-12 · Risk: medium · Type: state
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
2. On the confirm screen, do not press Send; wait 1.5 s
Expected:
- Confirm screen still shown; success screen not shown
- No transfer recorded; chip still "Balance ₹5,000.00"
(The wait makes sure a product that sends on its own after a delay is caught.)

### TC-18 Confirmed send shows success, a reference and the new balance
Covers: R-22 (primary); also R-12, R-23 · Risk: high · Type: positive
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
2. Press "Send ₹1,010.00"
Expected:
- Success screen shows "Money sent" and "Ref: " followed by a non-empty reference
- The shown reference equals the reference of the one new transfer record
- "New balance ₹3,990.00"
- Exactly one transfer recorded: to the contact shown as Priya Nair (match on the record's contact identifier; field chosen in phase 06), amount ₹1,000.00, fee ₹10.00; balance went down by ₹1,010.00 exactly once
Working: ₹5,000.00 − ₹1,000.00 − ₹10.00 = ₹3,990.00

### TC-19 New balance subtracts the rounded-up fee
Covers: R-23, R-9 · Risk: high · Type: positive · Targets: B-1
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 250.30, press Continue
2. Press the Send button (find it by its role, not by its label, so a wrong label can't stop the test early)
Expected:
- Step 1: Send button reads "Send ₹252.81"
- Step 2: "New balance ₹4,747.19"
Working: fee ₹2.51 (TC-15); ₹5,000.00 − ₹250.30 − ₹2.51 = ₹4,747.19. Current build gives ₹4,747.20.

### TC-20 Edit returns to the send form without sending
Covers: R-14 · Risk: low · Type: state
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
2. Press "Edit"
Expected:
- Send form is shown, confirm screen is not
- No transfer; chip still "Balance ₹5,000.00"
(Whether contact and amount are kept is open, G-5/Q-8; not asserted.)

### TC-21 After Edit, a changed amount recalculates fee and total
Covers: R-14, R-7, R-10 (regression A-4) · Risk: high · Type: state
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue, press "Edit"
2. Make sure "Priya Nair" is picked; clear the amount and enter 2000.00; press Continue
Expected:
- Amount ₹2,000.00, Fee ₹20.00, Total ₹2,020.00, button "Send ₹2,020.00"
Working: 1% of ₹2,000.00 = ₹20.00; total ₹2,020.00

### TC-22 After Edit, the checks run again on the new amount
Covers: R-15, R-14 (regression A-4) · Risk: high · Type: state
Setup: balance ₹1,500.00
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue (confirm opens: total ₹1,010.00 ≤ ₹1,500.00)
2. Press "Edit"; make sure "Priya Nair" is picked; clear the amount and enter 1600.00; press Continue
Expected:
- Error "Insufficient balance"; confirm screen does not open; no transfer; chip still "Balance ₹1,500.00"
Working: ₹1,600.00 alone exceeds ₹1,500.00 (total with fee ₹1,616.00), so this does not depend on B-2

### Balance

### TC-23 Balance exactly equal to amount + fee is allowed
Covers: R-15, R-23 · Risk: high · Type: boundary
Setup: balance ₹102.00
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue, press "Send ₹102.00"
Expected:
- Confirm screen opens with Total ₹102.00; after Send, "Money sent" and "New balance ₹0.00"
Working: fee max(₹2.00, ₹1.00) = ₹2.00; total ₹102.00 = balance → allowed; ₹102.00 − ₹102.00 = ₹0.00

### TC-24 Balance one paisa short of amount + fee is rejected
Covers: R-15 · Risk: high · Type: boundary · Targets: B-2
Setup: balance ₹101.99
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue
Expected:
- Error "Insufficient balance"; confirm screen does not open; no transfer; chip still "Balance ₹101.99"
Working: total ₹102.00 > ₹101.99. Balance covers the amount (₹100.00) but not the fee; current build checks the
amount only, so it would let this through.

### TC-25 Balance below the amount is rejected
Covers: R-15 · Risk: high · Type: negative
Setup: balance ₹50.00
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue
Expected:
- Error "Insufficient balance"; confirm screen does not open; no transfer; chip still "Balance ₹50.00"
Working: total ₹100.00 + ₹2.00 = ₹102.00 > ₹50.00; the amount alone already exceeds the balance

### Daily limit

### TC-26 KYC basic: send that lands exactly on ₹10,000.00 is allowed
Covers: R-16, R-18 · Risk: high · Type: boundary · Targets: B-3 · Provisional on Q-4 (flips to "rejected" if the fee counts)
Setup: balance ₹5,000.00, KYC basic, sent today ₹6,000.00
Steps:
1. Pick "Priya Nair", enter 4000.00, press Continue
2. Press the Send button
Expected:
- Step 1: confirm screen opens with Amount ₹4,000.00, Fee ₹40.00, Total ₹4,040.00; no error
- Step 2: "New balance ₹960.00"; exactly one transfer recorded
Working: ₹6,000.00 + ₹4,000.00 = ₹10,000.00 ≤ ₹10,000.00 → allowed (fee not counted, Q-4 default; counting it
would give ₹10,040.00 and block). Balance ₹5,000.00 ≥ ₹4,040.00; ₹5,000.00 − ₹4,040.00 = ₹960.00.

### TC-27 KYC basic: one paisa over the daily limit is rejected
Covers: R-16, R-19 · Risk: high · Type: boundary
Setup: balance ₹5,000.00, KYC basic, sent today ₹6,000.00
Steps:
1. Pick "Priya Nair", enter 4000.01, press Continue
Expected:
- Error "Daily limit exceeded"; confirm screen does not open; no transfer; chip still "Balance ₹5,000.00"
Working: ₹6,000.00 + ₹4,000.01 = ₹10,000.01 > ₹10,000.00. Balance is fine: fee ₹40.01 (₹40.0001 rounded up), total ₹4,040.02 ≤ ₹5,000.00

### TC-28 KYC full: send that lands exactly on ₹1,00,000.00 is allowed
Covers: R-17, R-18 · Risk: high · Type: boundary · Targets: B-3 · Provisional on Q-4 (flips to "rejected" if the fee counts)
Setup: balance ₹60,000.00, KYC full, sent today ₹50,000.00
Steps:
1. Pick "Priya Nair", enter 50000.00, press Continue
2. Press the Send button
Expected:
- Step 1: confirm screen opens with Amount ₹50,000.00, Fee ₹500.00, Total ₹50,500.00; no error
- Step 2: "New balance ₹9,500.00"; exactly one transfer recorded
Working: ₹50,000.00 + ₹50,000.00 = ₹1,00,000.00 ≤ limit; balance ₹60,000.00 ≥ ₹50,500.00; ₹60,000.00 − ₹50,500.00 = ₹9,500.00

### TC-29 KYC full: one paisa over the daily limit is rejected
Covers: R-17, R-19 · Risk: high · Type: boundary
Setup: balance ₹60,000.00, KYC full, sent today ₹50,000.01
Steps:
1. Pick "Priya Nair", enter 50000.00, press Continue
Expected:
- Error "Daily limit exceeded"; confirm screen does not open; no transfer; chip still "Balance ₹60,000.00"
Working: ₹50,000.01 + ₹50,000.00 = ₹1,00,000.01 > ₹1,00,000.00 (amount can't go above ₹50,000.00, so the extra paisa is in "sent today")

### TC-30 Second send in a session counts the first toward the daily limit
Covers: R-16, R-19 (regression A-2) · Risk: high · Type: state
Setup: balance ₹20,000.00, KYC basic, sent today ₹0.00
Steps:
1. Pick "Priya Nair", enter 6000.00, Continue, press "Send ₹6,060.00", press Done
2. Pick "Aman Verma", enter 4000.01, press Continue
Expected:
- Step 1: "New balance ₹13,940.00"
- Step 2: error "Daily limit exceeded"; confirm screen does not open; chip still "Balance ₹13,940.00"
Working: fee ₹60.00; ₹20,000.00 − ₹6,060.00 = ₹13,940.00. Daily total ₹6,000.00 + ₹4,000.01 = ₹10,000.01 > ₹10,000.00.
(₹4,000.01 rather than ₹4,000.00 so this case doesn't also depend on B-3.)

### TC-31 Second send in a session uses the reduced balance
Covers: R-15 (regression A-2) · Risk: high · Type: state
Setup: balance ₹1,100.00
Steps:
1. Pick "Priya Nair", enter 1000.00, Continue, press "Send ₹1,010.00", press Done
2. Pick "Priya Nair", enter 100.00, press Continue
Expected:
- Step 1: "New balance ₹90.00"
- Step 2: error "Insufficient balance"; confirm screen does not open; chip still "Balance ₹90.00"
Working: ₹1,100.00 − ₹1,010.00 = ₹90.00; ₹100.00 alone exceeds ₹90.00 (so not dependent on B-2)

### Frozen wallet and check order

### TC-32 Frozen wallet cannot send
Covers: R-20 · Risk: high · Type: negative · Targets: B-4 · Provisional on Q-10 (block at Continue)
Setup: defaults, frozen
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue
2. Wait 1.5 s
Expected:
- Confirm screen does not open; success screen not shown
- Error text is non-empty and is none of "Insufficient balance", "Daily limit exceeded",
  "Amount must be between ₹1 and ₹50,000", "Enter a valid amount" (exact frozen text: blocked by Q-2)
- After the wait: no transfer recorded; chip still "Balance ₹5,000.00"
(Block at Continue is the Q-10 default: the UI runs its checks at Continue, and R-21 puts frozen first, so a frozen
wallet can't get past Continue without breaking the order. The wait catches a delayed debit.)

### TC-33 Balance is checked before the daily limit
Covers: R-21 · Risk: medium · Type: negative
Setup: balance ₹1,000.00, KYC basic, sent today ₹9,000.00
Steps:
1. Pick "Priya Nair", enter 1500.00, press Continue
Expected:
- Error "Insufficient balance" is shown, and "Daily limit exceeded" is not
- No transfer
Working: both fail: total ₹1,515.00 > ₹1,000.00, and ₹9,000.00 + ₹1,500.00 = ₹10,500.00 > ₹10,000.00. Order puts balance first.

### TC-34 Amount range is checked before balance
Covers: R-21, R-5 · Risk: medium · Type: negative
Setup: balance ₹10.00, KYC full
Steps:
1. Pick "Priya Nair", enter 50000.01, press Continue
Expected:
- Error "Amount must be between ₹1 and ₹50,000" (provisional, Q-2) is shown, and "Insufficient balance" is not
- No transfer
Working: total ₹50,000.01 + ₹500.01 = ₹50,500.02 > ₹10.00, so both rules fail; only the order decides which error shows.
KYC full so the limit (₹50,000.01 ≤ ₹1,00,000.00) doesn't interfere.

### TC-35 Frozen is checked first
Covers: R-21, R-20 · Risk: medium · Type: negative · Targets: B-4 · Provisional on Q-2, Q-10
Setup: balance ₹10.00, frozen
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue; wait 1.5 s
Expected:
- Error text is non-empty and is none of "Insufficient balance", "Daily limit exceeded",
  "Amount must be between ₹1 and ₹50,000", "Enter a valid amount" (replace with the exact frozen text once Q-2 is answered)
- Confirm screen does not open; no transfer recorded; chip still "Balance ₹10.00"
Working: total ₹102.00 > ₹10.00, so the balance rule would also fail; frozen must win

### Repeat

### TC-36 Double click on Send makes exactly one transfer
Covers: R-25 · Risk: high · Type: repeat · Targets: B-5
Setup: defaults
Data (run once per row):
| How the second send is made |
|---|
| Mouse: click Send twice, second click under 200 ms after the first. The second click is forced (dispatched even if the button is disabled), so a fixed product that disables Send doesn't break the test. If Send is gone or hidden when the second click is due, skip it and go on to the checks |
| Keyboard: focus Send, press Enter twice, under 200 ms apart |
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue
2. Make the double send as in the row
3. Wait for the success screen, then wait a further 1.5 s before checking anything
4. Check, then press Done, wait 1.5 s, check again
Expected (Q-5 default):
- Step 4, before Done: exactly one transfer recorded; one success screen with one "Ref:" value, which equals that
  transfer's reference; "New balance ₹3,990.00"; no error shown
- Step 4, after Done: send form shown (the success screen does not come back); chip "Balance ₹3,990.00"; still one transfer
Working: ₹5,000.00 − ₹1,010.00 = ₹3,990.00 (two transfers would give ₹2,980.00). The 1.5 s settle covers the click
gap plus any in-flight send, so a late second debit is seen.

### Regression

### TC-37 Balance chip shows the new balance after a send
Covers: R-27, R-23 (regression A-1) · Risk: low · Type: state
Setup: defaults
Steps:
1. Check the chip: "Balance ₹5,000.00"
2. Pick "Priya Nair", enter 1000.00, Continue, press "Send ₹1,010.00", press Done
Expected:
- Chip reads "Balance ₹3,990.00"
Working: ₹5,000.00 − ₹1,000.00 − ₹10.00 = ₹3,990.00

### TC-38 Done returns to an empty send form, and the next send starts clean
Covers: R-28 (regression A-3) · Risk: low · Type: state
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 100.00, press Continue, press "Send ₹102.00"
2. Press Done
3. Pick "Aman Verma", enter 300.00, press Continue
Expected:
- Step 2 (Q-9 default, provisional): send form shown, success and confirm screens hidden; no contact picked;
  amount empty; Continue disabled
- Step 3: confirm shows To "Aman Verma", Amount ₹300.00, Fee ₹3.00, Total ₹303.00, button "Send ₹303.00" (no
  value left over from the first send); chip "Balance ₹4,898.00"
Working: ₹5,000.00 − ₹102.00 = ₹4,898.00; 1% of ₹300.00 = ₹3.00 ≥ ₹2.00; total ₹303.00

### Added in review (round 1)

### TC-39 Exact 1% fees get no extra paisa
Covers: R-7, R-9, R-10, R-26 · Risk: high · Type: boundary (from F-9, F-17)
Setup: balance ₹60,000.00, KYC full, sent today ₹0.00
Data (run once per row):
| Amount | Fee | Total | Working |
|---|---|---|---|
| 700.00 | ₹7.00 | ₹707.00 | 1% = ₹7.00 exact |
| 1234.00 | ₹12.34 | ₹1,246.34 | 1% = ₹12.34 exact |
| 5700.00 | ₹57.00 | ₹5,757.00 | 1% = ₹57.00 exact |
| 12345.00 | ₹123.45 | ₹12,468.45 | 1% = ₹123.45 exact |
| 49999.00 | ₹499.99 | ₹50,498.99 | 1% = ₹499.99 exact |
Steps:
1. Pick "Priya Nair", enter the amount, press Continue
Expected:
- Fee and Total exactly as in the row (rounding up must not add a paisa when 1% is already a whole paisa)
All totals ≤ ₹60,000.00 and all amounts ≤ the ₹1,00,000.00 full limit, so only the fee is under test.

### TC-40 Whole-number, 1-decimal and float-prone amounts convert exactly
Covers: R-6, R-23 · Risk: high · Type: positive (from F-10, F-17)
Setup: defaults
Data (run once per row):
| Entered | Amount shown | Fee | Total | New balance | Working |
|---|---|---|---|---|---|
| 100 | ₹100.00 | ₹2.00 | ₹102.00 | ₹4,898.00 | 1% = ₹1.00 < min |
| 10.5 | ₹10.50 | ₹2.00 | ₹12.50 | ₹4,987.50 | 1% = ₹0.105 → ₹0.11 < min |
| 1.15 | ₹1.15 | ₹2.00 | ₹3.15 | ₹4,996.85 | 1% = ₹0.0115 → ₹0.02 < min |
| 4.35 | ₹4.35 | ₹2.00 | ₹6.35 | ₹4,993.65 | 1% = ₹0.0435 → ₹0.05 < min |
Steps:
1. Pick "Priya Nair", enter the value, press Continue
2. Press the Send button
Expected:
- Step 1: no error; Amount, Fee and Total as in the row (₹1.15 must not show as ₹1.14, ₹4.35 not as ₹4.34)
- Step 2: "New balance" as in the row (₹5,000.00 − total)

### TC-41 Frozen is checked before the amount range
Covers: R-21, R-20 · Risk: medium · Type: negative · Targets: B-4 · Provisional on Q-2, Q-10 (from F-11)
Setup: defaults, frozen
Steps:
1. Pick "Priya Nair", enter 0.50, press Continue; wait 1.5 s
Expected:
- Error text is non-empty and is none of "Amount must be between ₹1 and ₹50,000", "Enter a valid amount",
  "Insufficient balance", "Daily limit exceeded"
- Confirm screen does not open; no transfer recorded; chip still "Balance ₹5,000.00"

### TC-42 A deliberate second identical send still goes through
Covers: R-25, R-22 (regression A-2) · Risk: high · Type: state (from F-12)
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, Continue, press "Send ₹1,010.00", note the Ref, press Done
2. Pick "Priya Nair", enter 1000.00, press Continue
3. Press "Send ₹1,010.00"
Expected:
- Step 1: "New balance ₹3,990.00"
- Step 2: confirm shows Total ₹1,010.00, no error
- Step 3: "Money sent"; "New balance ₹2,980.00"; the Ref differs from step 1's
- Two transfers recorded, both to the contact shown as Priya Nair (match on contact identifier, as TC-18), for ₹1,000.00 + ₹10.00 fee; after Done, chip "Balance ₹2,980.00"
Working: ₹5,000.00 − 2 × ₹1,010.00 = ₹2,980.00; daily total ₹2,000.00 ≤ ₹10,000.00
(Guards against a B-5 fix that blocks real repeat payments, e.g. by matching contact + amount.)

### TC-43 Fees of earlier sends are not counted in today's total
Covers: R-16, R-18 · Risk: high · Type: state · Provisional on Q-4 (from F-14)
Setup: balance ₹20,000.00, KYC basic, sent today ₹0.00
Steps:
1. Pick "Priya Nair", enter 6000.00, Continue, press "Send ₹6,060.00", press Done
2. Pick "Aman Verma", enter 3999.99, press Continue
Expected:
- Step 1: "New balance ₹13,940.00"
- Step 2: confirm opens with Amount ₹3,999.99, Fee ₹40.00, Total ₹4,039.99; no error
Working: fee 1 = ₹60.00; ₹20,000.00 − ₹6,060.00 = ₹13,940.00. Fee 2: 1% of ₹3,999.99 = ₹39.9999 → ₹40.00.
Daily total ₹6,000.00 + ₹3,999.99 = ₹9,999.99 ≤ ₹10,000.00 → allowed. If the earlier fee were counted:
₹6,060.00 + ₹3,999.99 = ₹10,059.99 → blocked. Stays under the limit, so it doesn't depend on B-3.

### TC-44 Hostile and number-like text in the amount field is rejected safely
Covers: R-6, R-5 · Risk: high · Type: negative (from F-19)
Setup: defaults
Data (run once per row): `<img src=x onerror=alert(1)>` · `Infinity` · `12345678901234567890`
Steps:
1. Pick "Priya Nair", enter the value, press Continue; wait 1.5 s
Expected:
- Confirm screen does not open; no transfer recorded; chip still "Balance ₹5,000.00"
- Error is "Enter a valid amount" or "Amount must be between ₹1 and ₹50,000" (provisional, Q-2)
- No dialog opens, and the entered text is not rendered as markup anywhere on the page
(Inputs like "1e3", "0x64", full-width digits, spaces and leading zeros are left to Q-11, since no source says whether they're valid.)

### TC-45 After Edit, a changed contact receives the money
Covers: R-14, R-11 (regression A-4) · Risk: medium · Type: state (from F-13)
Setup: defaults
Steps:
1. Pick "Priya Nair", enter 1000.00, press Continue, press "Edit"
2. Pick "Kabir Shah"; make sure the amount is 1000.00; press Continue
3. Press "Send ₹1,010.00"
Expected:
- Step 2: confirm To shows "Kabir Shah", not "Priya Nair"
- Step 3: exactly one transfer recorded, to the contact shown as Kabir Shah (match on contact identifier, as TC-18); none to Priya Nair; "New balance ₹3,990.00"

## Coverage
| Req | Risk | Cases | Techniques | Gap? |
|---|---|---|---|---|
| R-1 | medium | TC-1 | equivalence | — |
| R-2 | low | TC-1 | check | — |
| R-3 | low | TC-2 | state | — |
| R-4 | high | TC-4, TC-5, TC-10 | boundary, negative | — |
| R-5 | high | TC-6, TC-7, TC-34, TC-44 | boundary | — |
| R-6 | high | TC-8, TC-9, TC-10, TC-40, TC-44 | boundary, equivalence | inputs like "5.", "1,000", "1e3": Q-11 |
| R-7 | high | TC-11, TC-13, TC-14, TC-21, TC-39 | equivalence, boundary | — |
| R-8 | high | TC-12, TC-13, TC-14 | boundary (₹199.99 / ₹200.00 / ₹200.01) | — |
| R-9 | high | TC-14, TC-15, TC-19, TC-39 | boundary (rounds up; exact stays exact) | — |
| R-10 | high | TC-11, TC-16, TC-21, TC-39 | calculation | — |
| R-11 | medium | TC-16, TC-45 | check, state | "To" format open (G-9) |
| R-12 | medium | TC-17 (primary), TC-18 | state | — |
| R-13 | low | TC-16 | check | — |
| R-14 | low | TC-20, TC-21, TC-22, TC-45 | state | kept values open (G-5) |
| R-15 | high | TC-22, TC-23, TC-24, TC-25, TC-31 | boundary, negative, state | — |
| R-16 | high | TC-26, TC-27, TC-30, TC-43 | boundary, state | — |
| R-17 | high | TC-28, TC-29 | boundary | — |
| R-18 | high | TC-26, TC-28, TC-43 | boundary, state | provisional on Q-4 |
| R-19 | high | TC-27, TC-29, TC-30 | boundary, negative | — |
| R-20 | high | TC-32, TC-35, TC-41 | negative | error text blocked by Q-2; block point Q-10 |
| R-21 | medium | TC-33, TC-34, TC-35, TC-41 | decision table (every adjacent pair) | limit-vs-range pair not needed: range < ₹50,000 < full limit |
| R-22 | medium | TC-18 (primary), TC-42 | positive | — |
| R-23 | high | TC-4, TC-6, TC-19, TC-23, TC-26, TC-28, TC-40 (TC-18 also asserts it) | calculation, boundary | — |
| R-24 | high | — | — | **not covered: accepted risk, signed off by Ritik 2026-10-28 (H-1); goes to API tests** |
| R-25 | high | TC-36, TC-42 | repeat (mouse, keyboard), deliberate repeat | retry after timeout (Q-8); 409 and 24h window are API-level |
| R-26 | low | TC-3, TC-6 (success screen), TC-39 (confirm totals) | check | — |
| R-27 | low | TC-3, TC-37 | check, state | — |
| R-28 | low | TC-38 | state | destination provisional (Q-9) |

| Bug | Cases |
|---|---|
| B-1 | TC-14, TC-15, TC-19 |
| B-2 | TC-24 |
| B-3 | TC-26, TC-28 |
| B-4 | TC-32, TC-35, TC-41 |
| B-5 | TC-36 |

| Regression area | Cases |
|---|---|
| A-1 chip after send | TC-37 |
| A-2 second send | TC-30, TC-31, TC-42, TC-43 |
| A-3 Done → clean form | TC-38 |
| A-4 Edit → recalc and re-check | TC-21, TC-22, TC-45 |

Fintech pack test ideas used: min/max ± 0.01 (TC-4 to TC-7), rounding fraction (TC-14, TC-15), fee minimum and
switch point (TC-12 to TC-14), total on every screen (TC-16, TC-18, TC-19), balance exactly equal and 0.01 short
(TC-23, TC-24), covers amount not fee (TC-24), limit exact / +0.01 / after earlier sends (TC-26 to TC-30), frozen
(TC-32), double submit (TC-36), balance after success and unchanged after failure (every negative case), currency
display (TC-3).
Not applicable: closed or unverified accounts (no source mentions them), sensitive data (only last 4 digits shown,
covered by TC-1), multi-currency (INR only).

## Not covered
- R-24 atomicity: the build has no backend and writes one ledger row per send, so a partial failure can't be caused
  or observed from the UI here (02 N-3). Belongs in API or integration tests for RFC-12 (debit, credit and fee in one
  DB transaction). **Accepted risk: signed off by Ritik 2026-10-28 (04 H-1); R-24 goes to API tests.**
- RFC-12 idempotency details: same key with a different body → 409, and the 24h window. API-level; route to RFC-12 API tests.
- Retry after timeout, failure screen, loading state (G-4, Q-8): no expected behaviour in any source.
- Edit pressed while a send is in flight; refresh, Back and two tabs after or during a send: no source says what
  should happen (04 H-5). The build keeps state in memory only.
- Whether the URL setup params and `window.__paylite` exist in production (04 H-4; phase 06 also needs it).
- PRD goal "pay a saved contact in under 10 seconds": timing depends on the environment; not an E2E assertion.
- Daily-limit reset at midnight (G-2, Q-3): avoided until the time zone is confirmed.
- Values kept after Edit (G-5) and empty contacts list (G-6): unspecified (Q-8).
- Amount inputs "5." (trailing dot), ".5", "1,000" (grouping commas), "1e3", "0x64", full-width digits, leading or
  trailing spaces, leading zeros: no source says whether they're valid (Q-11). The build rejects most of them as
  "Enter a valid amount". Needs a product answer before a case can assert anything.
- Unknown `kyc` value through the URL hook (02 N-5): only if phase 06 accepts that hook.

## Changes from review
Round 1 (04-review.md, 2026-10-28):
- TC-1 tightened: placeholder option excluded; exactly 4 digits per label; no 5+ digit run anywhere; "To" is a select (F-1, F-23)
- TC-32 rewritten: block expected at Continue (Q-10 default), error must not be a known other message, 1.5 s wait before money checks (F-2, F-3)
- TC-36 rewritten: 1.5 s settle before checks, forced second click, keyboard double-Enter row, one Ref equal to the record, Done then re-check (F-4, F-15, F-20)
- TC-35 assertion tightened the same way as TC-32 (F-5)
- TC-4, TC-6, TC-26, TC-28 now press Send and check the new balance; TC-6 balance raised to ₹2,00,000.00 to show lakh grouping on success (F-8, F-24)
- TC-26, TC-28 tagged provisional on Q-4 (F-28)
- TC-5 adds a 0.00 row; TC-10's -5.00 row accepts either provisional text (F-22, F-26)
- TC-12 adds the ₹199.99 row (F-27)
- TC-17 waits 1.5 s on confirm before checking (F-25)
- TC-18: primary requirement R-22; Ref must equal the record; debit once (F-16, F-29, F-30)
- TC-19 presses Send by role and asserts its label separately (F-31)
- TC-38 drops the error check that proved nothing; adds a clean next send (F-32, F-33)
- Working added to TC-25, TC-34, TC-35, TC-37 (F-27)
- Added TC-39 to TC-45 (F-9, F-10, F-11, F-12, F-13, F-14, F-17, F-19)
Round 2 (devil's advocate on changed cases, no blockers):
- TC-1 digit-run check limited to dropdown labels (R2-1); TC-36 skips the second click if Send is gone (R2-2);
  TC-18, TC-42, TC-45 match the recipient on the contact identifier (R2-3)
- New provisional questions Q-10 (where frozen is blocked) and Q-11 (accepted amount formats) are listed in
  04-review.md "Needs a human"; they go into 01 once answered
- Not covered: R-24 marked for sign-off; RFC-12 409/24h, Edit-during-send, refresh/Back/two tabs, URL hook in production, PRD 10 s goal added
