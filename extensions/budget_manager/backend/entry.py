"""
Budget Manager Extension Backend

GGG treasury standard (issue #261): epoch-based allocation of recognized
revenue into department funds.

  - Overview: epoch config, adopted allocation rule, schedule state
  - Flow: Sankey read model (revenue mix → pool → funds → spending)
  - Timeline: interactive epoch axis (pan/zoom, click to select)
  - Allocation: adopt percentage rules, run ad-hoc allocations
  - Settings: epoch length, automatic sweep + allocation schedule

All mutating actions are policy-gated by the treasury's governing
department (the org linked to the source fund, ROOT by default): a 1/1
policy applies directly, anything else becomes an org-scoped proposal —
the same model as access_manager position/payroll actions.
"""

import json
import traceback

from ggg import Department, ROOT_ORG_NAME, User
from ggg.system.user_profile import Operations, OPERATIONS_SEPARATOR
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.budget_manager")


# ---------------------------------------------------------------------------
# Helpers (same conventions as access_manager)
# ---------------------------------------------------------------------------

def _parse_args(args):
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _get_caller_principal() -> str:
    return ic.caller().to_str()


def _get_caller_user() -> User:
    principal = _get_caller_principal()
    user = User[principal]
    if not user:
        raise PermissionError(f"User {principal} not found")
    return user


def _is_allowed(user: User, operation: str) -> bool:
    for profile in user.profiles:
        allowed = str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR)
        if Operations.ALL in allowed or operation in allowed:
            return True
    try:
        for perm in user.permissions:
            if perm.name == operation:
                return True
    except Exception:
        pass
    return False


def _is_dept_head(user: User, dept: Department) -> bool:
    try:
        return dept.head and dept.head.id == user.id
    except Exception:
        return False


def _caller_in_root(user: User) -> bool:
    root = Department[ROOT_ORG_NAME]
    if not root:
        return False
    try:
        if root.head and root.head.id == user.id:
            return True
        from core.membership import user_in_department

        return user_in_department(user, root)
    except Exception:
        return False


def _can_manage_treasury(user: User, dept: Department) -> bool:
    """Admin, org-appoint rights, treasury dept head, or root member."""
    if _is_allowed(user, Operations.ALL):
        return True
    if _is_allowed(user, Operations.ORG_APPOINT):
        return True
    if _is_dept_head(user, dept):
        return True
    if _caller_in_root(user):
        return True
    return False


def _treasury_department() -> Department:
    """Org whose policy gates treasury actions: source fund's org, else root."""
    from core.treasury_allocation import _source_fund

    fund = _source_fund()
    dept = None
    try:
        dept = fund.department if fund else None
    except Exception:
        dept = None
    return dept or Department[ROOT_ORG_NAME]


def _format_org_policy(dept: Department) -> str:
    m = int(getattr(dept, "policy_threshold_m", 1) or 1)
    n = int(getattr(dept, "policy_threshold_n", 1) or 1)
    q = int(getattr(dept, "policy_quorum_percent", 0) or 0)
    veto = (getattr(dept, "policy_veto_principals", "") or "").strip()
    label = f"{m}/{n}"
    extras = []
    if q > 0:
        extras.append(f"quorum {q}%")
    if veto:
        extras.append("veto")
    if extras:
        label = f"{label} ({', '.join(extras)})"
    return label


def _vote_confirmation_payload(governing: Department, summary: str) -> dict:
    """Fields for the UI confirmation modal before creating a proposal."""
    policy = _format_org_policy(governing)
    return {
        "requires_confirmation": True,
        "summary": summary,
        "governed_by": governing.name,
        "policy": policy.split(" (")[0],
        "governed_policy": policy,
        "policy_reason": (
            f"Treasury actions are governed by {governing.name}'s policy "
            f"({policy}); a vote is required before this change can apply."
        ),
        "voters_org": governing.name,
    }


