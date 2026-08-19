"""
Users Extension Backend Entry Point

Provides an admin API for managing people, profiles, permissions, and
invitations, backed by codex-driven governance hooks that allow each realm to
define its own policy (admin-only, vote-required, direct democracy, etc.).
"""

import json
import traceback
from typing import Any, Dict

from ggg import Department, Extension, Permission, Proposal, User, UserProfile
from ggg.system.user_profile import Operations, OPERATIONS_CATALOG, OPERATIONS_SEPARATOR
from ggg.system.registration_code import (
    RegistrationCode,
    consume_registration_code as _consume,
    create_registration_code as _create,
    list_registration_codes as _list_codes,
    revoke_registration_code as _revoke,
    validate_registration_code as _validate,
)
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.role_manager")

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 25

# Crypto group whose members may decrypt member private data shared with admins.
# Kept in sync with the "admin" profile so members can consent to share their
# encrypted data with the current admin set (see issue #215).
MEMBER_DATA_READERS_GROUP = "member_data_readers"
ADMIN_PROFILE_NAME = "admin"


def _sync_admin_in_reader_group(principal: str, is_admin: bool) -> None:
    """Mirror an admin profile change into the member_data_readers crypto group.

    Best-effort: failures are logged but never block profile management.
    """
    try:
        from api.crypto import (
            group_add_member,
            group_create,
            group_list,
            group_remove_member,
        )

        if is_admin:
            existing = {g["name"] for g in group_list().get("groups", [])}
            if MEMBER_DATA_READERS_GROUP not in existing:
                group_create(
                    MEMBER_DATA_READERS_GROUP,
                    "Admins authorized to read member private data shared by consent",
                )
            group_add_member(MEMBER_DATA_READERS_GROUP, principal, "member")
            logger.info(f"Added {principal} to {MEMBER_DATA_READERS_GROUP}")
        else:
            group_remove_member(MEMBER_DATA_READERS_GROUP, principal)
            logger.info(f"Removed {principal} from {MEMBER_DATA_READERS_GROUP}")
    except Exception as e:
        logger.warning(
            f"Could not sync {principal} ({'add' if is_admin else 'remove'}) "
            f"in {MEMBER_DATA_READERS_GROUP}: {e}"
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_args(args):
    """Parse JSON string args to dict."""
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _get_caller_principal() -> str:
    return ic.caller().to_str()


def _in_governed_replay() -> bool:
    """True while an approved governance proposal replays this call with
    realm authority (issue #262); RBAC checks must not re-apply."""
    try:
        from core.governed_action import in_replay

        return in_replay()
    except Exception:
        return False


class _ReplayAuthority:
    """Caller stand-in when an approved proposal replays an action and the
    executing principal (e.g. a timer) is not a registered user."""

    id = "governance-replay"
    profiles = ()
    permissions = ()


_REPLAY_AUTHORITY = _ReplayAuthority()


def _get_caller_user() -> User:
    principal = _get_caller_principal()
    user = User[principal]
    if not user:
        if _in_governed_replay():
            return _REPLAY_AUTHORITY
        raise PermissionError(f"User {principal} not found")
    return user


def _is_allowed(user: User, operation: str) -> bool:
    """Check if a user holds a specific operation permission."""
    if _in_governed_replay():
        return True
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
    try:
        for profile in user.profiles:
            for perm in profile.permissions:
                if perm.name == operation:
                    return True
    except Exception:
        pass
    return False


def _require_operation(user: User, operation: str):
    """Raise if user doesn't hold the operation."""
    if not _is_allowed(user, operation):
        raise PermissionError(
            f"Access denied: user {user.id} lacks permission '{operation}'"
        )


def _get_user_effective_operations(user: User) -> list:
    """Return the union of all operations a user holds (profiles + direct permissions)."""
    ops = set()
    for profile in user.profiles:
        allowed = str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR)
        for op in allowed:
            if op:
                ops.add(op)
    try:
        for perm in user.permissions:
            if perm.name:
                ops.add(perm.name)
    except Exception:
        pass
    try:
        for profile in user.profiles:
            for perm in profile.permissions:
                if perm.name:
                    ops.add(perm.name)
    except Exception:
        pass
    try:
        for department in user.departments:
            for perm in department.permissions:
                if perm.name:
                    ops.add(perm.name)
    except Exception:
        pass
    return sorted(ops)


