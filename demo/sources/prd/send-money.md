# PRD: Send Money (PayLite Wallet)

Owner: pm-rahul · Last edited: 2026-10-18 · Related: PAY-101, [Send Money screens](../design/send-money.md)

## Goal
Let wallet users pay a saved contact in under 10 seconds.

## Requirements

1. **Contacts.** The user picks a recipient from their saved contacts only. No free-text phone numbers in this release.
2. **Amount.** Minimum ₹1. Maximum ₹50,000 per transfer. Up to 2 decimal places.
3. **Fee.** A fee of **1%** of the amount, with a minimum fee of ₹2. The fee is paid by the sender, on top of the amount.
4. **Balance.** The wallet balance must cover the amount plus the fee.
5. **Daily limit.** Total sent in a calendar day can go up to the user's limit:
   - KYC basic: ₹10,000 per day
   - KYC full: ₹1,00,000 per day
6. **Confirmation.** Before sending, show recipient, amount, fee and total. The user must confirm.
7. **Success.** Show the transaction reference and the new balance.
8. **Frozen accounts.** A frozen wallet cannot send money.

## Out of scope
- Sending to non-contacts, scheduled transfers, cancelling a transfer.

## Open items
- Copy for error messages to be confirmed with design.
