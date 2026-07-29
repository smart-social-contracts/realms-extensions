# Role Management Hook Codex Examples

These are example codex implementations for the `role_management_hook` that define per-realm governance policy for role assignment and revocation.

To install a codex, create a `Codex` entity named `role_management_hook` with the code from one of these files.

## Governance Models

| File | Model | Trust Level | Description |
|------|-------|-------------|-------------|
| `role_management_hook_dominion.py` | Dominion | Representative | Full power on elected admins, no vote required |
| `role_management_hook_agora.py` | Agora | Semi-Direct | Swiss model — sensitive roles require a vote, routine roles assigned directly |
| `role_management_hook_syntropia.py` | Syntropia | Direct Democracy | Every role assignment requires collective approval |

## Hook Functions

These hooks always run in a subinterpreter over the capability bridge — they
are the gates deciding who may hold `admin` or `treasurer`, so there is no
in-process mode to fall back to. Each function takes a single `args` dict, is
wrapped in `@hook` from `ggg_sdk`, and returns plain data. Live reads go
through `realm.*` (which round-trips to the host via `rpc`); nothing else from
the realm is reachable.

Each codex can implement any combination of:

- `role_assign_prehook(args)` — Before assignment. Return `{"allowed": bool, "reason": str}`.
- `role_assign_posthook(args)` — After successful assignment.
- `role_revoke_prehook(args)` — Before revocation. Return `{"allowed": bool, "reason": str}`.
- `role_revoke_posthook(args)` — After successful revocation.
- `get_governance_params(args)` — Returns `{"quorum": %, "threshold": 0-1, "notice_hours": int}` for the voting extension.

The role hooks receive `{"user_id", "profile_name", "actor_principal"}`;
`get_governance_params` receives `{"proposal_type", "requested_permissions"}`.

Prehooks return a verdict rather than raising: exceptions do not cross the
sandbox boundary, so a raised `PermissionError` reads to the host as "the hook
broke". The host refuses the role change either way (a governance gate that
fails open is not a gate), but only a returned verdict carries a reason the
caller can act on.

Available reads: `realm.proposals.find_executed(user_id, profile_name, change)`,
`realm.users.get(id)`, `realm.config()`, `realm.info()`, `realm.now()`.

## Governance Parameters

| Parameter | Description | Dominion | Agora | Syntropia |
|-----------|-------------|----------|-------|-----------|
| `quorum` | % of active members that must vote | 10% | 25% | 66% |
| `threshold` | Approval ratio (yes/decisive) | 50% | 60% | 75% |
| `notice_hours` | Minimum voting window | 24h | 72h | 168h (7d) |