def _submit_treasury_proposal(action: dict, governing: Department, summary: str) -> dict:
    """Create an org-scoped Proposal that replays *action* on approval."""
    from core.treasury_allocation import build_treasury_proposal_code
    from ggg import Proposal

    proposer = _get_caller_user()
    proposal_num = len(Proposal.instances()) + 1
    proposal_id = f"prop_{proposal_num:03d}"

    metadata = {
        "proposal_type": "treasury_action",
        "org_scope": governing.name,
        "treasury_action": action,
        "code_inline": build_treasury_proposal_code(action),
        "codex_name": f"treasury_action_{proposal_id}",
    }

    voting_window = 604_800
    try:
        from ggg import Realm

        realm = Realm[1]
        if realm and realm.calendar and realm.calendar.voting_window:
            voting_window = int(realm.calendar.voting_window)
    except Exception:
        pass
    deadline_s = ic.time() // 1_000_000_000 + voting_window

    proposal = Proposal(
        proposal_id=proposal_id,
        title=summary,
        description=(
            f"Treasury action governed by '{governing.name}' "
            f"(policy {governing.policy_threshold_m}/{governing.policy_threshold_n}). "
            f"Proposed by {proposer.id}."
        ),
        code_url="",
        code_checksum="",
        proposer=proposer,
        status="voting",
        voting_deadline=str(deadline_s),
        votes_yes=0.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=0.0,
        required_threshold=1.0,
        org_scope=governing.name,
        metadata=json.dumps(metadata),
    )
    logger.info(
        f"treasury proposal {proposal_id} submitted for '{governing.name}': {summary}"
    )
    return {
        "proposal_id": proposal.proposal_id,
        "status": proposal.status,
        "org_scope": governing.name,
    }


def _gated_treasury_action(args_dict: dict, action: dict) -> str:
    """Shared direct-vs-proposal flow for every mutating treasury action."""
    from core.position_admin import policy_is_direct
    from core.treasury_allocation import (
        apply_treasury_action,
        describe_treasury_action,
    )

    caller = _get_caller_user()
    governing = _treasury_department()
    if not _can_manage_treasury(caller, governing):
        return json.dumps({
            "success": False,
            "error": "Access denied: treasury actions require admin/head rights",
        })

    action = {**action, "triggered_by": caller.id}

    if policy_is_direct(governing):
        result = apply_treasury_action(action)
        if result.get("error"):
            return json.dumps({"success": False, "error": result["error"]})
        logger.info(
            f"Treasury action {action.get('kind')} applied directly by {caller.id}"
        )
        return json.dumps({
            "success": True,
            "data": {**result, "applied": "direct", "governed_by": governing.name},
        })

    summary = describe_treasury_action(action)
    # A vote is needed — never create the proposal without explicit
    # confirmation from the caller (the UI shows a confirmation modal).
    if not args_dict.get("confirm"):
        return json.dumps({
            "success": True,
            "data": _vote_confirmation_payload(governing, summary),
        })

    data = _submit_treasury_proposal(action, governing, summary)
    return json.dumps({
        "success": True,
        "data": {**data, "applied": "proposal", "summary": summary},
    })


# ---------------------------------------------------------------------------
# Read endpoints
# ---------------------------------------------------------------------------

def get_treasury_overview(args) -> str:
    """Epoch config, funds, adopted rule and schedule state."""
    try:
        _get_caller_user()  # any registered member may look
        from core.treasury_allocation import treasury_overview

        data = treasury_overview()
        governing = _treasury_department()
        data["governed_by"] = governing.name if governing else None
        data["governed_policy"] = _format_org_policy(governing) if governing else ""
        return json.dumps({"success": True, "data": data})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_treasury_overview error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_allocation_status(args) -> str:
    """Pool, allocations and revenue mix for one epoch."""
    try:
        _get_caller_user()
        args_dict = _parse_args(args)
        from core.treasury_allocation import allocation_status

        result = allocation_status(args_dict.get("period"))
        if result.get("error"):
            return json.dumps({"success": False, "error": result["error"]})
        return json.dumps({"success": True, "data": result})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_allocation_status error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_allocation_flows(args) -> str:
    """Sankey nodes/links for one epoch."""
    try:
        _get_caller_user()
        args_dict = _parse_args(args)
        from core.treasury_allocation import allocation_flows

        result = allocation_flows(args_dict.get("period"))
        if result.get("error"):
            return json.dumps({"success": False, "error": result["error"]})
        return json.dumps({"success": True, "data": result})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_allocation_flows error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_budgets(args) -> str:
    """Planned vs actual allocation budgets for one epoch."""
    try:
        _get_caller_user()
        args_dict = _parse_args(args)
        from core.treasury_allocation import budgets_for_period

        result = budgets_for_period(args_dict.get("period"))
        if result.get("error"):
            return json.dumps({"success": False, "error": result["error"]})
        return json.dumps({"success": True, "data": result})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_budgets error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_epoch_timeline(args) -> str:
    """Interactive timeline read model — epochs with stats and timestamps."""
    try:
        _get_caller_user()
        args_dict = _parse_args(args)
        from core.treasury_allocation import epoch_timeline

        result = epoch_timeline(
            center_ts=args_dict.get("center_ts"),
            before=args_dict.get("before", 20),
            after=args_dict.get("after", 20),
        )
        return json.dumps({"success": True, "data": result})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_epoch_timeline error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Mutating endpoints (policy-gated)
