import json
import re
import traceback
from typing import Any, Dict, List

from ggg import Notification, User
from ic_python_logging import get_logger

try:
    from _cdk import ic as _ic
except ImportError:
    _ic = None

logger = get_logger("notifications.entry")


def _days_in_month(year: int, month: int) -> int:
    """Return number of days in a given month (handles leap years)."""
    if month in (1, 3, 5, 7, 8, 10, 12):
        return 31
    if month in (4, 6, 9, 11):
        return 30
    # February
    if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
        return 29
    return 28


def _parse_timestamp_str_to_ms(ts_str: str) -> int:
    """Parse a timestamp string like '2026-03-24 21:57:23.456' to epoch ms.

    Pure arithmetic — no datetime/calendar imports needed (IC Python compat).
    """
    try:
        parts = ts_str.strip().split(" ")
        date_part = parts[0]  # YYYY-MM-DD
        time_part = parts[1] if len(parts) > 1 else "00:00:00"

        ymd = date_part.split("-")
        year, month, day = int(ymd[0]), int(ymd[1]), int(ymd[2])

        millis = 0
        if "." in time_part:
            time_part, frac = time_part.split(".", 1)
            millis = int(frac.ljust(3, "0")[:3])

        hms = time_part.split(":")
        hour = int(hms[0]) if len(hms) > 0 else 0
        minute = int(hms[1]) if len(hms) > 1 else 0
        second = int(hms[2]) if len(hms) > 2 else 0

        # Days from epoch (1970-01-01) to start of year
        days = 0
        for y in range(1970, year):
            days += 366 if ((y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)) else 365
        for m in range(1, month):
            days += _days_in_month(year, m)
        days += day - 1

        epoch_s = days * 86400 + hour * 3600 + minute * 60 + second
        return epoch_s * 1000 + millis
    except Exception:
        return 0


def _ic_time_ms() -> int:
    """Get current IC canister time in milliseconds (from ic.time() nanoseconds)."""
    try:
        if _ic is not None:
            return _ic.time() // 1_000_000
    except Exception:
        pass
    return 0


def _get_timestamp_ms(notification) -> int:
    """Extract timestamp in milliseconds from a Notification entity.

    TimestampedMixin's SystemTime is broken on IC (returns epoch-0).
    Strategy: try raw attr → parse stored string → fallback to ic.time().
    """
    # 1. Raw internal attr (only non-zero if entity was just created in this call)
    raw = getattr(notification, "_timestamp_created", 0) or 0
    if raw:
        return raw

    # 2. Parse the serialized timestamp_created string
    for attr in ("timestamp_created", "timestamp_updated"):
        ts_str = getattr(notification, attr, None)
        if ts_str and ts_str != "None":
            result = _parse_timestamp_str_to_ms(ts_str)
            if result:
                return result

    # 3. Fallback: use current IC canister time (better than showing nothing)
    return _ic_time_ms()


def _caller_principal() -> str:
    """Resolve the calling principal, or '' off-chain."""
    if _ic is not None:
        try:
            return _ic.caller().to_str()
        except Exception:
            pass
    return ""


def _user_id(notification) -> str:
    """Principal of a notification's target user (audience_type == 'user')."""
    try:
        u = notification.user
        if not u:
            return ""
        return getattr(u, "id", None) or getattr(u, "_id", None) or ""
    except Exception:
        return ""


def _department_name(notification) -> str:
    """Name of a notification's target department (audience_type == 'department')."""
    try:
        d = notification.department
        if not d:
            return ""
        return getattr(d, "name", "") or ""
    except Exception:
        return ""


def _is_read_by(notification, caller: str) -> bool:
    """Whether `caller` has read the notification.

    Single-user notifications use the `read` boolean; broadcasts track readers
    individually in `read_by` so they are per-user.
    """
    audience = getattr(notification, "audience_type", "user") or "user"
    if audience == "user":
        return bool(getattr(notification, "read", False))
    read_by = getattr(notification, "read_by", "") or ""
    return bool(caller) and caller in [p for p in read_by.split(",") if p]


