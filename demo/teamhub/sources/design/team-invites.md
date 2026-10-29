# Design: Members screen and invite page

Designer: des-kim · Version 3 · 2026-10-17

## Members screen

```
┌──────────────────────────────────────────────┐
│ Acme                   Free plan · Seats 2 / 3│
├──────────────────────────────────────────────┤
│ Members                                       │
│  owner@acme.test           Owner              │
│  ravi@acme.test            Member             │
│                                               │
│ Pending                                       │
│  (none)                                       │
│                                               │
│ Invite by email                               │
│ [ name@company.com            ] [Send invite] │
└──────────────────────────────────────────────┘
```

- Members are listed with their role, then pending invites with a **Revoke** link on the right.
- After sending, a green line under the form says "Invite sent to <email>" and the field is cleared.

## Invite page (from the email link)

```
┌──────────────────────────────┐
│ You're invited to Acme        │
│ asha@acme.test                │
│                               │
│        [ Join workspace ]     │
└──────────────────────────────┘
```

After joining: "You joined Acme".
