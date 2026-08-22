"""
Role Management Hook — Dominion (Representative Democracy)

Governance model: Full power delegated to elected admins.
Role assignments are immediate — no vote required for any role.
The admin/user_manager decides, and the system trusts that authority.

Runs sandboxed. Prehooks return a plain ``{"allowed", "reason"}`` verdict
rather than raising, since exceptions do not cross the sandbox boundary.
"""

from ggg_sdk import hook


@hook
def role_assign_prehook(args):
    """Dominion: admin decides, no further checks needed."""
    return {"allowed": True}


@hook
def role_revoke_prehook(args):
    """Dominion: admin decides revocations directly."""
    return {"allowed": True}


@hook
def role_assign_posthook(args):
    return None


@hook
def role_revoke_posthook(args):
    return None


@hook
def get_governance_params(args):
    """Dominion: low friction, raised for money, wasm, and risky code."""
    proposal_type = args.get("proposal_type") or ""
    perms = args.get("requested_permissions") or []
    if proposal_type == "upgrade" and isinstance(args.get("action"), dict) and args["action"].get("target") == "core":
        return {"quorum": 20, "threshold": 0.6, "notice_hours": 72}
    if proposal_type == "transaction":
        return {"quorum": 15, "threshold": 0.55, "notice_hours": 48}
    risky = (
        "treasury.transfer",
        "member.assign_profile",
        "member.revoke_profile",
        "member.activate",
    )
    if proposal_type == "code_execution" and any(p in risky for p in perms):
        return {"quorum": 15, "threshold": 0.55, "notice_hours": 48}
    return {"quorum": 10, "threshold": 0.5, "notice_hours": 24}
