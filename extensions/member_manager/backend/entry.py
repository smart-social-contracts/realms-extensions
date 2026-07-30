"""Member Manager — admin API for member profiles, sandboxed.

  - list_members                     : summary list for the member roster
  - get_member_profile               : User + Member + Human + Identity
  - get_member_notifications         : notification history for one member
  - send_member_notification         : admin notification to a member
  - get_member_private_data_envelope : the caller's KeyEnvelope for a member's
                                       private-data scope (consent-based)

Every read here is another member's data, so all of it goes through
admin-gated bridge verbs. Two things that used to be decided in this file are
now decided by the host: whether the caller may see a member at all, and who a
notification is attributed to — ``sender`` is the authenticated caller and is
no longer something this code supplies.
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
    ctx.log(f"member_manager error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def _required(args_dict, key):
    value = str(args_dict.get(key, "") or "").strip()
    if not value:
        raise ValueError(f"{key} is required")
    return value


def list_members(args=None) -> str:
    """Return a summary list of all users with their member status."""
    try:
        return _ok(ctx.members.list())
    except Exception as e:
        return _err(e)


def get_member_profile(args) -> str:
    """Return the complete profile for a single member principal.

    ``private_data`` stays encrypted: the returned ciphertext is only
    decryptable by a client holding an envelope for the scope, which is what
    ``get_member_private_data_envelope`` is for.
    """
    try:
        principal = _required(_parse_args(args), "principal")
        return _ok(ctx.members.profile(principal))
    except Exception as e:
        return _err(e)


def get_member_private_data_envelope(args) -> str:
    """Return the caller's KeyEnvelope for a member's private-data scope.

    Present only if that member shared their data-encryption key with a crypto
    group the caller belongs to; the unwrapping happens client-side.
    """
    try:
        principal = _required(_parse_args(args), "principal")
        scope = f"user:{principal}:private"
        result = ctx.members.private_data_envelope(scope)
        return json.dumps({
            "success": True,
            "has_access": result.get("has_access", False),
            "wrapped_dek": result.get("wrapped_dek"),
            "scope": scope,
        })
    except Exception as e:
        return _err(e)


def get_member_notifications(args) -> str:
    """Return the notification history for a specific member, newest first."""
    try:
        principal = _required(_parse_args(args), "principal")
        return _ok(ctx.members.notifications(principal))
    except Exception as e:
        return _err(e)


def send_member_notification(args) -> str:
    """Send an admin notification to a specific member."""
    try:
        args_dict = _parse_args(args)
        principal = _required(args_dict, "principal")
        title = _required(args_dict, "title")
        message = _required(args_dict, "message")

        result = ctx.members.notify(
            principal,
            title,
            message,
            topic=args_dict.get("topic", "admin"),
            icon=args_dict.get("icon", "bell"),
            href=args_dict.get("href", "/notifications"),
            color=args_dict.get("color", "blue"),
        )
        return _ok({"id": result.get("id")})
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "list_members": list_members,
    "get_member_profile": get_member_profile,
    "get_member_private_data_envelope": get_member_private_data_envelope,
    "get_member_notifications": get_member_notifications,
    "send_member_notification": send_member_notification,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({
            "success": False, "error": f"Unknown method: {method_name}",
        })
    return EXTENSION_FUNCTIONS[method_name](args)
