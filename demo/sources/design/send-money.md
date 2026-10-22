# Design: Send Money screens

Exported frame notes (stand-in for a Figma file). Version 3 · 2026-10-17

## Frame 1: Send form
- Header: "Send money"
- Balance chip, top right: "Balance ₹5,000.00"
- Dropdown "To" listing saved contacts (name + last 4 digits of phone)
- Input "Amount (₹)", numeric keypad
- Primary button "Continue" (disabled until a contact and an amount are entered)

## Frame 2: Confirm
- Rows: To · Amount · Fee · **Total**
- Primary button "Send ₹{total}"
- Secondary link "Edit"

## Frame 3: Success
- Green tick, "Money sent"
- "Ref: {reference}"
- "New balance ₹{balance}"
- Button "Done"

## Notes
- Amounts shown with 2 decimals and Indian digit grouping (₹1,00,000.00).