# ---------------------------------------------------------------------------

def set_allocation_rule(args) -> str:
    """Adopt a new percentage split (policy-gated)."""
    try:
        args_dict = _parse_args(args)
        rules = args_dict.get("rules") or []
        if not isinstance(rules, list) or not rules:
            return json.dumps({"success": False, "error": "rules is required"})
        return _gated_treasury_action(
            args_dict,
            {
                "kind": "set_rule",
                "rules": rules,
                "description": str(args_dict.get("description") or ""),
            },
        )
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"set_allocation_rule error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def run_allocation(args) -> str:
    """Run an ad-hoc allocation for one epoch (policy-gated)."""
    try:
        args_dict = _parse_args(args)
        return _gated_treasury_action(
            args_dict,
            {
                "kind": "run_allocation",
                "period": str(args_dict.get("period") or ""),
            },
        )
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"run_allocation error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def set_epoch_config(args) -> str:
    """Change the calendar epoch length (policy-gated)."""
    try:
        args_dict = _parse_args(args)
        epoch_length = str(args_dict.get("epoch_length") or "").strip()
        if not epoch_length:
            return json.dumps({"success": False, "error": "epoch_length is required"})
        action = {"kind": "set_epoch", "epoch_length": epoch_length}
        if args_dict.get("anchor_month") is not None:
            action["anchor_month"] = int(args_dict["anchor_month"])
        if args_dict.get("epoch_minutes") is not None:
            action["epoch_minutes"] = int(args_dict["epoch_minutes"])
        return _gated_treasury_action(args_dict, action)
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"set_epoch_config error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def set_treasury_schedule(args) -> str:
    """Enable/disable the daily sweep + auto-allocation schedule.

    Enabling authorizes a standing automatic money movement, so it is
    policy-gated; disabling is always direct for managers — switching
    automation off is the safe direction and must never wait for a vote.
    """
    try:
        args_dict = _parse_args(args)
        enabled = bool(args_dict.get("enabled"))
        auto_allocate = args_dict.get("auto_allocate")

        if not enabled:
            caller = _get_caller_user()
            governing = _treasury_department()
            if not _can_manage_treasury(caller, governing):
                return json.dumps({
                    "success": False,
                    "error": "Access denied: treasury actions require admin/head rights",
                })
            from core.treasury_allocation import set_treasury_schedule as core_set

            result = core_set(False, triggered_by=caller.id)
            if result.get("error"):
                return json.dumps({"success": False, "error": result["error"]})
            return json.dumps({"success": True, "data": {**result, "applied": "direct"}})

        action = {"kind": "set_schedule", "enabled": True}
        if auto_allocate is not None:
            action["auto_allocate"] = bool(auto_allocate)
        return _gated_treasury_action(args_dict, action)
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"set_treasury_schedule error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


EXTENSION_FUNCTIONS = {
    "get_treasury_overview": get_treasury_overview,
    "get_allocation_status": get_allocation_status,
    "get_allocation_flows": get_allocation_flows,
    "get_epoch_timeline": get_epoch_timeline,
    "get_budgets": get_budgets,
    "set_allocation_rule": set_allocation_rule,
    "run_allocation": run_allocation,
    "set_epoch_config": set_epoch_config,
    "set_treasury_schedule": set_treasury_schedule,
}
