"""
Access Manager Extension Backend

Admin interface for governance organizations (GGG ``Department`` entity;
product name: Organization — issue #240):
  - Organizations (create, edit, members) — no nesting
  - Policy (M/N, quorum, veto)
  - Budget (fund link)
  - Authority grants (org-over-org, including cross-quarter targets)
  - Extension access and profile assignment

Supersedes the basic role_manager extension.
"""

import json
import traceback
import uuid
from typing import Any, Dict, List

from ggg import (
    Department,
    DepartmentAuthority,
    Extension,
    Fund,
    FundType,
    Permission,
    ROOT_ORG_NAME,
    User,
    UserProfile,
)
from ggg.system.user_profile import Operations, Profiles, OPERATIONS_SEPARATOR
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.access_manager")


# ---------------------------------------------------------------------------
# Helpers
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


def _require_operation(user: User, operation: str):
    if not _is_allowed(user, operation):
        raise PermissionError(
            f"Access denied: user {user.id} lacks permission '{operation}'"
        )


def _is_dept_head(user: User, dept: Department) -> bool:
    """Check if user is the head of the given department."""
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
        pass
    return False


def _can_manage_dept(user: User, dept: Department) -> bool:
    """Admin, role.assign, dept head, or root member can manage an org."""
    if _is_allowed(user, Operations.ALL):
        return True
    if _is_allowed(user, Operations.ROLE_ASSIGN):
        return True
    if _is_allowed(user, Operations.ORG_APPOINT):
        return True
    if _is_dept_head(user, dept):
        return True
    if _caller_in_root(user):
        return True
    return False


def _members_by_dept() -> dict:
    """One user scan → {dept_name: [{principal, nickname}, ...]}.

    The reverse dept.members index no longer exists (issue #242); membership
    is stored one-way on the user.
    """
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


def _serialize_org(dept: Department, members: list = None) -> dict:
    if members is None:
        members = _members_by_dept().get(dept.name, [])

    extensions = []
    try:
        for ext in dept.extensions:
            extensions.append(ext.name)
    except Exception:
        pass

    head_info = None
    try:
        if dept.head:
            head_info = {"principal": dept.head.id, "nickname": dept.head.nickname or ""}
    except Exception:
        pass

    permissions = []
    try:
        for perm in dept.permissions:
            permissions.append(perm.name)
    except Exception:
        pass

    fund_info = None
    try:
        if dept.fund:
            fund_info = {
                "code": dept.fund.code,
                "name": dept.fund.name,
                "fund_type": dept.fund.fund_type or "",
            }
    except Exception:
        pass

    vetoes = []
    try:
        vetoes = dept.veto_principal_list()
    except Exception:
        raw = getattr(dept, "policy_veto_principals", "") or ""
        vetoes = [p.strip() for p in raw.split(",") if p.strip()]

    # Position seats (issue #241) — absent on backends without the entity.
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
        "head": head_info,
        "is_root": bool(getattr(dept, "is_root", False) or dept.name == ROOT_ORG_NAME),
        "member_count": len(members),
        "members": members,
        "extensions": extensions,
        "permissions": permissions,
        "policy": {
            "threshold_m": int(getattr(dept, "policy_threshold_m", 1) or 1),
            "threshold_n": int(getattr(dept, "policy_threshold_n", 1) or 1),
            "quorum_percent": int(getattr(dept, "policy_quorum_percent", 0) or 0),
            "veto_principals": vetoes,
        },
        "fund": fund_info,
        "positions": positions,
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


def _serialize_authority(auth: DepartmentAuthority) -> dict:
    target_name = None
    try:
        if auth.target:
            target_name = auth.target.name
    except Exception:
        pass
    grantor_name = None
    try:
        if auth.grantor:
            grantor_name = auth.grantor.name
    except Exception:
        pass
    return {
        "id": auth.id,
        "grantor": grantor_name,
        "target": target_name,
        "target_quarter_canister_id": getattr(auth, "target_quarter_canister_id", "") or "",
        "target_org_name": getattr(auth, "target_org_name", "") or "",
        "permissions": auth.permission_list() if hasattr(auth, "permission_list") else [],
        "description": auth.description or "",
    }


