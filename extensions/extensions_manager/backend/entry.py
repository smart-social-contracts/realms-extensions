"""Extensions Manager backend — grant and revoke extension access, sandboxed.

Six grant/revoke entry points remain in the public API, but they now share two
host verbs distinguished by target kind. The permission check moved with them:
this file used to walk ``profile.allowed_to`` itself to decide whether the
caller held ``role.assign``, which put the realm's RBAC inside a package that
the marketplace can update. The host makes that call now.
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
    ctx.log(f"extensions_manager error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def _change(args, target, name_key, grant):
    """Grant or revoke one extension against one target.

    ``target`` is the kind (user/department/profile) and ``name_key`` is the
    argument the frontend sends it under.
    """
    args_dict = _parse_args(args)
    extension = args_dict.get("extension")
    name = args_dict.get(name_key)
    if not extension or not name:
        raise ValueError(f"extension and {name_key} are required")

    action = ctx.extension_access.grant if grant else ctx.extension_access.revoke
    action(extension, target, name)

    verb = "granted to" if grant else "revoked from"
    suffix = "" if target == "user" else f" '{name}'"
    return {"message": f"Extension '{extension}' {verb} {target}{suffix}"}


def list_extensions(args=None) -> str:
    """List all Extension entities with their access grants."""
    try:
        return _ok(ctx.extension_access.list())
    except Exception as e:
        return _err(e)


def grant_extension_to_user(args) -> str:
    try:
        return _ok(_change(args, "user", "user_principal", grant=True))
    except Exception as e:
        return _err(e)


def revoke_extension_from_user(args) -> str:
    try:
        return _ok(_change(args, "user", "user_principal", grant=False))
    except Exception as e:
        return _err(e)


def grant_extension_to_department(args) -> str:
    try:
        return _ok(_change(args, "department", "department", grant=True))
    except Exception as e:
        return _err(e)


def revoke_extension_from_department(args) -> str:
    try:
        return _ok(_change(args, "department", "department", grant=False))
    except Exception as e:
        return _err(e)


def grant_extension_to_profile(args) -> str:
    try:
        return _ok(_change(args, "profile", "profile", grant=True))
    except Exception as e:
        return _err(e)


def revoke_extension_from_profile(args) -> str:
    try:
        return _ok(_change(args, "profile", "profile", grant=False))
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "health": lambda args=None: _ok({"status": "ok"}),
    "list_extensions": list_extensions,
    "grant_extension_to_user": grant_extension_to_user,
    "revoke_extension_from_user": revoke_extension_from_user,
    "grant_extension_to_department": grant_extension_to_department,
    "revoke_extension_from_department": revoke_extension_from_department,
    "grant_extension_to_profile": grant_extension_to_profile,
    "revoke_extension_from_profile": revoke_extension_from_profile,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({
            "success": False, "error": f"Unknown method: {method_name}",
        })
    return EXTENSION_FUNCTIONS[method_name](args)
