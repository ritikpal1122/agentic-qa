# RFC-12: Transfers API

Author: dev-anita · Status: Accepted · 2026-10-15

## Summary
`POST /v1/transfers` moves money from the sender's wallet to a contact's wallet.

## Request
```json
{ "contactId": "c_42", "amountPaise": 12345, "idempotencyKey": "uuid" }
```
All money is in **paise** (integers). No floats anywhere.

## Rules
- Fee = 1% of amount, **rounded up** to the next paisa, minimum 200 paise.
- Checks, in order: wallet not frozen → amount within 100..5,000,000 paise → balance ≥ amount + fee → daily total + amount ≤ daily limit.
- The debit, credit and fee entries are written in **one database transaction**. Either all happen or none.
- Same `idempotencyKey` within 24h returns the first result and does not move money again.

## Responses
| Code | When |
|---|---|
| 201 | Created, returns `{ reference, newBalancePaise }` |
| 409 | Duplicate idempotency key with a different body |
| 422 | `INSUFFICIENT_BALANCE`, `DAILY_LIMIT_EXCEEDED`, `ACCOUNT_FROZEN`, `INVALID_AMOUNT` |
