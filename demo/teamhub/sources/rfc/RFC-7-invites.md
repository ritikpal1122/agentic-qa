# RFC-7: Invites API

Author: dev-marco · Status: Accepted · 2026-10-15

## Data

```
Invite { email: string, sentAt: timestamp, invitedBy: userId }
Member { email: string, role: 'owner' | 'admin' | 'member' }
```

## Rules

- **Email normalisation:** trim spaces and lower-case the address before every check and before saving.
  `" Asha@Acme.test "` and `"asha@acme.test"` are the same person.
- **Valid email:** matches `^[^@\s]+@[^@\s]+\.[^@\s]+$` after normalisation.
- **Seats used** = `members.length + pendingInvites.length`. An invite is refused when `seatsUsed >= seatLimit`.
- **Role check:** the server refuses invites and revokes from users whose role is `member`, even if the UI is bypassed.
- **Expiry:** an invite is valid while `now < sentAt + 7 days`. At exactly 7 days it is expired.
- **Accept is idempotent:** accepting the same invite twice (double click, retry) creates exactly one member.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | /workspaces/:id/invites | body `{ email }`; 409 `already_member` / `already_invited`; 402 `seat_limit` |
| DELETE | /workspaces/:id/invites/:email | revoke |
| POST | /invites/accept | body `{ email }`; 410 `expired` |

The demo build runs these rules in the browser, with a 400 ms delay to imitate the server.
