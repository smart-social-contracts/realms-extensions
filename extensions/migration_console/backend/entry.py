"""
Migration Console Extension Backend

Codex-driven admin console for incumbent migrations (issue #241). Content is
driven by the codex configuration stored in ``Realm.manifest_data`` (dashboard
profile ``incumbent_migration``), not hard-coded per codex.

Panels served:
  - Readiness checklist — live milestones toward the alpha→beta gate
    (computed by core.lifecycle_gate, which also enforces the hard gate)
  - Organizations — seeded departments with policy, budget, member counts
  - Staff invites — per-(department, profile) invite URLs and redemption counts
  - Citizen import — bulk census import, claim progress, pending invite URLs
  - Quarters & currency — population per quarter, accounting currency status

Visible to admins and members of any seeded department (a Treasury clerk sees
the console, but regenerating invites stays admin/root-only).
"""

import json
import traceback

from ggg import (
    Department,
    Realm,
    RegistrationCode,
    ROOT_ORG_NAME,
    User,
)
from ggg.system.registration_code import create_registration_code
from ggg.system.user_profile import Operations, OPERATIONS_SEPARATOR
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.migration_console")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_args(args):
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _get_caller_user() -> User:
    principal = ic.caller().to_str()
    user = User[principal]
    if not user:
        raise PermissionError(f"User {principal} not found")
    return user


def _is_allowed(user: User, operation: str) -> bool:
    for profile in user.profiles:
        allowed = str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR)
        if Operations.ALL in allowed or operation in allowed:
            return True
    return False


def _is_admin(user: User) -> bool:
    return _is_allowed(user, Operations.ALL) or _is_allowed(user, Operations.REALM_ADMIN)


def _in_any_department(user: User) -> bool:
    try:
        return any(True for _ in user.departments)
    except Exception:
        return False


def _require_console_access(user: User):
    if not (_is_admin(user) or _in_any_department(user)):
        raise PermissionError(
            f"Access denied: user {user.id} is neither admin nor department staff"
        )


def _get_realm():
    realms = Realm.instances()
    return realms[0] if realms else None


def _codex_config(realm) -> dict:
    try:
        return json.loads(realm.manifest_data or "{}")
    except Exception:
        return {}


def _frontend_base_url(realm) -> str:
    fid = (getattr(realm, "frontend_canister_id", "") or "").strip()
    return f"https://{fid}.icp0.io" if fid else ""


def _invite_url(code: "RegistrationCode", base_url: str) -> str:
    if not code.code:
        return ""
    base = (code.frontend_url or base_url or "").rstrip("/")
    if not base:
        return ""
    return f"{base}/join?invite={code.code}"


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------

def _serialize_invite(code: "RegistrationCode", base_url: str) -> dict:
    return {
        "code_hash": (code.code_hash or "")[:8],
        "profile": code.profile or "member",
        "department": code.department or "",
        "position": getattr(code, "position", "") or "",
        "url": _invite_url(code, base_url),
        "uses_count": int(code.uses_count or 0),
        "max_uses": int(code.max_uses or 1),
        "is_valid": code.is_valid(),
        "revoked": code.revoked == 1,
    }


def _serialize_position(pos) -> dict:
    holders = []
    try:
        for a in pos.active_appointments():
            u = a.user
            if u is not None:
                holders.append({"principal": u.id, "nickname": u.nickname or ""})
    except Exception:
        pass

    profile_name = ""
    try:
        if pos.profile:
            profile_name = pos.profile.name or ""
    except Exception:
        pass

    headcount = int(pos.headcount or 1)
    return {
        "key": pos.key or "",
        "title": pos.title or "",
        "profile": profile_name,
        "headcount": headcount,
        "filled": len(holders),
        "vacancies": max(0, headcount - len(holders)),
        "salary_amount": int(pos.salary_amount or 0),
        "salary_period": pos.salary_period or "monthly",
        "status": pos.status or "open",
        "holders": holders,
    }


