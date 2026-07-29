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
    """Dominion: low governance friction — quick approvals, modest quorum."""
    return {"quorum": 10, "threshold": 0.5, "notice_hours": 24}