# ---------------------------------------------------------------------------
# Department / Organization Management
# ---------------------------------------------------------------------------

def list_departments(args) -> str:
    """List all organizations with members, policy, and budget."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        try:
            from core.org_policy import ensure_root_org

            ensure_root_org()
        except Exception:
            pass

        members_map = _members_by_dept()
        depts = [
            _serialize_org(dept, members=members_map.get(dept.name, []))
            for dept in Department.instances()
        ]
        depts.sort(key=lambda d: (0 if d.get("is_root") else 1, d.get("name") or ""))

        return json.dumps({"success": True, "data": {"departments": depts, "total": len(depts)}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_departments error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def create_department(args) -> str:
    """Create a new organization (no nesting)."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        name = (args_dict.get("name") or "").strip()
        description = args_dict.get("description", "")
        head_principal = args_dict.get("head_principal")
        parent_name = args_dict.get("parent")

        if not name:
            return json.dumps({"success": False, "error": "name is required"})

        if parent_name:
            return json.dumps({
                "success": False,
                "error": "Organization nesting is not allowed (issue #240)",
            })

        if name == ROOT_ORG_NAME or args_dict.get("is_root"):
            existing_root = Department[ROOT_ORG_NAME]
            if existing_root:
                return json.dumps({"success": False, "error": "root organization already exists"})

        existing = Department[name]
        if existing:
            return json.dumps({"success": False, "error": f"Organization '{name}' already exists"})

        is_root = name == ROOT_ORG_NAME
        dept = Department(
            name=name,
            description=description,
            is_root=is_root,
            policy_threshold_m=int(args_dict.get("threshold_m") or 1),
            policy_threshold_n=int(args_dict.get("threshold_n") or 1),
            policy_quorum_percent=int(args_dict.get("quorum_percent") or 0),
        )

        if head_principal:
            head_user = User[head_principal]
            if head_user:
                dept.head = head_user
                try:
                    from core.membership import add_department_member

                    add_department_member(dept, head_user)
                except Exception:
                    pass

        fund_code = (args_dict.get("fund_code") or "").strip()
        if fund_code:
            fund = Fund[fund_code]
            if not fund:
                fund = Fund(
                    code=fund_code[:16],
                    name=args_dict.get("fund_name") or f"{name} Fund",
                    fund_type=args_dict.get("fund_type") or FundType.SPECIAL_REVENUE,
                    description=f"Budget for organization {name}",
                )
            dept.fund = fund

        try:
            from core.org_policy import grant_root_authority_over_local_orgs

            grant_root_authority_over_local_orgs()
        except Exception:
            pass

        logger.info(f"Organization '{name}' created by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"name": name, "message": f"Organization '{name}' created"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"create_department error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def update_department(args) -> str:
    """Update an organization's description, head, policy, or fund."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()

        name = args_dict.get("name")
        if not name:
            return json.dumps({"success": False, "error": "name is required"})

        dept = Department[name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{name}' not found"})

        if not _can_manage_dept(caller, dept):
            return json.dumps({"success": False, "error": "Access denied"})

        if args_dict.get("parent"):
            return json.dumps({
                "success": False,
                "error": "Organization nesting is not allowed (issue #240)",
            })

        if "description" in args_dict:
            dept.description = args_dict["description"]
        if "head_principal" in args_dict:
            head_user = User[args_dict["head_principal"]]
            if head_user:
                dept.head = head_user
        if "threshold_m" in args_dict:
            dept.policy_threshold_m = int(args_dict["threshold_m"] or 1)
        if "threshold_n" in args_dict:
            dept.policy_threshold_n = int(args_dict["threshold_n"] or 1)
        if "quorum_percent" in args_dict:
            dept.policy_quorum_percent = int(args_dict["quorum_percent"] or 0)
        if "veto_principals" in args_dict:
            v = args_dict["veto_principals"]
            if isinstance(v, list):
                dept.policy_veto_principals = ",".join(str(x).strip() for x in v if str(x).strip())
            else:
                dept.policy_veto_principals = str(v or "")
        if "fund_code" in args_dict:
            code = (args_dict.get("fund_code") or "").strip()
            if not code:
                dept.fund = None
            else:
                fund = Fund[code]
                if not fund:
                    fund = Fund(
                        code=code[:16],
                        name=args_dict.get("fund_name") or f"{name} Fund",
                        fund_type=args_dict.get("fund_type") or FundType.SPECIAL_REVENUE,
                        description=f"Budget for organization {name}",
                    )
                dept.fund = fund

        logger.info(f"Organization '{name}' updated by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"name": name, "message": f"Organization '{name}' updated"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"update_department error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def delete_department(args) -> str:
    """Delete an organization (root cannot be deleted)."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        name = args_dict.get("name")
        if not name:
            return json.dumps({"success": False, "error": "name is required"})

        dept = Department[name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{name}' not found"})

        if getattr(dept, "is_root", False) or name == ROOT_ORG_NAME:
            return json.dumps({"success": False, "error": "Cannot delete the root organization"})

        dept.delete()
        logger.info(f"Organization '{name}' deleted by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Organization '{name}' deleted"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"delete_department error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def add_department_member(args) -> str:
    """Add a user to an organization."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()

        dept_name = args_dict.get("department")
        user_principal = args_dict.get("user_principal")
        if not dept_name or not user_principal:
            return json.dumps({"success": False, "error": "department and user_principal are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{dept_name}' not found"})

        if not _can_manage_dept(caller, dept):
            return json.dumps({"success": False, "error": "Access denied"})

        user = User[user_principal]
        if not user:
            return json.dumps({"success": False, "error": f"User '{user_principal}' not found"})

        from core.membership import add_department_member

        add_department_member(dept, user)
        logger.info(f"User {user_principal} added to organization '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"User added to '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"add_department_member error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def remove_department_member(args) -> str:
    """Remove a user from an organization."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()

        dept_name = args_dict.get("department")
        user_principal = args_dict.get("user_principal")
        if not dept_name or not user_principal:
            return json.dumps({"success": False, "error": "department and user_principal are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{dept_name}' not found"})

        if not _can_manage_dept(caller, dept):
            return json.dumps({"success": False, "error": "Access denied"})

        user = User[user_principal]
        if not user:
            return json.dumps({"success": False, "error": f"User '{user_principal}' not found"})

        user.departments.remove(dept)
        logger.info(f"User {user_principal} removed from organization '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"User removed from '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"remove_department_member error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Authority grants (org-over-org)
# ---------------------------------------------------------------------------

def list_authorities(args) -> str:
    """List authority grants, optionally filtered by grantor or target."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        grantor_name = (args_dict.get("grantor") or "").strip()
        target_name = (args_dict.get("target") or "").strip()

        rows = []
        for auth in DepartmentAuthority.instances():
            row = _serialize_authority(auth)
            if grantor_name and row.get("grantor") != grantor_name:
                continue
            if target_name and row.get("target") != target_name and row.get("target_org_name") != target_name:
                continue
            rows.append(row)

        return json.dumps({"success": True, "data": {"authorities": rows, "total": len(rows)}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_authorities error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_authority(args) -> str:
    """Grant org-over-org permissions (local or cross-quarter target)."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        if not (
            _is_allowed(caller, Operations.ALL)
            or _is_allowed(caller, Operations.ORG_GRANT_AUTHORITY)
            or _is_allowed(caller, Operations.ROLE_ASSIGN)
            or _caller_in_root(caller)
        ):
            return json.dumps({"success": False, "error": "Access denied"})

        grantor_name = (args_dict.get("grantor") or ROOT_ORG_NAME).strip()
        grantor = Department[grantor_name]
        if not grantor:
            return json.dumps({"success": False, "error": f"Grantor '{grantor_name}' not found"})

        perms = args_dict.get("permissions") or []
        if isinstance(perms, str):
            perm_str = perms
        else:
            perm_str = ",".join(str(p).strip() for p in perms if str(p).strip())
        if not perm_str:
            return json.dumps({"success": False, "error": "permissions required"})

        target_name = (args_dict.get("target") or "").strip()
        remote_canister = (args_dict.get("target_quarter_canister_id") or "").strip()
        remote_org = (args_dict.get("target_org_name") or "").strip()

        target = None
        if remote_canister:
            if not remote_org:
                return json.dumps({
                    "success": False,
                    "error": "target_org_name required for cross-quarter grants",
                })
        else:
            if not target_name:
                return json.dumps({"success": False, "error": "target required"})
            target = Department[target_name]
            if not target:
                return json.dumps({"success": False, "error": f"Target '{target_name}' not found"})
            if target.name == grantor.name:
                return json.dumps({"success": False, "error": "Cannot grant authority over self"})

        auth_id = args_dict.get("id") or f"auth-{uuid.uuid4().hex[:12]}"
        auth = DepartmentAuthority(
            id=auth_id,
            grantor=grantor,
            target=target,
            target_quarter_canister_id=remote_canister,
            target_org_name=remote_org if remote_canister else "",
            permissions=perm_str,
            description=args_dict.get("description") or "",
        )
        logger.info(f"Authority {auth.id} granted by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": _serialize_authority(auth)})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_authority error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_authority(args) -> str:
    """Revoke an authority grant by id."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        if not (
            _is_allowed(caller, Operations.ALL)
            or _is_allowed(caller, Operations.ORG_REVOKE_AUTHORITY)
            or _is_allowed(caller, Operations.ROLE_ASSIGN)
            or _caller_in_root(caller)
        ):
            return json.dumps({"success": False, "error": "Access denied"})

        auth_id = args_dict.get("id")
        if not auth_id:
            return json.dumps({"success": False, "error": "id is required"})

        auth = DepartmentAuthority[auth_id]
        if not auth:
            return json.dumps({"success": False, "error": f"Authority '{auth_id}' not found"})

        auth.delete()
        return json.dumps({"success": True, "data": {"message": f"Authority '{auth_id}' revoked"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_authority error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def ensure_root(args) -> str:
    """Ensure the root organization exists and has default local authorities."""
    try:
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)
        from core.org_policy import ensure_root_org, grant_root_authority_over_local_orgs

        root = ensure_root_org()
        grant_root_authority_over_local_orgs()
        return json.dumps({"success": True, "data": _serialize_org(root)})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"ensure_root error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Department Permission Management
# ---------------------------------------------------------------------------

def get_department_permissions(args) -> str:
    """Returns all permissions attached to a department."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        dept_name = args_dict.get("department")
        if not dept_name:
            return json.dumps({"success": False, "error": "department is required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        permissions = []
        for p in dept.permissions:
            permissions.append({
                "name": p.name,
                "description": p.description or "",
                "category": p.category or "",
            })

        return json.dumps({
            "success": True,
            "data": {"department": dept_name, "permissions": permissions},
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_department_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_department_permission(args) -> str:
    """Grants a permission to a department."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        dept_name = args_dict.get("department")
        permission_name = args_dict.get("permission_name")
        if not dept_name or not permission_name:
            return json.dumps({"success": False, "error": "department and permission_name are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        perm = Permission[permission_name]
        if not perm:
            perm = Permission(name=permission_name)

        for existing in dept.permissions:
            if existing.name == permission_name:
                return json.dumps({"success": False, "error": f"Permission '{permission_name}' already granted to department '{dept_name}'"})

        dept.permissions.add(perm)
        logger.info(f"Permission '{permission_name}' granted to department '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Permission '{permission_name}' granted to department '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_department_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_department_permission(args) -> str:
    """Revokes a permission from a department."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        dept_name = args_dict.get("department")
        permission_name = args_dict.get("permission_name")
        if not dept_name or not permission_name:
            return json.dumps({"success": False, "error": "department and permission_name are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        target_perm = None
        for p in dept.permissions:
            if p.name == permission_name:
                target_perm = p
                break

        if not target_perm:
            return json.dumps({"success": False, "error": f"Permission '{permission_name}' not found on department '{dept_name}'"})

        dept.permissions.remove(target_perm)
        logger.info(f"Permission '{permission_name}' revoked from department '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Permission '{permission_name}' revoked from department '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_department_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_grant_department_permissions(args) -> str:
    """Grant multiple permissions to a department at once."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        dept_name = args_dict.get("department")
        permission_names = args_dict.get("permission_names", [])
        if not dept_name or not permission_names:
            return json.dumps({"success": False, "error": "department and permission_names are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        has_all = _is_allowed(caller, Operations.ALL)
        existing_names = {p.name for p in dept.permissions}

        granted = 0
        skipped = 0
        for perm_name in permission_names:
            if perm_name in existing_names:
                skipped += 1
                continue
            if not has_all and not _is_allowed(caller, perm_name):
                skipped += 1
                continue
            perm = Permission[perm_name]
            if not perm:
                perm = Permission(name=perm_name)
            dept.permissions.add(perm)
            granted += 1

        logger.info(f"Batch grant to department '{dept_name}': {granted} granted, {skipped} skipped by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"department": dept_name, "granted": granted, "skipped": skipped}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"batch_grant_department_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_revoke_department_permissions(args) -> str:
    """Revoke multiple permissions from a department at once."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        dept_name = args_dict.get("department")
        permission_names = args_dict.get("permission_names", [])
        if not dept_name or not permission_names:
            return json.dumps({"success": False, "error": "department and permission_names are required"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        revoked = 0
        skipped = 0
        for perm_name in permission_names:
            target_perm = None
            for p in dept.permissions:
                if p.name == perm_name:
                    target_perm = p
                    break
            if not target_perm:
                skipped += 1
                continue
            dept.permissions.remove(target_perm)
            revoked += 1

        logger.info(f"Batch revoke from department '{dept_name}': {revoked} revoked, {skipped} skipped by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"department": dept_name, "revoked": revoked, "skipped": skipped}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"batch_revoke_department_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Extension Access Management
# ---------------------------------------------------------------------------

def list_extensions(args) -> str:
    """List all Extension entities with their access grants."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        # One user scan → ext_name → direct-grant users (the reverse ext.users
        # index no longer exists — issue #242).
        users_by_ext: dict = {}
        try:
            from core.membership import iter_users

            for u in iter_users():
                pid = getattr(u, "id", None)
                if not pid:
                    continue
                try:
                    for e in u.extensions:
                        users_by_ext.setdefault(e.name, []).append(
                            {"principal": pid, "nickname": u.nickname or ""}
                        )
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"list_extensions user grants scan: {e}")

        extensions = []
        for ext in Extension.instances():
            departments = []
            try:
                for d in ext.departments:
                    departments.append(d.name)
            except Exception:
                pass

            profiles = []
            try:
                for p in ext.profiles:
                    profiles.append(p.name)
            except Exception:
                pass

            extensions.append({
                "name": ext.name,
                "description": ext.description or "",
                "users": users_by_ext.get(ext.name, []),
                "departments": departments,
                "profiles": profiles,
            })

        return json.dumps({"success": True, "data": {"extensions": extensions, "total": len(extensions)}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_extensions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_extension_to_user(args) -> str:
    """Grant direct extension access to a user."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        user_principal = args_dict.get("user_principal")
        if not ext_name or not user_principal:
            return json.dumps({"success": False, "error": "extension and user_principal are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        user = User[user_principal]
        if not user:
            return json.dumps({"success": False, "error": f"User '{user_principal}' not found"})

        user.extensions.add(ext)
        logger.info(f"Extension '{ext_name}' granted to user {user_principal} by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' granted to user"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_extension_to_user error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_extension_from_user(args) -> str:
    """Revoke direct extension access from a user."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        user_principal = args_dict.get("user_principal")
        if not ext_name or not user_principal:
            return json.dumps({"success": False, "error": "extension and user_principal are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        user = User[user_principal]
        if not user:
            return json.dumps({"success": False, "error": f"User '{user_principal}' not found"})

        user.extensions.remove(ext)
        logger.info(f"Extension '{ext_name}' revoked from user {user_principal} by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' revoked from user"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_extension_from_user error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_extension_to_department(args) -> str:
    """Grant extension access to an entire department."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        dept_name = args_dict.get("department")
        if not ext_name or not dept_name:
            return json.dumps({"success": False, "error": "extension and department are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        ext.departments.add(dept)
        logger.info(f"Extension '{ext_name}' granted to department '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' granted to department '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_extension_to_department error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_extension_from_department(args) -> str:
    """Revoke extension access from a department."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        dept_name = args_dict.get("department")
        if not ext_name or not dept_name:
            return json.dumps({"success": False, "error": "extension and department are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{dept_name}' not found"})

        ext.departments.remove(dept)
        logger.info(f"Extension '{ext_name}' revoked from department '{dept_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' revoked from department '{dept_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_extension_from_department error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_extension_to_profile(args) -> str:
    """Grant extension access at the profile level."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        profile_name = args_dict.get("profile")
        if not ext_name or not profile_name:
            return json.dumps({"success": False, "error": "extension and profile are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        ext.profiles.add(profile)
        logger.info(f"Extension '{ext_name}' granted to profile '{profile_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' granted to profile '{profile_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_extension_to_profile error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_extension_from_profile(args) -> str:
    """Revoke extension access from a profile."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        profile_name = args_dict.get("profile")
        if not ext_name or not profile_name:
            return json.dumps({"success": False, "error": "extension and profile are required"})

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        ext.profiles.remove(profile)
        logger.info(f"Extension '{ext_name}' revoked from profile '{profile_name}' by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' revoked from profile '{profile_name}'"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_extension_from_profile error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Profile/Role Management (carries forward from role_manager)
# ---------------------------------------------------------------------------

def list_users(args) -> str:
    """List all users with their profiles, departments, and extensions."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        users = []
        for user in User.instances():
            profiles = [p.name for p in user.profiles]

            departments = []
            try:
                for d in user.departments:
                    departments.append(d.name)
            except Exception:
                pass

            direct_extensions = []
            try:
                for ext in user.extensions:
                    direct_extensions.append(ext.name)
            except Exception:
                pass

            users.append({
                "principal": user.id,
                "nickname": user.nickname or "",
                "profiles": profiles,
                "departments": departments,
                "direct_extensions": direct_extensions,
            })

        return json.dumps({"success": True, "data": {"users": users, "total": len(users)}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_users error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_user_access_summary(args) -> str:
    """Full access picture for a single user: profiles, departments, extensions with reasons."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        user_principal = args_dict.get("user_principal")
        if not user_principal:
            return json.dumps({"success": False, "error": "user_principal is required"})

        user = User[user_principal]
        if not user:
            return json.dumps({"success": False, "error": f"User '{user_principal}' not found"})

        profiles = [p.name for p in user.profiles]

        departments = []
        try:
            for d in user.departments:
                departments.append({"name": d.name, "is_head": _is_dept_head(user, d)})
        except Exception:
            pass

        # Build extension visibility with reasons
        ext_map = {}

        try:
            for ext in user.extensions:
                ext_map.setdefault(ext.name, []).append("direct")
        except Exception:
            pass

        try:
            for dept in user.departments:
                for ext in dept.extensions:
                    ext_map.setdefault(ext.name, []).append(f"department:{dept.name}")
        except Exception:
            pass

        try:
            for profile in user.profiles:
                for ext in profile.extensions:
                    ext_map.setdefault(ext.name, []).append(f"profile:{profile.name}")
        except Exception:
            pass

        extensions = [{"name": k, "reasons": v} for k, v in sorted(ext_map.items())]

        return json.dumps({
            "success": True,
            "data": {
                "principal": user_principal,
                "nickname": user.nickname or "",
                "profiles": profiles,
                "departments": departments,
                "extensions": extensions,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_user_access_summary error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def assign_profile(args) -> str:
    """Assign a profile to a user. Supports scoped delegation for dept heads."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()

        target_principal = args_dict.get("target_principal")
        profile_name = args_dict.get("profile_name")
        if not target_principal or not profile_name:
            return json.dumps({"success": False, "error": "target_principal and profile_name are required"})

        # Check permission: global ROLE_ASSIGN or scoped dept head delegation
        if not _is_allowed(caller, Operations.ROLE_ASSIGN):
            # Check scoped delegation: is caller head of a dept that has this profile?
            can_delegate = False
            try:
                for dept in caller.headed_departments:
                    for perm in dept.permissions:
                        if perm.name == f"delegate:{profile_name}":
                            can_delegate = True
                            break
                    if can_delegate:
                        break
            except Exception:
                pass
            if not can_delegate:
                raise PermissionError(f"Access denied: cannot assign profile '{profile_name}'")

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        current_profiles = [p.name for p in target_user.profiles]
        if profile_name in current_profiles:
            return json.dumps({"success": False, "error": f"User already has profile '{profile_name}'"})

        target_user.profiles.add(profile)
        logger.info(f"Profile '{profile_name}' assigned to {target_principal} by {caller_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Profile '{profile_name}' assigned",
                "principal": target_principal,
                "profiles": [p.name for p in target_user.profiles],
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"assign_profile error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_profile(args) -> str:
    """Revoke a profile from a user."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()
        _require_operation(caller, Operations.ROLE_REVOKE)

        target_principal = args_dict.get("target_principal")
        profile_name = args_dict.get("profile_name")
        if not target_principal or not profile_name:
            return json.dumps({"success": False, "error": "target_principal and profile_name are required"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        current_profiles = [p.name for p in target_user.profiles]
        if profile_name not in current_profiles:
            return json.dumps({"success": False, "error": f"User does not have profile '{profile_name}'"})

        target_user.profiles.remove(profile)
        logger.info(f"Profile '{profile_name}' revoked from {target_principal} by {caller_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Profile '{profile_name}' revoked",
                "principal": target_principal,
                "profiles": [p.name for p in target_user.profiles],
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_profile error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_available_profiles(args) -> str:
    """List all defined profiles."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        profiles = []
        for profile_def in Profiles.ALL_PROFILES:
            profiles.append({
                "name": profile_def["name"],
                "allowed_to": profile_def["allowed_to"],
            })

        return json.dumps({"success": True, "data": {"profiles": profiles}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_available_profiles error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Extension API registry
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Positions (issue #241) — policy-gated lifecycle management
# ---------------------------------------------------------------------------

def _is_dept_member(user: User, dept: Department) -> bool:
    try:
        from core.membership import user_in_department

        return user_in_department(user, dept)
    except Exception:
        return False


def _submit_position_proposal(action: dict, dept: Department, summary: str) -> dict:
    """Create an org-scoped Proposal that replays *action* on approval.

    ``dept`` is the *governing* org — the org whose members vote and whose
    M/N/quorum/veto policy applies. For root-initiated actions on another
    org this is the root org, not the target (root authority is absolute;
    only root's own policy gates it). Voting is opened immediately.
    """
    from core.position_admin import build_proposal_code
    from ggg import Proposal

    proposer = _get_caller_user()

    proposal_num = len(Proposal.instances()) + 1
    proposal_id = f"prop_{proposal_num:03d}"

    metadata = {
        "proposal_type": "position_action",
        "org_scope": dept.name,
        "position_action": action,
        "code_inline": build_proposal_code(action),
        "codex_name": f"position_action_{proposal_id}",
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

    target_org = (action.get("department") or "").strip() or dept.name
    governed_note = (
        f"Position change in organization '{target_org}'"
        if target_org == dept.name
        else f"Position change in organization '{target_org}', decided by '{dept.name}'"
    )
    proposal = Proposal(
        proposal_id=proposal_id,
        title=summary,
        description=(
            f"{governed_note} "
            f"(policy {dept.policy_threshold_m}/{dept.policy_threshold_n}). "
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
        required_threshold=1.0,  # org policy decides; realm threshold unused
        # First-class indexed field (Proposal v2); kept in metadata too so
        # older voting bundles that only read metadata still scope the vote.
        org_scope=dept.name,
        metadata=json.dumps(metadata),
    )
    logger.info(f"Position proposal {proposal_id} submitted for '{dept.name}': {summary}")
    return {
        "proposal_id": proposal.proposal_id,
        "status": proposal.status,
        "org_scope": dept.name,
    }


def manage_position(args) -> str:
    """Create/update/close/reopen a position, appoint a member, or end an appointment.

    Applies immediately when the *governing* org's policy is 1/1; any other
    policy turns the request into an org-scoped proposal that must pass that
    org's M/N/quorum/veto vote first. The governing org is the root org when
    a root member acts on another org (root authority is absolute — only
    root's own policy gates it); otherwise it is the target org itself.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()

        from core.position_admin import (
            ACTIONS,
            apply_position_action,
            describe_action,
            policy_is_direct,
        )
        from ggg import Position

        action = {
            k: v for k, v in args_dict.items()
            if k in (
                "action", "department", "key", "title", "new_title",
                "description", "profile", "headcount", "salary_amount",
                "salary_period", "principal",
            )
        }
        kind = (action.get("action") or "").strip()
        if kind not in ACTIONS:
            return json.dumps({"success": False, "error": f"action must be one of {', '.join(ACTIONS)}"})

        # Resolve the department that governs this action.
        if kind == "create":
            dept_name = (action.get("department") or "").strip()
        else:
            key = (action.get("key") or "").strip()
            pos = Position[key] if key else None
            if not pos:
                return json.dumps({"success": False, "error": f"Position '{key}' not found"})
            dept = pos.department
            dept_name = getattr(dept, "name", "") if dept is not None else ""
            action["department"] = dept_name
        if not dept_name:
            return json.dumps({"success": False, "error": "department could not be resolved"})

        dept = Department[dept_name]
        if not dept:
            return json.dumps({"success": False, "error": f"Organization '{dept_name}' not found"})

        # Managers may act; plain department members may still *propose*
        # under an M/N policy (their vote is what counts).
        is_manager = _can_manage_dept(caller, dept)
        if not is_manager and not _is_dept_member(caller, dept):
            return json.dumps({"success": False, "error": "Access denied: not a manager or member of this organization"})

        # Root authority is absolute: a root member acting on another org is
        # governed by root's OWN policy, never the target's. While the creator
        # alone holds root (1/1 policy) actions apply directly at any stage;
        # once root passes to e.g. a Congress, root-initiated actions become
        # proposals voted by the root org's members. Actions initiated from
        # within the org (head/members, not via root) keep the org's policy.
        governing = dept
        if not getattr(dept, "is_root", False) and _caller_in_root(caller):
            try:
                from core.org_policy import org_has_authority

                root = Department[ROOT_ORG_NAME]
                if root and org_has_authority(root.name, "org.appoint", target_name=dept.name):
                    governing = root
            except Exception as e:
                logger.warning(f"root authority resolution failed, using target policy: {e}")

        if policy_is_direct(governing):
            if not is_manager:
                return json.dumps({"success": False, "error": "Access denied: managing this organization requires admin/head rights"})
            result = apply_position_action(action)
            if result.get("success"):
                result["data"] = {
                    **(result.get("data") or {}),
                    "applied": "direct",
                    "governed_by": governing.name,
                }
            return json.dumps(result)

        summary = describe_action(action)
        data = _submit_position_proposal(action, governing, summary)
        return json.dumps({
            "success": True,
            "data": {**data, "applied": "proposal", "summary": summary},
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"manage_position error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


EXTENSION_FUNCTIONS = {
    # Organizations (Department entity)
    "list_departments": list_departments,
    "create_department": create_department,
    "update_department": update_department,
    "delete_department": delete_department,
    "add_department_member": add_department_member,
    "remove_department_member": remove_department_member,
    "ensure_root": ensure_root,
    "list_authorities": list_authorities,
    "grant_authority": grant_authority,
    "revoke_authority": revoke_authority,
    # Department permissions
    "get_department_permissions": get_department_permissions,
    "grant_department_permission": grant_department_permission,
    "revoke_department_permission": revoke_department_permission,
    "batch_grant_department_permissions": batch_grant_department_permissions,
    "batch_revoke_department_permissions": batch_revoke_department_permissions,
    # Extensions
    "list_extensions": list_extensions,
    "grant_extension_to_user": grant_extension_to_user,
    "revoke_extension_from_user": revoke_extension_from_user,
    "grant_extension_to_department": grant_extension_to_department,
    "revoke_extension_from_department": revoke_extension_from_department,
    "grant_extension_to_profile": grant_extension_to_profile,
    "revoke_extension_from_profile": revoke_extension_from_profile,
    # Users / profiles
    "list_users": list_users,
    "get_user_access_summary": get_user_access_summary,
    "assign_profile": assign_profile,
    "revoke_profile": revoke_profile,
    "get_available_profiles": get_available_profiles,
    # Positions (issue #241)
    "manage_position": manage_position,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})
    return EXTENSION_FUNCTIONS[method_name](args)
