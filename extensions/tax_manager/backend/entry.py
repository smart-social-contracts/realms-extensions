"""
Tax Manager Extension Backend

Edits the realm's tax parameters and adopts them as its tax policy. The
parameters are stored host-side (``ggg.TaxPolicy``, validated by
``core.taxation``); the active codex reads the adopted version and does the
calculation and invoicing. This extension never computes who owes what,
except for ``preview_tax``, which runs the same reference calculation the
codex uses (``ggg_sdk.tax_breakdown``) on numbers the user typed.

Runs sandboxed. Who may edit, and whether adopting needs a vote, is decided
host-side; this module only names the action and shapes the reply.
"""

import json

from ggg_sdk import ctx, tax_breakdown


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


def get_tax_overview(args) -> str:
    """Adopted policy, the draft, open votes, and what the active codex supports."""
    try:
        return _ok(ctx.tax.overview())
    except Exception as e:
        return _err(e)


def get_tax_history(args) -> str:
    a = _parse_args(args)
    try:
        return _ok(ctx.tax.history(cursor=a.get("cursor") or 1, count=a.get("count") or 20))
    except Exception as e:
        return _err(e)


def preview_tax(args) -> str:
    """What one taxpayer would owe under one (unsaved) tax definition."""
    a = _parse_args(args)
    tax = a.get("tax")
    if not isinstance(tax, dict):
        return _err("tax is required")
    try:
        return _ok(tax_breakdown(tax, a.get("quantity", 1)))
    except Exception as e:
        return _err(e)


def save_tax_draft(args) -> str:
    a = _parse_args(args)
    document = a.get("document")
    if not isinstance(document, dict):
        return _err("document is required")
    try:
        return _ok(ctx.tax.save_draft(document, str(a.get("description") or "")))
    except Exception as e:
        return _err(e)


def discard_tax_draft(args) -> str:
    try:
        return _ok(ctx.tax.discard_draft())
    except Exception as e:
        return _err(e)


def adopt_tax_policy(args) -> str:
    """Adopt the draft: directly under a 1/1 policy, otherwise through a vote."""
    a = _parse_args(args)
    try:
        return _ok(ctx.tax.adopt(confirm=bool(a.get("confirm"))))
    except Exception as e:
        return _err(e)


def run_tax_assessment(args) -> str:
    """One assessment batch in the codex; call again with ``next_cursor``."""
    a = _parse_args(args)
    try:
        return _ok(ctx.tax.assess(cursor=str(a.get("cursor") or "")))
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "get_tax_overview": get_tax_overview,
    "get_tax_history": get_tax_history,
    "preview_tax": preview_tax,
    "save_tax_draft": save_tax_draft,
    "discard_tax_draft": discard_tax_draft,
    "adopt_tax_policy": adopt_tax_policy,
    "run_tax_assessment": run_tax_assessment,
}
