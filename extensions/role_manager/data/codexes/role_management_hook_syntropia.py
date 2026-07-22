"""
Role Management Hook — Syntropia (Full Direct Democracy)

Governance model: Zero trust, no delegation. Every role assignment must pass
through a collective governance vote with high quorum and threshold.
Designed for a future of cognitively-enhanced citizens where full
participation is trivial rather than burdensome.
"""

from ic_python_logging import get_logger

logger = get_logger("codex.role_management_hook")


def _find_approved_role_proposal(user_id, profile_name, action="assign"):
    """Check if there's an executed governance proposal for this role action."""
    proposal_type = "role_assignment" if action == "assign" else "role_revocation"
    try:
        from ggg import Proposal
        import json

        for proposal in Proposal.instances():
            if proposal.status != "executed":
                continue
            try:
                meta = json.loads(proposal.metadata) if proposal.metadata else {}
            except Exception:
                continue
            if meta.get("target_principal") != user_id:
                continue
            if (
                meta.get("proposal_type") == proposal_type
                and meta.get("profile_name") == profile_name
            ):
                return proposal
            # Legacy revocation encoding: role_assignment + "revoke_<profile>"
            if (
                action == "revoke"
                and meta.get("proposal_type") == "role_assignment"
                and meta.get("profile_name") == f"revoke_{profile_name}"
            ):
                return proposal
    except Exception as e:
        logger.warning(f"Error checking for approved proposal: {e}")
    return None


def role_assign_prehook(user, profile_name, assigner_principal):
    """Syntropia: every role assignment requires collective approval."""
    proposal = _find_approved_role_proposal(user.id, profile_name, "assign")
    if not proposal:
        raise PermissionError(
            "All role assignments require an approved governance proposal. "
            "Confirm the prompt to submit one for collective approval."
        )
    logger.info(
        f"[Syntropia] Role '{profile_name}' assignment approved via collective vote "
        f"for {user.id}"
    )
    return True


def role_revoke_prehook(user, profile_name, revoker_principal):
    """Syntropia: every role revocation also requires collective approval."""
    proposal = _find_approved_role_proposal(user.id, profile_name, "revoke")
    if not proposal:
        raise PermissionError(
            "All role revocations require an approved governance proposal. "
            "Confirm the prompt to submit one for collective approval."
        )
    return True


def role_assign_posthook(user, profile_name, assigner_principal):
    """Post-assignment: log with full transparency."""
    logger.info(
        f"[Syntropia] Profile '{profile_name}' assigned to {user.id} "
        f"(collectively approved)"
    )


def role_revoke_posthook(user, profile_name, revoker_principal):
    """Post-revocation: log with full transparency."""
    logger.info(
        f"[Syntropia] Profile '{profile_name}' revoked from {user.id} "
        f"(collectively approved)"
    )


def get_governance_params(proposal_type, requested_permissions):
    """Syntropia: maximum civic standards for all governance actions."""
    return {"quorum": 66, "threshold": 0.75, "notice_hours": 168}
