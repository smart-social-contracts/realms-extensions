"""
Migration Console Extension Backend

Codex-driven admin console for incumbent migrations (issue #241). Content is
driven by the codex configuration stored in ``Realm.manifest_data`` (dashboard
profile ``incumbent_migration``), not hard-coded per codex.

Panels served (shell slice):
  - Readiness checklist — live milestones toward the alpha→beta gate
  - Organizations — seeded departments with policy, budget, member counts
  - Staff invites — per-(department, profile) invite URLs and redemption counts

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
    return f"{base}/extensions/census/user_registration?code={code.code}"


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------

def _serialize_invite(code: "RegistrationCode", base_url: str) -> dict:
    return {
        "code_hash": (code.code_hash or "")[:8],
        "profile": code.profile or "member",
        "department": code.department or "",
        "url": _invite_url(code, base_url),
        "uses_count": int(code.uses_count or 0),
        "max_uses": int(code.max_uses or 1),
        "is_valid": code.is_valid(),
        "revoked": code.revoked == 1,
    }


def _serialize_org(dept: Department, base_url: str) -> dict:
    members = []
    try:
        for m in dept.members:
            members.append({"principal": m.id, "nickname": m.nickname or ""})
    except Exception:
        pass

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
    }


# ---------------------------------------------------------------------------
# Readiness checklist
# ---------------------------------------------------------------------------

def _build_checklist(realm, config, orgs) -> list:
    """Milestones toward the alpha→beta gate. Each item: id, label, done, detail."""
    items = []

    non_root = [o for o in orgs if not o["is_root"]]
    expected = config.get("departments", []) or []
    items.append({
        "id": "departments_seeded",
        "label": "Departments seeded",
        "done": len(non_root) > 0 and len(non_root) >= len(expected),
        "detail": f"{len(non_root)} organizations (template lists {len(expected)})",
    })

    staffed = [o for o in non_root if o["member_count"] > 0]
    items.append({
        "id": "departments_staffed",
        "label": "Civil servants onboarded",
        "done": len(non_root) > 0 and len(staffed) == len(non_root),
        "detail": f"{len(staffed)} of {len(non_root)} departments have members",
    })

    budgets = [o for o in non_root if o["fund"]]
    items.append({
        "id": "budgets_linked",
        "label": "Department budgets linked",
        "done": len(non_root) > 0 and len(budgets) == len(non_root),
        "detail": f"{len(budgets)} of {len(non_root)} departments have a fund",
    })

    population = User.count()
    target = int((config.get("lifecycle", {}) or {}).get("population_target", 0) or 0)
    items.append({
        "id": "citizens_imported",
        "label": "Citizens imported",
        "done": target > 0 and population >= target,
        "detail": f"{population} members (target {target})",
    })

    token_id = (getattr(realm, "token_canister_id", "") or "").strip()
    items.append({
        "id": "treasury_configured",
        "label": "Currency / treasury configured",
        "done": bool(token_id),
        "detail": f"token canister: {token_id or 'not set'}",
    })

    try:
        from ggg import Zone

        zone_count = Zone.count()
    except Exception:
        zone_count = 0
    items.append({
        "id": "zones_defined",
        "label": "Geographic zones defined",
        "done": zone_count > 0,
        "detail": f"{zone_count} zones",
    })

    deps = config.get("dependencies", []) or []
    try:
        from core.runtime_extensions import list_installed

        installed = set(list_installed())
    except Exception:
        installed = set()
    missing = [d for d in deps if d not in installed]
    items.append({
        "id": "extensions_installed",
        "label": "Required extensions installed",
        "done": len(deps) > 0 and not missing,
        "detail": f"missing: {', '.join(missing) if missing else 'none'}",
    })

    # Root handover: the root org has members beyond the realm creator, i.e.
    # governance has been transferred to the top authority (usually congress).
    root_orgs = [o for o in orgs if o["is_root"]]
    root_members = root_orgs[0]["member_count"] if root_orgs else 0
    items.append({
        "id": "root_handover",
        "label": "Root handed to governance authority",
        "done": root_members > 1,
        "detail": f"root organization has {root_members} member(s)",
    })

    return items


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

        orgs = [_serialize_org(d, base_url) for d in Department.instances()]
        orgs.sort(key=lambda o: (0 if o["is_root"] else 1, o["name"]))

        checklist = _build_checklist(realm, config, orgs)
        done = sum(1 for i in checklist if i["done"])

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

        for c in RegistrationCode.find_by_department(dept_name):
            if c.profile == profile and c.revoked != 1:
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
        )

        logger.info(f"Invite regenerated for '{dept_name}'/'{profile}' by {ic.caller().to_str()}")
        return json.dumps({"success": True, "data": _serialize_invite(new_code, base_url)})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"regenerate_invite error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


EXTENSION_FUNCTIONS = {
    "get_console_data": get_console_data,
    "regenerate_invite": regenerate_invite,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})
    return EXTENSION_FUNCTIONS[method_name](args)