def _notification_to_dict(notification: Notification, caller: str = "") -> Dict[str, Any]:
    """Convert Notification entity to dictionary format"""
    timestamp_ms = _get_timestamp_ms(notification)

    return {
        "id": notification._id,
        "topic": getattr(notification, "topic", "") or "",
        "title": getattr(notification, "title", "") or "",
        "message": getattr(notification, "message", "") or "",
        "sender": getattr(notification, "sender", "") or "",
        "recipient": getattr(notification, "recipient", "") or "",
        "visibility": getattr(notification, "visibility", "private") or "private",
        "audience_type": getattr(notification, "audience_type", "user") or "user",
        "department": _department_name(notification),
        "origin_realm": getattr(notification, "origin_realm", "") or "",
        "timestamp_ms": timestamp_ms,
        "read": _is_read_by(notification, caller),
        "icon": getattr(notification, "icon", "bell") or "bell",
        "href": getattr(notification, "href", "/notifications") or "/notifications",
        "color": getattr(notification, "color", "blue") or "blue",
    }


def _caller_context(caller: str):
    """Resolve the caller's department memberships, membership, and admin status."""
    is_member = False
    caller_depts = set()
    is_admin = False
    if not caller:
        return is_member, caller_depts, is_admin

    try:
        user = User[caller]
        if user:
            is_member = True
            for d in (getattr(user, "departments", None) or []):
                name = getattr(d, "name", None)
                if name:
                    caller_depts.add(name)
            for d in (getattr(user, "headed_departments", None) or []):
                name = getattr(d, "name", None)
                if name:
                    caller_depts.add(name)
    except Exception as exc:
        logger.warning(f"Error resolving caller context for {caller}: {exc}")

    try:
        from core.crypto_scopes import production_context
        is_admin = production_context().is_realm_admin(caller)
    except Exception as exc:
        logger.warning(f"Error resolving admin status for {caller}: {exc}")

    return is_member, caller_depts, is_admin


def _is_visible_to(notification, caller: str, is_member: bool, caller_depts: set) -> bool:
    """Decide whether `caller` may read `notification`.

    public        -> anyone
    private user  -> only the addressed user
    private dept  -> only members (and head) of the department
    private realm -> only registered users of this realm
    """
    visibility = getattr(notification, "visibility", "private") or "private"
    if visibility == "public":
        return True

    audience = getattr(notification, "audience_type", "user") or "user"
    if audience == "user":
        return bool(caller) and _user_id(notification) == caller
    if audience == "department":
        return _department_name(notification) in caller_depts
    if audience == "realm":
        return is_member
    return False


def get_notifications(args: str = "{}"):
    """Get notifications visible to the current caller (visibility-aware)."""
    try:
        logger.info("Fetching notifications")

        params = json.loads(args) if args else {}
        caller = params.get("user_id")
        if not caller and _ic is not None:
            caller = _ic.caller().to_str()
        logger.info(f"Resolving visible notifications for caller: {caller}")

        is_member, caller_depts, _is_admin = _caller_context(caller)

        notifications = Notification.instances()
        logger.info(f"Total notifications in DB: {len(notifications)}")

        visible = []
        for n in notifications:
            try:
                if _is_visible_to(n, caller, is_member, caller_depts):
                    visible.append(n)
            except Exception as exc:
                logger.warning(f"Notification {n._id}: visibility error: {exc}")

        notifications_list = [_notification_to_dict(n, caller) for n in visible]
        notifications_list.sort(key=lambda x: x["timestamp_ms"], reverse=True)

        unread_count = sum(1 for n in notifications_list if not n["read"])

        response = {
            "notifications": notifications_list,
            "unread_count": unread_count,
            "total_count": len(notifications_list),
        }

        logger.info(
            f"Returning {len(notifications_list)} notifications, {unread_count} unread"
        )
        return json.dumps(response)

    except Exception as e:
        error_msg = f"Error fetching notifications: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg, "notifications": [], "unread_count": 0})


