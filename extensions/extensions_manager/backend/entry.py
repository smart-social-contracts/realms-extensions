"""
Packages Extension Backend Entry Point

Manages extensions, codexes, assistants, and access control.
"""

import json
import traceback
from typing import Any, Dict

from ggg import Department, Extension, Permission, User, UserProfile
from ggg.system.user_profile import Operations, Profiles, OPERATIONS_SEPARATOR
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.extensions_manager")


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
    return False


def _require_operation(user: User, operation: str):
    if not _is_allowed(user, operation):
        raise PermissionError(f"Operation '{operation}' not permitted")


# ---------------------------------------------------------------------------
# Extension access management
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
            users = users_by_ext.get(ext.name, [])

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
                "users": users,
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
# Extension API registry
# ---------------------------------------------------------------------------

EXTENSION_FUNCTIONS = {
    "health": lambda args=None: json.dumps({"success": True, "data": {"status": "ok"}}),
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
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})
    return EXTENSION_FUNCTIONS[method_name](args)
