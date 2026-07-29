"""
Role Management Hook — Syntropia (Full Direct Democracy)

Governance model: Zero trust, no delegation. Every role assignment must pass
through a collective governance vote with high quorum and threshold.
Designed for a future of cognitively-enhanced citizens where full
participation is trivial rather than burdensome.

Runs sandboxed. Prehooks return a plain ``{"allowed", "reason"}`` verdict
rather than raising, since exceptions do not cross the sandbox boundary: a
raised error reads as "the hook broke", which the host refuses, and the
proposer would never see why.
"""

from ggg_sdk import hook, realm


def _approved(args, change):
    """Whether an executed proposal authorizes this role change."""
    return realm.proposals.find_executed(
        args.get("user_id", ""), args.get("profile_name", ""), change
    ) is not None


@hook
def role_assign_prehook(args):
    """Syntropia: every role assignment requires collective approval."""
    if not _approved(args, "assign"):
        return {
            "allowed": False,
            "reason": (
                "All role assignments require an approved governance proposal. "
                "Confirm the prompt to submit one for collective approval."
            ),
        }
    return {"allowed": True}


@hook
def role_revoke_prehook(args):
    """Syntropia: every role revocation also requires collective approval."""
    if not _approved(args, "revoke"):
        return {
            "allowed": False,
            "reason": (
                "All role revocations require an approved governance proposal. "
                "Confirm the prompt to submit one for collective approval."
            ),
        }
    return {"allowed": True}


@hook
def role_assign_posthook(args):
    return None


@hook
def role_revoke_posthook(args):
    return None


@hook
def get_governance_params(args):
    """Syntropia: maximum civic standards for all governance actions."""
    return {"quorum": 66, "threshold": 0.75, "notice_hours": 168}
