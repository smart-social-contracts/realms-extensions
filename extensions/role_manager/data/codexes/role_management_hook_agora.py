"""
Role Management Hook — Agora (Semi-Direct Democracy, Swiss model)

Governance model: Sensitive roles (judge, admin, treasurer) require a
governance vote. Routine roles (member, observer) can be assigned directly
by an admin or user_manager. The codex defines which roles are "sensitive"
and what governance parameters are required for proposals.

Runs sandboxed. Prehooks return a plain ``{"allowed", "reason"}`` verdict
rather than raising, since exceptions do not cross the sandbox boundary: a
raised error reads as "the hook broke", which the host refuses, and the
proposer would never see why.
"""

from ggg_sdk import hook, realm

SENSITIVE_ROLES = ("judge", "admin", "treasurer", "operator")


def _approved(args, change):
    """Whether an executed proposal authorizes this role change."""
    return realm.proposals.find_executed(
        args.get("user_id", ""), args.get("profile_name", ""), change
    ) is not None


@hook
def role_assign_prehook(args):
    """Agora: sensitive roles require an approved governance proposal."""
    profile_name = args.get("profile_name", "")
    if profile_name in SENSITIVE_ROLES and not _approved(args, "assign"):
        return {
            "allowed": False,
            "reason": (
                "Assigning '" + profile_name + "' requires an approved "
                "governance proposal. Confirm the prompt to submit one for a vote."
            ),
        }
    return {"allowed": True}


@hook
def role_revoke_prehook(args):
    """Agora: revoking sensitive roles also requires governance approval."""
    profile_name = args.get("profile_name", "")
    if profile_name in SENSITIVE_ROLES and not _approved(args, "revoke"):
        return {
            "allowed": False,
            "reason": (
                "Revoking '" + profile_name + "' requires an approved "
                "governance proposal. Confirm the prompt to submit one for a vote."
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
    """Agora: moderate governance rigor, higher for money, wasm, and role votes."""
    proposal_type = args.get("proposal_type") or ""
    perms = args.get("requested_permissions") or []
    if proposal_type == "upgrade" and isinstance(args.get("action"), dict) and args["action"].get("target") == "core":
        return {"quorum": 40, "threshold": 0.67, "notice_hours": 168}
    if proposal_type == "transaction":
        return {"quorum": 25, "threshold": 0.6, "notice_hours": 72}
    if proposal_type == "role_assignment":
        return {"quorum": 25, "threshold": 0.6, "notice_hours": 72}
    risky = (
        "treasury.transfer",
        "member.assign_profile",
        "member.revoke_profile",
        "member.activate",
    )
    if proposal_type == "code_execution" and any(p in risky for p in perms):
        return {"quorum": 25, "threshold": 0.6, "notice_hours": 72}
    return {"quorum": 15, "threshold": 0.5, "notice_hours": 48}