# ---------------------------------------------------------------------------
# Extension API functions
# ---------------------------------------------------------------------------

def _user_summary(user: User, *, include_profiles: bool = False) -> Dict[str, Any]:
    """Lightweight user row for list views."""
    profiles: list = []
    if include_profiles:
        try:
            profiles = [p.name for p in user.profiles]
        except Exception:
            pass
    return {
        "principal": user.id,
        "nickname": user.nickname or "",
        "profiles": profiles,
        "status": "active",
    }


def list_users_with_profiles(args) -> str:
    """List users with profile names, paginated via ``User.load_some``.

    Large realms (demo data, justice cases, etc.) can exceed the IC
    per-message instruction limit when loading every user at once.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        from_id = max(1, int(args_dict.get("from_id", 1)))
        page_size = min(
            max(1, int(args_dict.get("page_size", DEFAULT_PAGE_SIZE))),
            MAX_PAGE_SIZE,
        )
        include_profiles = bool(args_dict.get("include_profiles", False))

        max_id = User.max_id()
        batch = User.load_some(from_id=from_id, count=page_size)
        result = [
            _user_summary(user, include_profiles=include_profiles)
            for user in batch
            if user
        ]

        next_from_id = None
        if batch:
            last_id = int(getattr(batch[-1], "_id", 0) or 0)
            if last_id and last_id < max_id:
                next_from_id = last_id + 1

        return json.dumps({
            "success": True,
            "data": {
                "users": result,
                "total": len(result),
                "from_id": from_id,
                "next_from_id": next_from_id,
                "has_more": next_from_id is not None,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_users_with_profiles error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_available_profiles(args) -> str:
    """Enumerate all defined profiles with their operations."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        profiles = []
        for profile in sorted(UserProfile.instances(), key=lambda p: p.name):
            profiles.append({
                "name": profile.name,
                "allowed_to": [
                    op for op in str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR) if op
                ],
            })

        return json.dumps({"success": True, "data": {"profiles": profiles}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_available_profiles error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_user_effective_permissions(args) -> str:
    """Get the union of all profile operations + Permission entities for a user."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        target_principal = args_dict.get("target_principal")
        if not target_principal:
            return json.dumps({"success": False, "error": "target_principal is required"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        profiles = [p.name for p in target_user.profiles]
        operations = _get_user_effective_operations(target_user)

        direct_permissions = []
        try:
            for perm in target_user.permissions:
                direct_permissions.append(perm.name)
        except Exception:
            pass

        return json.dumps({
            "success": True,
            "data": {
                "principal": target_principal,
                "nickname": target_user.nickname or "",
                "profiles": profiles,
                "effective_operations": operations,
                "direct_permissions": direct_permissions,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_user_effective_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def assign_profile(args) -> str:
    """Assign a profile to a user.

    Checks Operations.ROLE_ASSIGN, calls prehook (codex policy), assigns, calls posthook.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()
        _require_operation(caller, Operations.ROLE_ASSIGN)

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

        # Check if already assigned
        current_profiles = [p.name for p in target_user.profiles]
        if profile_name in current_profiles:
            return json.dumps({"success": False, "error": f"User already has profile '{profile_name}'"})

        # Prehook: codex governance policy can reject
        try:
            User.role_assign_prehook(target_user, profile_name, caller_principal)
        except PermissionError as e:
            return json.dumps({"success": False, "error": str(e), "governance_blocked": True})

        # Perform the assignment
        target_user.profiles.add(profile)
        logger.info(f"Profile '{profile_name}' assigned to {target_principal} by {caller_principal}")

        # Posthook: notifications, logging
        User.role_assign_posthook(target_user, profile_name, caller_principal)

        if profile_name == ADMIN_PROFILE_NAME:
            _sync_admin_in_reader_group(target_principal, is_admin=True)

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Profile '{profile_name}' assigned to user",
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
    """Revoke a profile from a user.

    Checks Operations.ROLE_REVOKE, calls prehook (codex policy), revokes, calls posthook.
    """
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

        # Check if actually assigned
        current_profiles = [p.name for p in target_user.profiles]
        if profile_name not in current_profiles:
            return json.dumps({"success": False, "error": f"User does not have profile '{profile_name}'"})

        # Prehook: codex governance policy can reject
        try:
            User.role_revoke_prehook(target_user, profile_name, caller_principal)
        except PermissionError as e:
            return json.dumps({"success": False, "error": str(e), "governance_blocked": True})

        # Perform the revocation
        target_user.profiles.remove(profile)
        logger.info(f"Profile '{profile_name}' revoked from {target_principal} by {caller_principal}")

        # Posthook: notifications, logging
        User.role_revoke_posthook(target_user, profile_name, caller_principal)

        if profile_name == ADMIN_PROFILE_NAME:
            _sync_admin_in_reader_group(target_principal, is_admin=False)

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Profile '{profile_name}' revoked from user",
                "principal": target_principal,
                "profiles": [p.name for p in target_user.profiles],
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_profile error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_permission(args) -> str:
    """Attach a fine-grained Permission entity to a user.

    Enforces that the caller holds the permission they are granting.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        target_principal = args_dict.get("target_principal")
        permission_name = args_dict.get("permission_name")
        if not target_principal or not permission_name:
            return json.dumps({"success": False, "error": "target_principal and permission_name are required"})

        if not _is_allowed(caller, Operations.ALL) and not _is_allowed(caller, permission_name):
            return json.dumps({"success": False, "error": f"Cannot grant '{permission_name}' — you don't hold this permission"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        # Check if already granted
        try:
            for perm in target_user.permissions:
                if perm.name == permission_name:
                    return json.dumps({"success": False, "error": f"User already has permission '{permission_name}'"})
        except Exception:
            pass

        # Create and attach the permission
        perm = Permission(name=permission_name)
        target_user.permissions.add(perm)
        logger.info(f"Permission '{permission_name}' granted to {target_principal} by {_get_caller_principal()}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Permission '{permission_name}' granted to user",
                "principal": target_principal,
                "permission": permission_name,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_permission(args) -> str:
    """Remove a fine-grained Permission entity from a user."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        target_principal = args_dict.get("target_principal")
        permission_name = args_dict.get("permission_name")
        if not target_principal or not permission_name:
            return json.dumps({"success": False, "error": "target_principal and permission_name are required"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        # Find and remove the permission
        found = None
        try:
            for perm in target_user.permissions:
                if perm.name == permission_name:
                    found = perm
                    break
        except Exception:
            pass

        if not found:
            return json.dumps({"success": False, "error": f"User does not have permission '{permission_name}'"})

        target_user.permissions.remove(found)
        found.delete()
        logger.info(f"Permission '{permission_name}' revoked from {target_principal} by {_get_caller_principal()}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Permission '{permission_name}' revoked from user",
                "principal": target_principal,
                "permission": permission_name,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def _build_role_action_code(action: str, target_principal: str, profile_name: str) -> str:
    """Build the inline proposal code that replays a role action on approval."""
    if action == "assign":
        mutate = (
            f'if "{profile_name}" in current:\n'
            f'    logger.info("Profile already assigned, skipping")\n'
            f'else:\n'
            f'    target.profiles.add(profile)\n'
            f'    logger.info(f"Governance: assigned \'{profile_name}\' to {{target.id}}")\n'
        )
    else:
        mutate = (
            f'if "{profile_name}" not in current:\n'
            f'    logger.info("Profile not assigned, skipping")\n'
            f'else:\n'
            f'    target.profiles.remove(profile)\n'
            f'    logger.info(f"Governance: revoked \'{profile_name}\' from {{target.id}}")\n'
        )
    return (
        f'from ggg import User, UserProfile\n'
        f'\n'
        f'target = User["{target_principal}"]\n'
        f'profile = UserProfile["{profile_name}"]\n'
        f'if not target:\n'
        f'    raise ValueError("User {target_principal} not found")\n'
        f'if not profile:\n'
        f'    raise ValueError("Profile {profile_name} not found")\n'
        f'current = [p.name for p in target.profiles]\n'
        f'{mutate}'
    )


_ROLE_ACTIONS = {
    "assign": {
        "proposal_type": "role_assignment",
        "operation": Operations.ROLE_ASSIGN,
        "title": "Assign '{profile}' to {target}",
        "description": "Governance proposal to assign the '{profile}' profile to user {principal}.",
    },
    "revoke": {
        "proposal_type": "role_revocation",
        "operation": Operations.ROLE_REVOKE,
        "title": "Revoke '{profile}' from {target}",
        "description": "Governance proposal to revoke the '{profile}' profile from user {principal}.",
    },
}


def propose_role_action(args) -> str:
    """Create a typed governance proposal for a role change (assign or revoke).

    Used in realms where the prehook rejects direct changes and requires a vote.
    The proposal carries structured metadata (proposal_type, requested_permissions)
    and inline code that replays the action when the proposal is executed.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()

        action = (args_dict.get("action") or "assign").strip()
        spec = _ROLE_ACTIONS.get(action)
        if not spec:
            return json.dumps({"success": False, "error": f"action must be one of {', '.join(_ROLE_ACTIONS)}"})

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

        proposal_num = len(Proposal.instances()) + 1
        proposal_id = f"prop_{proposal_num:03d}"

        target_nickname = target_user.nickname or target_principal[:8]

        metadata = json.dumps({
            "proposal_type": spec["proposal_type"],
            "role_action": action,
            "requested_permissions": [spec["operation"]],
            "target_principal": target_principal,
            "profile_name": profile_name,
            "code_inline": _build_role_action_code(action, target_principal, profile_name),
            "codex_name": f"role_{action}_{proposal_id}",
        })

        proposal = Proposal(
            proposal_id=proposal_id,
            title=spec["title"].format(profile=profile_name, target=target_nickname),
            description=spec["description"].format(profile=profile_name, principal=target_principal),
            code_url="",
            code_checksum="",
            proposer=caller,
            status="pending_review",
            voting_deadline="",
            votes_yes=0.0,
            votes_no=0.0,
            votes_abstain=0.0,
            total_voters=0.0,
            required_threshold=0.6,
            metadata=metadata,
        )

        logger.info(f"Role {action} proposal {proposal_id} created by {caller_principal}: "
                    f"{action} '{profile_name}' for {target_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "proposal_id": proposal.proposal_id,
                "message": f"Governance proposal created to {action} '{profile_name}'",
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"propose_role_action error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def propose_role_assignment(args) -> str:
    """Back-compat wrapper around propose_role_action(action="assign")."""
    args_dict = _parse_args(args)
    args_dict["action"] = "assign"
    return propose_role_action(args_dict)


def get_all_operations(args) -> str:
    """Return the full catalog of operations with descriptions and categories,
    plus the caller's own effective operations for UI permission gating."""
    try:
        _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        caller_ops = _get_user_effective_operations(caller)
        caller_has_all = Operations.ALL in caller_ops

        operations = []
        for op_name, meta in OPERATIONS_CATALOG.items():
            operations.append({
                "name": op_name,
                "category": meta["category"],
                "description": meta["description"],
                "caller_can_grant": caller_has_all or op_name in caller_ops,
            })

        return json.dumps({
            "success": True,
            "data": {
                "operations": operations,
                "caller_operations": caller_ops,
                "caller_can_assign_roles": caller_has_all or Operations.ROLE_ASSIGN in caller_ops,
                "caller_can_revoke_roles": caller_has_all or Operations.ROLE_REVOKE in caller_ops,
                "caller_can_grant_permissions": caller_has_all or Operations.PERMISSION_GRANT in caller_ops,
                "caller_can_revoke_permissions": caller_has_all or Operations.PERMISSION_REVOKE in caller_ops,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"get_all_operations error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_grant_permissions(args) -> str:
    """Grant multiple permissions to a user at once.

    Enforces that the caller can only grant permissions they themselves hold
    (or all permissions if they have the 'all' operation).
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        target_principal = args_dict.get("target_principal")
        permission_names = args_dict.get("permission_names", [])
        if not target_principal or not permission_names:
            return json.dumps({"success": False, "error": "target_principal and permission_names are required"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        caller_ops = set(_get_user_effective_operations(caller))
        caller_has_all = Operations.ALL in caller_ops
        if not caller_has_all:
            forbidden = [p for p in permission_names if p not in caller_ops]
            if forbidden:
                return json.dumps({
                    "success": False,
                    "error": f"Cannot grant permissions you don't hold: {', '.join(forbidden)}",
                })

        existing = set()
        try:
            for perm in target_user.permissions:
                if perm.name:
                    existing.add(perm.name)
        except Exception:
            pass

        granted = []
        skipped = []
        for pname in permission_names:
            if pname in existing:
                skipped.append(pname)
                continue
            perm = Permission(name=pname)
            target_user.permissions.add(perm)
            granted.append(pname)
            existing.add(pname)

        caller_principal = _get_caller_principal()
        if granted:
            logger.info(f"Permissions {granted} granted to {target_principal} by {caller_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "granted": granted,
                "skipped": skipped,
                "message": f"{len(granted)} permission(s) granted, {len(skipped)} already existed",
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"batch_grant_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_revoke_permissions(args) -> str:
    """Revoke multiple permissions from a user at once."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        target_principal = args_dict.get("target_principal")
        permission_names = args_dict.get("permission_names", [])
        if not target_principal or not permission_names:
            return json.dumps({"success": False, "error": "target_principal and permission_names are required"})

        target_user = User[target_principal]
        if not target_user:
            return json.dumps({"success": False, "error": f"User {target_principal} not found"})

        perm_map = {}
        try:
            for perm in target_user.permissions:
                if perm.name:
                    perm_map[perm.name] = perm
        except Exception:
            pass

        revoked = []
        not_found = []
        for pname in permission_names:
            if pname in perm_map:
                target_user.permissions.remove(perm_map[pname])
                perm_map[pname].delete()
                revoked.append(pname)
            else:
                not_found.append(pname)

        caller_principal = _get_caller_principal()
        if revoked:
            logger.info(f"Permissions {revoked} revoked from {target_principal} by {caller_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "revoked": revoked,
                "not_found": not_found,
                "message": f"{len(revoked)} permission(s) revoked",
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"batch_revoke_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Profile-level permission management
# ---------------------------------------------------------------------------

def list_profiles_with_permissions(args) -> str:
    """List all profiles with their allowed_to ops and attached Permission entities."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_VIEW)

        result = []
        for profile in UserProfile.instances():
            extra_permissions = []
            try:
                for perm in profile.permissions:
                    extra_permissions.append(perm.name)
            except Exception:
                pass

            # O(1) reverse counter — the User→profiles relation is
            # unidirectional (issue #242), there is no profile.users list.
            user_count = 0
            try:
                user_count = int(profile.reverse_count("users"))
            except Exception:
                pass

            result.append({
                "name": profile.name,
                "description": profile.description or "",
                "allowed_to": [op for op in str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR) if op],
                "extra_permissions": extra_permissions,
                "user_count": user_count,
            })

        return json.dumps({
            "success": True,
            "data": {"profiles": result, "total": len(result)},
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"list_profiles_with_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def _profile_allowed_ops(profile: UserProfile) -> set:
    return {op for op in str(profile.allowed_to or "").split(OPERATIONS_SEPARATOR) if op}


def _profile_effective_ops(profile: UserProfile) -> set:
    """Both stores grant capability: ``allowed_to`` plus attached Permission
    entities. The realm's ``_check_access`` honours either, so a lockout check
    that reads only ``allowed_to`` would miss an ``all`` held as a Permission.
    """
    ops = _profile_allowed_ops(profile)
    try:
        for perm in profile.permissions:
            if perm.name:
                ops.add(perm.name)
    except Exception:
        pass
    return ops


def _realm_would_have_admin_after(profile: UserProfile, new_effective: set) -> bool:
    for other in UserProfile.instances():
        effective = (
            new_effective
            if other.name == profile.name
            else _profile_effective_ops(other)
        )
        if Operations.ALL in effective:
            return True
    return False


def update_profile_operations(args) -> str:
    """Grant or revoke profile operations across allowed_to and Permission entities.

    Grant half requires permission.grant; revoke half additionally checks
    permission.revoke in code.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()

        profile_name = args_dict.get("profile_name")
        grant = args_dict.get("grant") or []
        revoke = args_dict.get("revoke") or []
        if not profile_name:
            return json.dumps({
                "success": False,
                "error": "profile_name is required",
                "error_code": "missing_args",
            })

        # An op named in both lists resolves to the revoke: dropping a
        # capability is the safe direction to land on.
        grant = [op for op in grant if op not in set(revoke)]

        if grant:
            _require_operation(caller, Operations.PERMISSION_GRANT)
        if revoke:
            _require_operation(caller, Operations.PERMISSION_REVOKE)

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({
                "success": False,
                "error": f"Profile '{profile_name}' not found",
                "error_code": "profile_not_found",
            })

        for op in grant + revoke:
            if op not in OPERATIONS_CATALOG:
                return json.dumps({
                    "success": False,
                    "error": f"Unknown operation '{op}'",
                    "error_code": "unknown_operation",
                })

        if grant:
            caller_ops = set(_get_user_effective_operations(caller))
            caller_has_all = Operations.ALL in caller_ops
            if not caller_has_all:
                forbidden = [op for op in grant if op not in caller_ops]
                if forbidden:
                    return json.dumps({
                        "success": False,
                        "error": f"Cannot grant operations you don't hold: {', '.join(forbidden)}",
                        "error_code": "cannot_grant_unheld",
                    })

        current_allowed = _profile_allowed_ops(profile)
        simulated_effective = _profile_effective_ops(profile)
        simulated_effective.update(grant)
        for op in revoke:
            simulated_effective.discard(op)

        if not _realm_would_have_admin_after(profile, simulated_effective):
            return json.dumps({
                "success": False,
                "error": "This change would leave no profile with full administrative access",
                "error_code": "would_orphan_admin",
            })

        granted = []
        revoked = []
        skipped = []

        for op in grant:
            if op in current_allowed:
                skipped.append(op)
                continue
            profile.add(op)
            current_allowed.add(op)
            granted.append(op)

        perm_map = {}
        try:
            for perm in profile.permissions:
                if perm.name:
                    perm_map[perm.name] = perm
        except Exception:
            pass

        for op in revoke:
            had_allowed = op in current_allowed
            had_permission = op in perm_map
            if not had_allowed and not had_permission:
                skipped.append(op)
                continue
            if had_allowed:
                profile.remove(op)
                current_allowed.discard(op)
            if had_permission:
                profile.permissions.remove(perm_map[op])
                perm_map[op].delete()
            revoked.append(op)

        if granted or revoked:
            logger.info(
                f"Profile '{profile_name}' operations updated by {caller_principal}: "
                f"granted={granted}, revoked={revoked}"
            )

        return json.dumps({
            "success": True,
            "data": {
                "profile_name": profile_name,
                "granted": granted,
                "revoked": revoked,
                "skipped": skipped,
            },
        })
    except PermissionError as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "error_code": "not_permitted",
        })
    except Exception as e:
        logger.error(f"update_profile_operations error: {e}\n{traceback.format_exc()}")
        return json.dumps({
            "success": False,
            "error": str(e),
            "error_code": "internal_error",
        })


# ---------------------------------------------------------------------------
# Invitation / Registration Code management (merged from census)
# ---------------------------------------------------------------------------

def get_user_count(args=None) -> str:
    from ic_python_db import Database
    db = Database.get_instance()
    try:
        user_cls = db._entity_types.get("User")
        if not user_cls:
            return json.dumps({"success": True, "data": {"user_count": 0}})
        count = len(user_cls.instances())
        return json.dumps({"success": True, "data": {"user_count": count}})
    except Exception as e:
        logger.error(f"Error counting users: {e}")
        return json.dumps({"success": False, "error": str(e)})


def generate_registration_url(args) -> str:
    try:
        args_dict = _parse_args(args)
        user_id = args_dict.get("user_id", "admin")
        profile_arg = args_dict.get("profile")
        profile_name = profile_arg if profile_arg else "member"
        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})
        from datetime import datetime
        reg_code = _create(
            code_hash=args_dict.get("code_hash", ""),
            profile=profile_name,
            max_uses=args_dict.get("max_uses", 1),
            expires_in_hours=args_dict.get("expires_in_hours", 24),
            created_by=args_dict.get("created_by", "admin"),
            user_id=user_id,
            frontend_url=args_dict.get("frontend_url", "https://localhost:3000"),
            email=args_dict.get("email", ""),
        )
        code_hash = args_dict.get("code_hash")
        if code_hash:
            return json.dumps({
                "success": True,
                "data": {
                    "code_hash": code_hash[:8],
                    "expires_at": datetime.fromtimestamp(reg_code.expires_at).isoformat(),
                    "profile": profile_name,
                },
            })
        return json.dumps({
            "success": True,
            "data": {
                "code": reg_code.code,
                "code_hash": reg_code.code_hash,
                "registration_url": reg_code.registration_url,
                "expires_at": datetime.fromtimestamp(reg_code.expires_at).isoformat(),
                "user_id": reg_code.user_id,
                "profile": profile_name,
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def validate_registration_code(args) -> str:
    try:
        args_dict = _parse_args(args)
        code_hash = args_dict.get("code_hash", "")
        if not code_hash:
            import hashlib
            plaintext = args_dict.get("code", "")
            if not plaintext:
                return json.dumps({"success": False, "error": "code or code_hash is required"})
            code_hash = hashlib.sha256(plaintext.encode()).hexdigest()
        return json.dumps(_validate(code_hash))
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def consume_registration_code(args) -> str:
    try:
        args_dict = _parse_args(args)
        code_hash = args_dict.get("code_hash", "")
        if not code_hash:
            import hashlib
            plaintext = args_dict.get("code", "")
            if not plaintext:
                return json.dumps({"success": False, "error": "code or code_hash is required"})
            code_hash = hashlib.sha256(plaintext.encode()).hexdigest()
        # The redeemer is whoever is calling. Taking it from args lets a
        # caller burn their code against someone else's principal.
        return json.dumps(_consume(code_hash, ic.caller().to_str()))
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def revoke_registration_code(args) -> str:
    try:
        args_dict = _parse_args(args)
        return json.dumps(_revoke(code=args_dict.get("code"), code_hash=args_dict.get("code_hash")))
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def get_registration_codes(args) -> str:
    try:
        args_dict = _parse_args(args)
        user_id = args_dict.get("user_id")
        include_used = args_dict.get("include_used", False)
        if user_id:
            from datetime import datetime
            codes = RegistrationCode.find_by_user_id(user_id)
            if not include_used:
                codes = [c for c in codes if c.used == 0]
            return json.dumps({
                "success": True,
                "data": [
                    {
                        "code_hash": c.code_hash[:8],
                        "user_id": c.user_id,
                        "email": c.email,
                        "profile": c.profile,
                        "expires_at": datetime.fromtimestamp(c.expires_at).isoformat(),
                        "uses_count": c.uses_count,
                        "max_uses": c.max_uses,
                        "revoked": c.revoked == 1,
                        "is_valid": c.is_valid(),
                        "created_by": c.created_by,
                    }
                    for c in codes
                ],
            })
        return json.dumps({"success": True, "data": _list_codes(include_used=include_used)})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Extension access management (merged from the deprecated extensions_manager)
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


def _extension_access_change(args, target_kind: str, grant: bool) -> str:
    """Shared grant/revoke of extension access for a user/department/profile."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.ROLE_ASSIGN)

        ext_name = args_dict.get("extension")
        target_keys = {
            "user": "user_principal",
            "department": "department",
            "profile": "profile",
        }
        target = args_dict.get(target_keys[target_kind])
        if not ext_name or not target:
            return json.dumps({
                "success": False,
                "error": f"extension and {target_keys[target_kind]} are required",
            })

        ext = Extension[ext_name]
        if not ext:
            return json.dumps({"success": False, "error": f"Extension '{ext_name}' not found"})

        if target_kind == "user":
            entity = User[target]
            relation, label = (entity.extensions if entity else None), "user"
        elif target_kind == "department":
            entity = Department[target]
            relation, label = (ext.departments if entity else None), f"department '{target}'"
        else:
            entity = UserProfile[target]
            relation, label = (ext.profiles if entity else None), f"profile '{target}'"

        if not entity:
            return json.dumps({"success": False, "error": f"{target_kind.capitalize()} '{target}' not found"})

        if grant:
            relation.add(ext if target_kind == "user" else entity)
        else:
            relation.remove(ext if target_kind == "user" else entity)

        action = "granted to" if grant else "revoked from"
        logger.info(f"Extension '{ext_name}' {action} {label} by {_get_caller_principal()}")
        return json.dumps({"success": True, "data": {"message": f"Extension '{ext_name}' {action} {label}"}})
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"extension access change error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def grant_extension_to_user(args) -> str:
    return _extension_access_change(args, "user", grant=True)


def revoke_extension_from_user(args) -> str:
    return _extension_access_change(args, "user", grant=False)


def grant_extension_to_department(args) -> str:
    return _extension_access_change(args, "department", grant=True)


def revoke_extension_from_department(args) -> str:
    return _extension_access_change(args, "department", grant=False)


def grant_extension_to_profile(args) -> str:
    return _extension_access_change(args, "profile", grant=True)


def revoke_extension_from_profile(args) -> str:
    return _extension_access_change(args, "profile", grant=False)


# ---------------------------------------------------------------------------
# Extension API registry
# ---------------------------------------------------------------------------

EXTENSION_FUNCTIONS = {
    "list_users_with_profiles": list_users_with_profiles,
    "get_available_profiles": get_available_profiles,
    "get_user_effective_permissions": get_user_effective_permissions,
    "assign_profile": assign_profile,
    "revoke_profile": revoke_profile,
    "grant_permission": grant_permission,
    "revoke_permission": revoke_permission,
    "propose_role_assignment": propose_role_assignment,
    "propose_role_action": propose_role_action,
    "get_all_operations": get_all_operations,  # also returns caller capabilities
    "batch_grant_permissions": batch_grant_permissions,
    "batch_revoke_permissions": batch_revoke_permissions,
    # Profile permissions
    "list_profiles_with_permissions": list_profiles_with_permissions,
    "update_profile_operations": update_profile_operations,
    # Invitations (merged from census)
    "get_user_count": get_user_count,
    "generate_registration_url": generate_registration_url,
    "validate_registration_code": validate_registration_code,
    "consume_registration_code": consume_registration_code,
    "revoke_registration_code": revoke_registration_code,
    "get_registration_codes": get_registration_codes,
    # Extension access (merged from extensions_manager)
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
