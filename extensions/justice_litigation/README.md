# Justice Litigation

File a dispute with the justice department, have it accepted into a court, and issue the verdict.

## Features

- **Disputes**: a member files a dispute against a user or a department
- **Private descriptions**: the description is encrypted in the browser with [vetKeys](https://internetcomputer.org/docs/current/developer-docs/security/vetkeys) (see below)
- **Courts**: create courts at any level (first instance, specialized, appellate, supreme), run by a department or a licensed organization
- **Verdicts**: accept a dispute into a court, assign a judge, draft and issue the verdict
- **Statistics**: disputes by status

## How a dispute moves

1. **File** — a member files a dispute (`dispute_file`): a title, the defendant, and an encrypted description.
2. **Accept** — the justice department accepts it into a court (`dispute_accept`), which opens a case.
3. **Assign** — a judge of that court is assigned to the case (`case_assign`).
4. **Verdict** — the verdict is drafted (`verdict_draft`) and issued by the assigned judge (`verdict_issue`).

The "Execute Verdict" dialog runs steps 2–4 in one go: it asks for the court and the judge when the dispute
has not been accepted yet.

## Private description (vetKeys)

| Stored in the realm (visible to the justice department) | Encrypted (vetKeys) |
|---------------------------------------------------------|---------------------|
| Dispute ID, title, claimant, defendant, status, case | Description |

The description is encrypted in the claimant's browser for the claimant and the defendant (for a department,
its head and seat holders) under a `user:<claimant>:dispute:<uuid>` scope, and stored as the dispute's
`description_ref`. The realm shows `description_ref` only to the parties (`dispute_get`), so the justice
department cannot read the description.

## Not supported by this realm version

- **Your own disputes**: only holders of `dispute.view_all` can list disputes; a member's own list needs an operation
  that lists the caller's disputes.
- **Court list**: courts can be created but not listed; the court hierarchy view needs a court listing operation.

## Realm operations

`me`, `user_list`, `department_list`, `department_get`, `dispute_list_all`, `dispute_file`, `dispute_accept`,
`case_assign`, `verdict_draft`, `verdict_issue`, `court_create`. The extension has no backend.

**Category:** Public Services  
**Access:** Members and Admins  
**Version:** 1.0.0