def _members_by_dept() -> dict:
    """One user scan → {dept_name: [{principal, nickname}, ...]} (issue #242:
    the reverse dept.members index no longer exists)."""
    by_dept: dict = {}
    try:
        from core.membership import iter_users

        for u in iter_users():
            pid = getattr(u, "id", None)
            if not pid:
                continue
            try:
                for d in u.departments:
                    by_dept.setdefault(d.name, []).append(
                        {"principal": pid, "nickname": u.nickname or ""}
                    )
            except Exception:
                continue
    except Exception as e:
        logger.warning(f"_members_by_dept: {e}")
    return by_dept


def _serialize_org(dept: Department, base_url: str, members: list = None) -> dict:
    if members is None:
        members = _members_by_dept().get(dept.name, [])

    fund_info = None
    try:
        if dept.fund:
            fund_info = {"code": dept.fund.code, "name": dept.fund.name}
    except Exception:
        pass

    invites = [
        _serialize_invite(c, base_url)
        for c in RegistrationCode.find_by_department(dept.name)
    ]
    invites.sort(key=lambda i: (i["profile"], i["code_hash"]))

    # Position seats with fill state (issue #241) — absent on old backends.
    positions = []
    try:
        from ggg import Position

        for pos in Position.for_department(dept.name):
            positions.append(_serialize_position(pos))
        positions.sort(key=lambda p: p["title"])
    except Exception:
        pass

    return {
        "name": dept.name,
        "description": dept.description or "",
        "is_root": bool(getattr(dept, "is_root", False) or dept.name == ROOT_ORG_NAME),
        "member_count": len(members),
        "members": members,
        "policy": {
            "threshold_m": int(getattr(dept, "policy_threshold_m", 1) or 1),
            "threshold_n": int(getattr(dept, "policy_threshold_n", 1) or 1),
            "quorum_percent": int(getattr(dept, "policy_quorum_percent", 0) or 0),
        },
        "fund": fund_info,
        "invites": invites,
        "positions": positions,
    }


# ---------------------------------------------------------------------------
# Extension API
# ---------------------------------------------------------------------------