def mark_as_read(args: str):
    """Mark a notification as read or unread (toggle) for the calling user.

    Single-user notifications flip the shared `read` flag; broadcast
    notifications track the caller individually in `read_by` so marking one
    user's copy as read does not affect everyone else.
    """
    try:
        args_dict = json.loads(args) if args else {}
        notification_id = args_dict.get("id")
        # Allow explicit read value, default to True for backwards compatibility
        read_value = bool(args_dict.get("read", True))

        if not notification_id:
            return json.dumps({"error": "id is required"})

        logger.info(f"Setting notification {notification_id} read={read_value}")

        # Find notification in database by _id
        notification = Notification.load(str(notification_id))

        if not notification:
            logger.warning(f"Notification {notification_id} not found")
            return json.dumps({"error": f"Notification {notification_id} not found"})

        audience = getattr(notification, "audience_type", "user") or "user"
        if audience == "user":
            notification.read = read_value
        else:
            caller = _caller_principal()
            readers = [p for p in (getattr(notification, "read_by", "") or "").split(",") if p]
            if read_value and caller and caller not in readers:
                readers.append(caller)
            elif not read_value and caller in readers:
                readers.remove(caller)
            notification.read_by = ",".join(readers)

        logger.info(f"Successfully set notification {notification_id} read={read_value}")
        return json.dumps({"success": True, "id": notification_id, "read": read_value})

    except Exception as e:
        error_msg = f"Error updating notification read status: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg})


def delete_notification(args: str):
    """Delete a notification by ID"""
    try:
        args_dict = json.loads(args) if args else {}
        notification_id = args_dict.get("id")

        if not notification_id:
            return json.dumps({"error": "id is required"})

        logger.info(f"Deleting notification {notification_id}")

        notification = Notification.load(str(notification_id))
        if notification:
            notification.delete()
            logger.info(f"Successfully deleted notification {notification_id}")
            return json.dumps({"success": True, "id": notification_id})

        logger.warning(f"Notification {notification_id} not found")
        return json.dumps({"error": f"Notification {notification_id} not found"})

    except Exception as e:
        error_msg = f"Error deleting notification: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg})


