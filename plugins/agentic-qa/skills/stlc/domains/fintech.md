# Domain pack: fintech

## Signals
Money amounts, currency, fees, balance, wallet, payment, transfer, refund, ledger, limit, KYC,
interest, settlement, payout, card, bank account.

## Questions to ask (phase 01)

- **Amounts:** what are the minimum, maximum and allowed decimal places? In which unit is money stored?
- **Rounding:** how are fees, interest or tax rounded (up, down, half-up)? At which step?
- **Who pays the fee,** and is it added on top or taken from the amount?
- **Limits:** per transaction, per day, per month? Is the limit inclusive ("up to")? When does the day reset, in which time zone?
- **Eligibility:** which account states block the action (frozen, closed, unverified, KYC level)?
- **Failure:** what happens on timeout or network failure? Can the user retry safely?
- **Duplicates:** is the action idempotent? What stops a double charge on double click or retry?
- **Atomicity:** if part of the operation fails, is everything rolled back?
- **Records:** what ledger, statement or audit entries must exist afterwards?
- **Currency:** single currency only? If more, how are rates and display handled?

## Test ideas (phase 03)

**Amounts and rounding**
- Exact boundaries: minimum, minimum − 0.01, maximum, maximum + 0.01.
- Values that expose rounding: fractions that would round differently up vs down (for example 1% of 250.10).
- Fee at its minimum and maximum, and right at the point where the minimum stops applying.
- Total shown = amount + fee, matching to the last decimal on every screen.

**Balance and limits**
- Balance exactly equal to amount + fee (must pass), and 0.01 less (must fail).
- Balance covers the amount but not the fee.
- Limit exactly reached (inclusive?), limit exceeded by 0.01, limit after earlier transactions the same day.

**State and safety**
- Blocked account states (frozen, closed, unverified).
- Double click / double submit / retry after timeout → only one transaction.
- Failure mid-way → no partial debit.
- Balance, history and ledger all updated consistently after success, and unchanged after failure.

**Display**
- Currency symbol, decimals and digit grouping per locale.
- No sensitive data (full card or account numbers) shown or logged.

## Reviewer checklist (phase 04)

- Every money assertion uses exact values, never "greater than zero" or "is shown".
- Every expected amount shows its working (amount, fee, rounding) so a human can verify it.
- Boundaries are tested on both sides.
- At least one test checks the money **after** the action (balance, ledger), not only the success message.
- Double submit and failure cases are covered for every action that moves money.
- Test data never uses real accounts, cards or personal data.