def get_console_data(args) -> str:
    """Everything the console shell renders in one call."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_console_access(caller)

        realm = _get_realm()
        if not realm:
            return json.dumps({"success": False, "error": "No realm configured"})

        config = _codex_config(realm)
        base_url = _frontend_base_url(realm)

        members_map = _members_by_dept()
        orgs = [
            _serialize_org(d, base_url, members=members_map.get(d.name, []))
            for d in Department.instances()
        ]
        orgs.sort(key=lambda o: (0 if o["is_root"] else 1, o["name"]))

        from core.lifecycle_gate import readiness_checklist

        checklist = readiness_checklist(realm)
        done = sum(1 for i in checklist if i["done"])

        from core.citizen_import import import_status

        quarters = []
        try:
            from ggg import Quarter

            for q in Quarter.instances():
                quarters.append({
                    "name": q.name or "",
                    "canister_id": q.canister_id or "",
                    "population": int(q.population or 0),
                    "status": q.status or "active",
                    "index": int(q.index or 0),
                })
            quarters.sort(key=lambda q: q["index"])
        except Exception:
            pass

        return json.dumps({
            "success": True,
            "data": {
                "realm": {
                    "name": realm.name or "",
                    "status": getattr(realm, "status", "") or "",
                },
                "codex": {
                    "dashboard_profile": (config.get("dashboard", {}) or {})
                    .get("public", {})
                    .get("profile", ""),
                    "dependencies": config.get("dependencies", []) or [],
                    "lifecycle": config.get("lifecycle", {}) or {},
                },
                "checklist": checklist,
                "checklist_done": done,
                "checklist_total": len(checklist),
                "organizations": orgs,
                "citizen_import": import_status(),
                "quarters": quarters,
                "currency": {
                    "accounting_currency": getattr(realm, "accounting_currency", "") or "",
                    "token_canister_id": (getattr(realm, "token_canister_id", "") or "").strip(),
                },
                "is_admin": _is_admin(caller),
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_console_data error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def regenerate_invite(args) -> str:
    """Revoke and replace the invite code for a (department, profile) pair."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        if not _is_admin(caller):
            raise PermissionError("Access denied: admin required")

        dept_name = (args_dict.get("department") or "").strip()
        profile = (args_dict.get("profile") or "").strip()
        if not dept_name or not profile:
            return json.dumps({"success": False, "error": "department and profile are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{dept_name}' not found"})

        # Keep the position link across regenerations so redeeming the new
        # code still appoints to the same seat.
        position_key = ""
        for c in RegistrationCode.find_by_department(dept_name):
            if c.profile == profile:
                position_key = getattr(c, "position", "") or position_key
                if c.revoked != 1:
                    c.revoked = 1

        realm = _get_realm()
        base_url = _frontend_base_url(realm) if realm else ""
        expires_in_hours = int(args_dict.get("expires_in_hours", 720))
        max_uses = int(args_dict.get("max_uses", 100))

        new_code = create_registration_code(
            code_hash=None,
            profile=profile,
            max_uses=max_uses,
            expires_in_hours=expires_in_hours,
            created_by=ic.caller().to_str(),
            frontend_url=base_url,
            department=dept_name,
            position=position_key,
        )

        logger.info(f"Invite regenerated for '{dept_name}'/'{profile}' by {ic.caller().to_str()}")
        return json.dumps({"success": True, "data": _serialize_invite(new_code, base_url)})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"regenerate_invite error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def import_citizens(args) -> str:
    """Bulk-import citizens: one single-use personal invite per record."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        if not _is_admin(caller):
            raise PermissionError("Access denied: admin required")

        records = args_dict.get("citizens")
        if records is None:
            return json.dumps({"success": False, "error": "citizens (array) is required"})

        realm = _get_realm()
        base_url = _frontend_base_url(realm) if realm else ""

        from core.citizen_import import DEFAULT_EXPIRES_HOURS, import_citizens as _import

        result = _import(
            records,
            created_by=ic.caller().to_str(),
            frontend_url=args_dict.get("frontend_url") or base_url,
            expires_in_hours=int(args_dict.get("expires_in_hours", DEFAULT_EXPIRES_HOURS)),
        )
        return json.dumps(result)
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"import_citizens error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def list_citizen_invites(args) -> str:
    """Imported citizens with claim state and personal invite URLs (admin).

    Paginated via offset/limit so a multi-thousand census stays under
    message-size limits.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        if not _is_admin(caller):
            raise PermissionError("Access denied: admin required")

        offset = max(0, int(args_dict.get("offset", 0)))
        limit = min(500, max(1, int(args_dict.get("limit", 100))))
        only_pending = bool(args_dict.get("only_pending", False))

        realm = _get_realm()
        base_url = _frontend_base_url(realm) if realm else ""

        from core.citizen_import import _citizen_codes

        rows = []
        for code, meta in _citizen_codes():
            claimed = bool(code.uses_count and code.uses_count > 0)
            if only_pending and (claimed or code.revoked == 1):
                continue
            rows.append({
                "id": code.user_id or "",
                "name": meta.get("name", ""),
                "quarter": meta.get("quarter", ""),
                "email": code.email or "",
                "claimed": claimed,
                "claimed_by": (code.principals_redeemed or "").split(",")[0] if claimed else "",
                "revoked": code.revoked == 1,
                "url": _invite_url(code, base_url),
            })
        rows.sort(key=lambda r: r["id"])
        total = len(rows)
        page = rows[offset:offset + limit]

        return json.dumps({
            "success": True,
            "data": {"citizens": page, "total": total, "offset": offset, "limit": limit},
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_citizen_invites error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


EXTENSION_FUNCTIONS = {
    "get_console_data": get_console_data,
    "regenerate_invite": regenerate_invite,
    "import_citizens": import_citizens,
    "list_citizen_invites": list_citizen_invites,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})
    return EXTENSION_FUNCTIONS[method_name](args)