def create_notification(args: str):
    """Create a notification / message.

    Args (JSON):
      title, message            : required
      audience_type             : "user" (default) | "department" | "realm"
      visibility                : "private" (default) | "public"
      user_id                   : target principal (audience_type == "user")
      department                : target department name (audience_type == "department")
      topic, icon, href, color  : optional presentation fields

    Authorization:
      * user / department messages — any registered user may send.
      * realm-wide messages — only a realm admin or the system (controller /
        trusted principal) may send.
    """
    try:
        args_dict = json.loads(args) if args else {}

        required_fields = ["title", "message"]
        for field in required_fields:
            if field not in args_dict:
                return json.dumps({"error": f"{field} is required"})

        caller = _caller_principal()

        # Infer audience: an explicit department implies a department broadcast.
        audience_type = args_dict.get("audience_type")
        if not audience_type:
            audience_type = "department" if args_dict.get("department") else "user"
        if audience_type not in ("user", "department", "realm"):
            return json.dumps({"error": f"Invalid audience_type: {audience_type}"})

        visibility = args_dict.get("visibility", "private")
        if visibility not in ("private", "public"):
            return json.dumps({"error": f"Invalid visibility: {visibility}"})

        user = None
        department = None

        if audience_type == "user":
            user_id = args_dict.get("user_id")
            if user_id:
                user = User[user_id]
                if not user:
                    return json.dumps({"error": f"User '{user_id}' not found"})

        elif audience_type == "department":
            dept_name = (args_dict.get("department") or "").strip()
            if not dept_name:
                return json.dumps({"error": "department is required for a department message"})
            from ggg import Department
            department = Department[dept_name]
            if not department:
                return json.dumps({"error": f"Department '{dept_name}' not found"})

        elif audience_type == "realm":
            # Only admins or the system may broadcast to the whole realm.
            is_admin = False
            try:
                from core.crypto_scopes import production_context
                is_admin = production_context().is_realm_admin(caller)
            except Exception as exc:
                logger.warning(f"Admin check failed for {caller}: {exc}")
            if not is_admin:
                return json.dumps({
                    "error": "Only a realm admin or the system may send realm-wide messages",
                })

        new_notification = Notification(
            topic=args_dict.get("topic", "general"),
            title=args_dict["title"],
            message=args_dict["message"],
            sender=caller,
            visibility=visibility,
            audience_type=audience_type,
            user=user,
            department=department,
            read=False,
            read_by="",
            icon=args_dict.get("icon", "bell"),
            href=args_dict.get("href", "/notifications"),
            color=args_dict.get("color", "blue"),
            metadata=args_dict.get("metadata", "{}"),
        )

        # Queue email delivery when the caller provides an event_type and the
        # realm/user settings allow it (issue #266).
        event_type = args_dict.get("event_type", "")
        _maybe_queue_email(new_notification, event_type)

        logger.info(
            f"Created notification {new_notification._id} "
            f"(audience={audience_type}, visibility={visibility}, sender={caller})"
        )
        return json.dumps({"success": True, "id": new_notification._id})

    except Exception as e:
        error_msg = f"Error creating notification: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"error": error_msg})


def list_departments(args: str = "{}"):
    """Return the realm's departments for use as message recipients."""
    try:
        from ggg import Department

        departments = []
        for d in Department.instances():
            try:
                members = list(getattr(d, "members", None) or [])
            except Exception:
                members = []
            departments.append({
                "name": getattr(d, "name", "") or "",
                "description": getattr(d, "description", "") or "",
                "member_count": len(members),
            })

        departments.sort(key=lambda x: x["name"].lower())
        return json.dumps({"success": True, "departments": departments})

    except Exception as e:
        error_msg = f"Error listing departments: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg, "departments": []})


# ─────────────────────────────────────────────────────────────────────────────
# Email notification helpers (issue #266)
# ─────────────────────────────────────────────────────────────────────────────


def _realm_email_config() -> Dict[str, Any]:
    """Return the realm-level email config from Realm.manifest_data."""
    from ggg import Realm

    try:
        realm = Realm.load("1")
        if not realm:
            return {}
        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        manifest = json.loads(manifest_raw)
        if not isinstance(manifest, dict):
            manifest = {}
        email = manifest.get("email") or {}
        return email if isinstance(email, dict) else {}
    except Exception as exc:
        logger.warning(f"Could not read realm email config: {exc}")
        return {}


def _user_email_info(user) -> Dict[str, Any]:
    """Extract email and notification preferences from a User's private_data."""
    try:
        private = getattr(user, "private_data", "") or "{}"
        data = json.loads(private)
        if not isinstance(data, dict):
            data = {}
    except (json.JSONDecodeError, TypeError):
        data = {}

    return {
        "email": (data.get("email") or "").strip(),
        "email_notifications_enabled": data.get("email_notifications_enabled", True),
    }


def _user_id_from_notification(notification) -> str:
    """Return the principal of a single-user notification's target."""
    audience = getattr(notification, "audience_type", "user") or "user"
    if audience != "user":
        return ""
    try:
        u = notification.user
        if not u:
            return ""
        return getattr(u, "id", None) or getattr(u, "_id", None) or ""
    except Exception:
        return ""


