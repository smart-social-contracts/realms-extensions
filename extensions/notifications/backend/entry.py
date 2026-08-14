"""Notifications extension backend, sandboxed.

Messages addressed to a user, a department, or the whole realm, plus the
outbound email queue an off-chain worker drains.

Visibility is the interesting part and it is no longer decided here. The host
resolves the caller's membership and departments and filters before returning
anything, and the id-addressed verbs refuse an id the caller cannot see. Two
consequences worth calling out, because they were live bugs:

  * ``delete_notification`` used to delete whatever id it was handed, so any
    member could delete any message in the realm.
  * ``mark_as_read`` used to flip the shared ``read`` flag on a single-user
    notification without checking the caller was its addressee.

Neither is expressible now: this file cannot name a notification it is not
allowed to read.
"""

import json

from ggg_sdk import ctx


def _args(args):
    if isinstance(args, dict):
        return args
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    return {}


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(e):
    ctx.log(f"notifications error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def get_notifications(args: str = "{}"):
    """Get notifications visible to the current caller."""
    try:
        return json.dumps(ctx.notifications.list())
    except Exception as e:
        ctx.log(f"notifications error: {e}")
        return json.dumps({
            "error": str(e), "notifications": [], "unread_count": 0,
        })


def mark_as_read(args: str):
    """Mark a notification read or unread for the calling user.

    Broadcasts record the caller individually, so this does not clear the
    message for everyone else.
    """
    try:
        params = _args(args)
        result = ctx.notifications.mark_read(
            params.get("id"), bool(params.get("read", True))
        )
        return json.dumps({
            "success": True, "id": result["id"], "read": result["read"],
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


def delete_notification(args: str):
    """Delete a notification. Recipient, sender, or admin only."""
    try:
        result = ctx.notifications.delete(_args(args).get("id"))
        return json.dumps({"success": True, "id": result["id"]})
    except Exception as e:
        return json.dumps({"error": str(e)})


def create_notification(args: str):
    """Create a notification / message.

    Args (JSON):
      title, message            : required
      audience_type             : "user" (default) | "department" | "realm"
      visibility                : "private" (default) | "public"
      user_id                   : target principal (audience_type == "user")
      department                : target department name
      topic, icon, href, color  : optional presentation fields

    User and department messages may be sent by any registered member; a
    realm-wide broadcast requires admin. Both rules are applied host-side.
    """
    try:
        params = _args(args)
        for field in ("title", "message"):
            if field not in params:
                return json.dumps({"error": f"{field} is required"})

        result = ctx.notifications.create(
            params["title"],
            params["message"],
            # The frontend still says user_id; the bridge calls the addressee
            # ``subject``, keeping it distinct from the caller's own identity.
            subject=params.get("user_id", ""),
            audience_type=params.get("audience_type", ""),
            department=params.get("department", ""),
            visibility=params.get("visibility", "private"),
            topic=params.get("topic", "general"),
            icon=params.get("icon", "bell"),
            href=params.get("href", "/notifications"),
            color=params.get("color", "blue"),
            metadata=params.get("metadata", "{}"),
            event_type=params.get("event_type", ""),
        )
        return json.dumps({"success": True, "id": result["id"]})
    except Exception as e:
        return json.dumps({"error": str(e)})


def list_departments(args: str = "{}"):
    """Return the realm's departments for use as message recipients."""
    try:
        return json.dumps({
            "success": True, "departments": ctx.notifications.departments(),
        })
    except Exception as e:
        ctx.log(f"notifications error: {e}")
        return json.dumps({
            "success": False, "error": str(e), "departments": [],
        })


def get_user_email(args: str = "{}"):
    """Return the calling user's email address."""
    try:
        settings = ctx.notifications.email_settings()
        return _ok({
            "email": settings.get("email", ""),
            "email_verified": bool(settings.get("email_verified", False)),
        })
    except Exception as e:
        return _err(e)


def set_user_email(args: str):
    """Store the calling user's email address."""
    try:
        result = ctx.notifications.set_email(_args(args).get("email", ""))
        return _ok({"email": result["email"]})
    except Exception as e:
        return _err(e)


def get_user_email_preferences(args: str = "{}"):
    """Return the calling user's email notification preferences."""
    try:
        settings = ctx.notifications.email_settings()
        return _ok({
            "email_notifications_enabled": settings.get(
                "email_notifications_enabled", True
            ),
        })
    except Exception as e:
        return _err(e)


def set_user_email_preferences(args: str):
    """Store the calling user's email notification preferences."""
    try:
        enabled = bool(_args(args).get("email_notifications_enabled", True))
        result = ctx.notifications.set_email_preferences(enabled)
        return _ok(result)
    except Exception as e:
        return _err(e)


def request_email_verification(args: str):
    """Queue a verification code email to the caller's address."""
    try:
        result = ctx.notifications.request_email_verification(
            _args(args).get("email", "")
        )
        return _ok(result)
    except Exception as e:
        return _err(e)


def verify_email_code(args: str):
    """Confirm ownership of the stored address with the emailed code."""
    try:
        result = ctx.notifications.verify_email_code(_args(args).get("code", ""))
        return _ok(result)
    except Exception as e:
        return _err(e)


def get_pending_email_notifications(args: str = "{}"):
    """Return notifications queued for email delivery, for the worker."""
    try:
        return _ok(ctx.notifications.pending_emails())
    except Exception as e:
        return _err(e)


def mark_email_sent(args: str):
    """Mark a notification's email as sent (or failed) after a delivery try."""
    try:
        params = _args(args)
        result = ctx.notifications.mark_email_sent(
            params.get("id"),
            success=bool(params.get("success", False)),
            error=params.get("error", ""),
        )
        return json.dumps({
            "success": True,
            "id": result["id"],
            "email_status": result["email_status"],
        })
    except Exception as e:
        return _err(e)


def send_test_email(args: str):
    """Queue a test email. Admin-only: it can mail an arbitrary address."""
    try:
        params = _args(args)
        result = ctx.notifications.send_test_email(
            params.get("to", ""),
            subject=params.get("subject"),
            body=params.get("body"),
        )
        return json.dumps({"success": True, "id": result["id"]})
    except Exception as e:
        return _err(e)
