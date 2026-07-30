"""
Budget Manager Extension Backend

GGG treasury standard (issue #261): epoch-based allocation of recognized
revenue into department funds.

  - Overview: epoch config, adopted allocation rule, schedule state
  - Flow: Sankey read model (revenue mix → pool → funds → spending)
  - Timeline: interactive epoch axis (pan/zoom, click to select)
  - Allocation: adopt percentage rules, run ad-hoc allocations
  - Settings: epoch length, automatic sweep + allocation schedule

Runs sandboxed. Every mutating action goes through ``ctx.treasury.action``, and
the host decides what happens to it: under a 1/1 policy it applies directly,
otherwise it becomes an org-scoped proposal that replays the action once the vote
passes. This module never sees that decision — it names an action and shapes the
reply — which matters because the action dict is what gets replayed, and because
who is allowed to move the realm's money is not a question an extension should
answer about itself.
"""

import json

from ggg_sdk import ctx


def _parse_args(args):
    if isinstance(args, dict):
        return args
    if isinstance(args, str) and args.strip():
        try:
            return json.loads(args)
        except Exception:
            return {}
    return {}


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(msg):
    return json.dumps({"success": False, "error": str(msg)})


# ---------------------------------------------------------------------------
# Read endpoints
# ---------------------------------------------------------------------------

def get_treasury_overview(args) -> str:
    """Epoch config, funds, adopted rule and schedule state."""
    try:
        return _ok(ctx.treasury.overview())
    except Exception as e:
        return _err(e)


def get_allocation_status(args) -> str:
    """Pool, allocations and revenue mix for one epoch."""
    try:
        return _ok(ctx.treasury.allocation_status(_parse_args(args).get("period")))
    except Exception as e:
        return _err(e)


def get_allocation_flows(args) -> str:
    """Sankey nodes/links for one epoch."""
    try:
        return _ok(ctx.treasury.flows(_parse_args(args).get("period")))
    except Exception as e:
        return _err(e)


def get_budgets(args) -> str:
    """Planned vs actual allocation budgets for one epoch."""
    try:
        return _ok(ctx.treasury.budgets(_parse_args(args).get("period")))
    except Exception as e:
        return _err(e)


def get_epoch_timeline(args) -> str:
    """Interactive timeline read model — epochs with stats and timestamps."""
    a = _parse_args(args)
    try:
        return _ok(ctx.treasury.timeline(
            center_ts=a.get("center_ts"),
            before=a.get("before", 20),
            after=a.get("after", 20),
        ))
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# Mutating endpoints (policy-gated host-side)
# ---------------------------------------------------------------------------

def _action(a, kind, fields):
    try:
        return _ok(ctx.treasury.action(kind, fields, confirm=bool(a.get("confirm"))))
    except Exception as e:
        return _err(e)


def set_allocation_rule(args) -> str:
    """Adopt a new percentage split."""
    a = _parse_args(args)
    rules = a.get("rules") or []
    if not isinstance(rules, list) or not rules:
        return _err("rules is required")
    return _action(a, "set_rule", {
        "rules": rules,
        "description": str(a.get("description") or ""),
    })


def run_allocation(args) -> str:
    """Run an ad-hoc allocation for one epoch."""
    a = _parse_args(args)
    return _action(a, "run_allocation", {"period": str(a.get("period") or "")})


def set_epoch_config(args) -> str:
    """Change the calendar epoch length."""
    a = _parse_args(args)
    epoch_length = str(a.get("epoch_length") or "").strip()
    if not epoch_length:
        return _err("epoch_length is required")

    fields = {"epoch_length": epoch_length}
    if a.get("anchor_month") is not None:
        fields["anchor_month"] = a["anchor_month"]
    if a.get("epoch_minutes") is not None:
        fields["epoch_minutes"] = a["epoch_minutes"]
    return _action(a, "set_epoch", fields)


def set_treasury_schedule(args) -> str:
    """Enable or disable the daily sweep + auto-allocation schedule.

    Enabling authorizes a standing automatic money movement, so it is
    policy-gated; disabling has its own verb and is always direct for managers,
    because making it wait for a vote would mean the money keeps moving.
    """
    a = _parse_args(args)
    if not bool(a.get("enabled")):
        try:
            return _ok(ctx.treasury.disable_schedule())
        except Exception as e:
            return _err(e)

    fields = {"enabled": True}
    if a.get("auto_allocate") is not None:
        fields["auto_allocate"] = a["auto_allocate"]
    return _action(a, "set_schedule", fields)


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