def _email_status_from_metadata(notification) -> Dict[str, Any]:
    """Parse email-related metadata on a Notification."""
    try:
        metadata = getattr(notification, "metadata", "") or "{}"
        data = json.loads(metadata)
        if not isinstance(data, dict):
            data = {}
    except (json.JSONDecodeError, TypeError):
        data = {}
    return data


def _email_event_type(event_type: str, notification) -> str:
    """Resolve the event type for an email, falling back to the topic."""
    if event_type:
        return event_type
    topic = getattr(notification, "topic", "") or ""
    if topic and topic != "general":
        return topic
    return "notification"


def _maybe_queue_email(notification, event_type: str = ""):
    """Mark a notification for email delivery if the realm and user allow it.

    Only single-user notifications are handled in this first pass; broadcast
    emails are left for future work.
    """
    try:
        email_config = _realm_email_config()
        if not email_config.get("enabled"):
            return

        events = email_config.get("events") or {}
        if not isinstance(events, dict):
            events = {}

        resolved_event = _email_event_type(event_type, notification)
        if not events.get(resolved_event, True):
            return

        audience = getattr(notification, "audience_type", "user") or "user"
        if audience != "user":
            return

        user_id = _user_id_from_notification(notification)
        if not user_id:
            return

        user = User[user_id]
        if not user:
            return

        info = _user_email_info(user)
        if not info.get("email") or not info.get("email_notifications_enabled", True):
            return

        metadata = _email_status_from_metadata(notification)
        metadata["email_status"] = "pending"
        metadata["event_type"] = resolved_event
        metadata["force_email_to"] = info.get("email")
        notification.metadata = json.dumps(metadata)
        logger.info(
            f"Queued email for notification {notification._id} "
            f"(user={user_id}, event={resolved_event})"
        )
    except Exception as exc:
        logger.warning(f"Could not queue email for notification: {exc}")


