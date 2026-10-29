# Voting Extension

Submit and vote on the realm's proposals. The extension has no backend: it calls the realm's own
proposal operations (`proposal_create`, `proposal_vote`, `proposal_list`, `proposal_get`) and its
federal vote operations.

## Features

- **Proposal Submission**: Polls, transfers from a fund, and upgrades (codex, extension or a Casals core action) that run once accepted
- **Voting System**: Members can vote YES, NO, or ABSTAIN on proposals
- **Department ballots**: Proposals scoped to a department are voted by its seat holders under its policy
- **Realm-wide votes**: Federal votes held in every quarter

## Proposal Lifecycle

1. **Voting**: Open from submission until the realm's voting deadline
2. **Accepted / Rejected**: Recorded by `proposal_finalize`
3. **Executed / Failed**: The accepted action, run once by `proposal_execute`

## Power of attorney

A delegate votes or proposes for a grantor by passing `on_behalf_of` to `proposal_vote` or
`proposal_create`; the realm checks the delegation and records both.
