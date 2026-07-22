"""
Role Management Hook — Agora (Semi-Direct Democracy, Swiss model)

Governance model: Sensitive roles (judge, admin, treasurer) require a
governance vote. Routine roles (member, observer) can be assigned directly
by an admin or user_manager. The codex defines which roles are "sensitive"
and what governance parameters are required for proposals.
"""

from ic_python_logging import get_logger

logger = get_logger("codex.role_management_hook")

SENSITIVE_ROLES = ("judge", "admin", "treasurer", "operator")


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
    """Agora: sensitive roles require an approved governance proposal."""
    if profile_name in SENSITIVE_ROLES:
        proposal = _find_approved_role_proposal(user.id, profile_name, "assign")
        if not proposal:
            raise PermissionError(
                f"Assigning '{profile_name}' requires an approved governance proposal. "
                f"Confirm the prompt to submit one for a vote."
            )
        logger.info(
            f"[Agora] Sensitive role '{profile_name}' assignment approved via proposal "
            f"for {user.id}"
        )
    else:
        logger.info(
            f"[Agora] Routine role '{profile_name}' assigned directly to {user.id} "
            f"by {assigner_principal}"
        )
    return True


def role_revoke_prehook(user, profile_name, revoker_principal):
    """Agora: revoking sensitive roles also requires governance approval."""
    if profile_name in SENSITIVE_ROLES:
        proposal = _find_approved_role_proposal(user.id, profile_name, "revoke")
        if not proposal:
            raise PermissionError(
                f"Revoking '{profile_name}' requires an approved governance proposal. "
                f"Confirm the prompt to submit one for a vote."
            )
    return True


def role_assign_posthook(user, profile_name, assigner_principal):
    """Post-assignment: log the action."""
    logger.info(f"[Agora] Profile '{profile_name}' assigned to {user.id}")


def role_revoke_posthook(user, profile_name, revoker_principal):
    """Post-revocation: log the action."""
    logger.info(f"[Agora] Profile '{profile_name}' revoked from {user.id}")


def get_governance_params(proposal_type, requested_permissions):
    """Agora: moderate governance rigor, higher for role assignments."""
    if proposal_type == "role_assignment":
        return {"quorum": 25, "threshold": 0.6, "notice_hours": 72}
    return {"quorum": 15, "threshold": 0.5, "notice_hours": 48}
