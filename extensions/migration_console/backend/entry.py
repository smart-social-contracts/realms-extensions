"""Migration Console backend, sandboxed.

The realm-setup console: organizations and their seats, invite codes, the
lifecycle readiness checklist, and bulk citizen import.

The screen is assembled host-side in one call rather than stitched together
here, because it draws on six sources and because it is dense with invite URLs
and personal data. Who may see it is decided by the host's RBAC now; this file
used to answer that itself by reading ``profile.allowed_to``, which put the
access rule inside the package it was restraining.
"""

import json

from ggg_sdk import ctx


def _parse_args(args):
    if isinstance(args, dict):
        return args
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    return {}


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(e):
    ctx.log(f"migration_console error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def get_console_data(args) -> str:
    """Everything the console shell renders in one call."""
    try:
        return _ok(ctx.console.overview())
    except Exception as e:
        return _err(e)


def regenerate_invite(args) -> str:
    """Revoke and replace the invite code for a (department, profile) pair."""
    try:
        params = _parse_args(args)
        return _ok(ctx.console.regenerate_invite(
            (params.get("department") or "").strip(),
            (params.get("profile") or "").strip(),
            expires_in_hours=int(params.get("expires_in_hours", 720)),
            max_uses=int(params.get("max_uses", 100)),
        ))
    except Exception as e:
        return _err(e)


def import_citizens(args) -> str:
    """Bulk-import citizens: one single-use personal invite per record."""
    try:
        params = _parse_args(args)
        if params.get("citizens") is None:
            return json.dumps({
                "success": False, "error": "citizens (array) is required",
            })

        result = ctx.console.import_citizens(
            params["citizens"],
            frontend_url=params.get("frontend_url") or "",
            expires_in_hours=params.get("expires_in_hours"),
        )
        return json.dumps(result)
    except Exception as e:
        return _err(e)


def list_citizen_invites(args) -> str:
    """Imported citizens with claim state and personal invite URLs.

    Paginated host-side so a multi-thousand census stays under message-size
    limits.
    """
    try:
        params = _parse_args(args)
        return _ok(ctx.console.citizen_invites(
            offset=int(params.get("offset", 0)),
            limit=int(params.get("limit", 100)),
            only_pending=bool(params.get("only_pending", False)),
        ))
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "get_console_data": get_console_data,
    "regenerate_invite": regenerate_invite,
    "import_citizens": import_citizens,
    "list_citizen_invites": list_citizen_invites,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({
            "success": False, "error": f"Unknown method: {method_name}",
        })
    return EXTENSION_FUNCTIONS[method_name](args)