def get_user_email(args: str = "{}"):
    """Return the calling user's email address from private_data."""
    try:
        caller = _caller_principal()
        if not caller:
            return json.dumps({"success": False, "error": "No caller identity"})

        user = User[caller]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        info = _user_email_info(user)
        return json.dumps({"success": True, "data": {"email": info.get("email", "")}})
    except Exception as e:
        error_msg = f"Error reading user email: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def set_user_email(args: str):
    """Store the calling user's email address in private_data."""
    try:
        args_dict = json.loads(args) if args else {}
        email = str(args_dict.get("email", "")).strip().lower()
        if email and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
            return json.dumps({"success": False, "error": "Invalid email address"})

        caller = _caller_principal()
        if not caller:
            return json.dumps({"success": False, "error": "No caller identity"})

        user = User[caller]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        try:
            private = json.loads(getattr(user, "private_data", "") or "{}")
            if not isinstance(private, dict):
                private = {}
        except (json.JSONDecodeError, TypeError):
            private = {}

        private["email"] = email
        user.private_data = json.dumps(private)

        return json.dumps({"success": True, "data": {"email": email}})
    except Exception as e:
        error_msg = f"Error setting user email: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def get_user_email_preferences(args: str = "{}"):
    """Return the calling user's email notification preferences."""
    try:
        caller = _caller_principal()
        if not caller:
            return json.dumps({"success": False, "error": "No caller identity"})

        user = User[caller]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        info = _user_email_info(user)
        return json.dumps({
            "success": True,
            "data": {"email_notifications_enabled": info.get("email_notifications_enabled", True)},
        })
    except Exception as e:
        error_msg = f"Error reading email preferences: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def set_user_email_preferences(args: str):
    """Store the calling user's email notification preferences."""
    try:
        args_dict = json.loads(args) if args else {}
        enabled = bool(args_dict.get("email_notifications_enabled", True))

        caller = _caller_principal()
        if not caller:
            return json.dumps({"success": False, "error": "No caller identity"})

        user = User[caller]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        try:
            private = json.loads(getattr(user, "private_data", "") or "{}")
            if not isinstance(private, dict):
                private = {}
        except (json.JSONDecodeError, TypeError):
            private = {}

        private["email_notifications_enabled"] = enabled
        user.private_data = json.dumps(private)

        return json.dumps({"success": True, "data": {"email_notifications_enabled": enabled}})
    except Exception as e:
        error_msg = f"Error setting email preferences: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def get_pending_email_notifications(args: str = "{}"):
    """Return notifications queued for email delivery.

    Called by the off-chain email worker. Returns only the fields needed to
    compose and send an email, plus the notification id for marking sent.
    """
    try:
        notifications = Notification.instances()
        pending = []
        for n in notifications:
            try:
                metadata = _email_status_from_metadata(n)
                if metadata.get("email_status") != "pending":
                    continue

                user_id = _user_id_from_notification(n)
                to_address = metadata.get("force_email_to", "")
                if not to_address and user_id:
                    user = User[user_id]
                    if user:
                        to_address = _user_email_info(user).get("email", "")

                if not to_address:
                    continue

                pending.append({
                    "id": n._id,
                    "topic": getattr(n, "topic", "") or "",
                    "title": getattr(n, "title", "") or "",
                    "message": getattr(n, "message", "") or "",
                    "href": getattr(n, "href", "") or "",
                    "to_address": to_address,
                    "event_type": metadata.get("event_type", "notification"),
                    "user_id": user_id,
                })
            except Exception as exc:
                logger.warning(f"Error reading pending email notification: {exc}")

        pending.sort(key=lambda x: x.get("id", ""))
        return json.dumps({"success": True, "data": {"notifications": pending}})
    except Exception as e:
        error_msg = f"Error listing pending emails: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def mark_email_sent(args: str):
    """Mark a notification's email as sent (or failed) after the worker tries."""
    try:
        args_dict = json.loads(args) if args else {}
        notification_id = args_dict.get("id")
        if not notification_id:
            return json.dumps({"success": False, "error": "id is required"})

        success = bool(args_dict.get("success", False))
        error = args_dict.get("error", "")

        notification = Notification.load(str(notification_id))
        if not notification:
            return json.dumps({"success": False, "error": f"Notification {notification_id} not found"})

        metadata = _email_status_from_metadata(notification)
        metadata["email_status"] = "sent" if success else "failed"
        if error:
            metadata["email_error"] = str(error)
        notification.metadata = json.dumps(metadata)

        return json.dumps({"success": True, "id": notification_id, "email_status": metadata["email_status"]})
    except Exception as e:
        error_msg = f"Error marking email sent: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})


def send_test_email(args: str):
    """Queue a test email notification for the realm admin.

    Args (JSON): {"to": str, "subject": str, "body": str}
    """
    try:
        args_dict = json.loads(args) if args else {}
        to_address = str(args_dict.get("to", "")).strip().lower()
        subject = str(args_dict.get("subject", "Realms email test")).strip()
        body = str(args_dict.get("body", "This is a test email from Realms.")).strip()

        if not to_address:
            return json.dumps({"success": False, "error": "to address is required"})
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", to_address):
            return json.dumps({"success": False, "error": "Invalid to address"})

        caller = _caller_principal()
        if not caller:
            return json.dumps({"success": False, "error": "No caller identity"})

        user = User[caller]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        new_notification = Notification(
            topic="email_test",
            title=subject,
            message=body,
            sender=caller,
            visibility="private",
            audience_type="user",
            user=user,
            read=False,
            read_by="",
            icon="mail",
            href="/notifications",
            color="blue",
            metadata=json.dumps({
                "email_status": "pending",
                "event_type": "email_test",
                "force_email_to": to_address,
            }),
        )

        return json.dumps({"success": True, "id": new_notification._id})
    except Exception as e:
        error_msg = f"Error sending test email: {e}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return json.dumps({"success": False, "error": error_msg})
