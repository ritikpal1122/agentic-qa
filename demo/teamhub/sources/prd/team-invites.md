# PRD: Team invites

Owner: pm-lena · Last edited: 2026-10-19 · Status: Approved

## 1. Summary

Workspace owners and admins can invite people by email. The invited person opens a link and joins the workspace
as a member.

## 2. Who can invite

| Role | Can invite | Can revoke a pending invite |
|---|---|---|
| Owner | yes | yes |
| Admin | yes | yes |
| Member | no | no |

Members do not see the invite form.

## 3. Seats

| Plan | Seats |
|---|---|
| Free | 3 |
| Pro | 10 |

Every person in the workspace uses a seat, including the owner. **A pending invite also uses a seat**, so a
workspace can never end up with more people than its plan allows once invites are accepted.

The Members screen shows seats as `Seats <used> / <limit>`.

If a new invite would go over the limit, show **"Seat limit reached. Upgrade to Pro to add more people."** and do
not create the invite.

Revoking a pending invite frees its seat straight away.

## 4. Sending an invite

1. Admin types an email address and presses **Send invite**.
2. The invite appears in the Pending list with a **Revoke** button.
3. Message: **"Invite sent to <email>"**.

Errors (the invite is not created):

| Case | Message |
|---|---|
| Not a valid email | "Enter a valid email address" |
| The person is already a member | "Already a member" |
| The email already has a pending invite | "Already invited" |
| Seat limit reached | see §3 |

## 5. Accepting an invite

The invite link is valid for 7 days from when it was sent. The invited person presses **Join workspace**:
- valid link: they become a **Member**, the invite leaves the Pending list, and they see **"You joined Acme"**.
- expired link: **"This invite has expired"**, and nothing changes.

Accepting does not use a new seat: the seat moves from the invite to the member.

## 6. Out of scope

- Changing a member's role
- Removing members
- Resending an invite
