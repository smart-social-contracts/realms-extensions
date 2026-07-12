"""
Users Extension Backend Entry Point

Provides an admin API for managing people, profiles, permissions, and
invitations, backed by codex-driven governance hooks that allow each realm to
define its own policy (admin-only, vote-required, direct democracy, etc.).
"""

import json
import traceback
from typing import Any, Dict

from ggg import Permission, Proposal, User, UserProfile
from ggg.system.user_profile import Operations, Profiles, OPERATIONS_SEPARATOR
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


def _get_caller_user() -> User:
    principal = _get_caller_principal()
    user = User[principal]
    if not user:
        raise PermissionError(f"User {principal} not found")
    return user


def _is_allowed(user: User, operation: str) -> bool:
    """Check if a user holds a specific operation permission."""
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


def propose_role_assignment(args) -> str:
    """Create a typed governance proposal for role assignment.

    Used in realms where the prehook rejects direct assignment and requires a vote.
    The proposal carries structured metadata with proposal_type and requested_permissions.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        caller_principal = _get_caller_principal()

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

        # Generate proposal ID
        existing = Proposal.instances()
        proposal_num = len(existing) + 1
        proposal_id = f"prop_{proposal_num:03d}"

        target_nickname = target_user.nickname or target_principal[:8]

        code_inline = (
            f'from ggg import User, UserProfile\n'
            f'\n'
            f'target = User["{target_principal}"]\n'
            f'profile = UserProfile["{profile_name}"]\n'
            f'if not target:\n'
            f'    raise ValueError("User {target_principal} not found")\n'
            f'if not profile:\n'
            f'    raise ValueError("Profile {profile_name} not found")\n'
            f'current = [p.name for p in target.profiles]\n'
            f'if "{profile_name}" in current:\n'
            f'    logger.info("Profile already assigned, skipping")\n'
            f'else:\n'
            f'    target.profiles.add(profile)\n'
            f'    logger.info(f"Governance: assigned \'{profile_name}\' to {{target.id}}")\n'
        )

        metadata = json.dumps({
            "proposal_type": "role_assignment",
            "requested_permissions": [Operations.ROLE_ASSIGN],
            "target_principal": target_principal,
            "profile_name": profile_name,
            "code_inline": code_inline,
            "codex_name": f"role_assign_{proposal_id}",
        })

        proposal = Proposal(
            proposal_id=proposal_id,
            title=f"Assign '{profile_name}' to {target_nickname}",
            description=f"Governance proposal to assign the '{profile_name}' profile to user {target_principal}.",
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

        logger.info(f"Role assignment proposal {proposal_id} created by {caller_principal}: "
                    f"assign '{profile_name}' to {target_principal}")

        return json.dumps({
            "success": True,
            "data": {
                "proposal_id": proposal_id,
                "message": f"Governance proposal created to assign '{profile_name}' to user",
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"propose_role_assignment error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


OPERATIONS_CATALOG = {
    "all": {"category": "Super", "description": "Grants every operation in the system"},

    "user.add": {"category": "User Management", "description": "Register new users in the realm"},
    "user.edit": {"category": "User Management", "description": "Edit user profile information"},
    "user.delete": {"category": "User Management", "description": "Remove a user from the realm"},
    "user.update_status": {"category": "User Management", "description": "Change a user's active/suspended status"},

    "organization.add": {"category": "Organizations", "description": "Create a new organization"},
    "organization.edit": {"category": "Organizations", "description": "Edit organization details"},
    "organization.delete": {"category": "Organizations", "description": "Delete an organization"},

    "transfer.create": {"category": "Finance", "description": "Create token transfers between accounts"},
    "transfer.delete": {"category": "Finance", "description": "Revert or cancel a pending transfer"},
    "invoice.refresh": {"category": "Finance", "description": "Recalculate and refresh invoice balances"},
    "nft.mint": {"category": "Finance", "description": "Mint new NFT tokens (e.g. land parcels)"},
    "license.issue": {"category": "Finance", "description": "Issue a license to a user or organization"},
    "license.revoke": {"category": "Finance", "description": "Revoke an issued license"},

    "task.create": {"category": "Tasks", "description": "Create background tasks"},
    "task.edit": {"category": "Tasks", "description": "Edit task parameters"},
    "task.delete": {"category": "Tasks", "description": "Delete a task"},
    "task.run": {"category": "Tasks", "description": "Manually trigger a task to run"},
    "task.schedule": {"category": "Tasks", "description": "Schedule a task for periodic execution"},
    "task.cancel": {"category": "Tasks", "description": "Cancel a running or scheduled task"},

    "realm.admin": {"category": "Realm Administration", "description": "Full realm administrative access"},
    "realm.upgrade": {"category": "Realm Administration", "description": "Upgrade the realm canister to a new version"},
    "realm.configure": {"category": "Realm Administration", "description": "Change realm configuration settings"},
    "realm.configure.codex": {"category": "Realm Administration", "description": "Configure the governance codex"},
    "realm.configure.infrastructure": {"category": "Realm Administration", "description": "Configure infrastructure settings (registries, etc.)"},
    "realm.register": {"category": "Realm Administration", "description": "Register the realm with the registry"},
    "quarter.register": {"category": "Realm Administration", "description": "Register a new quarter (sub-realm)"},
    "quarter.deregister": {"category": "Realm Administration", "description": "Remove a quarter from the realm"},
    "quarter.configure": {"category": "Realm Administration", "description": "Configure quarter settings"},
    "quarter.secede": {"category": "Realm Administration", "description": "Allow a quarter to secede from the realm"},
    "quarter.join_federation": {"category": "Realm Administration", "description": "Join a federation of realms"},
    "shell.execute": {"category": "Realm Administration", "description": "Execute shell commands on the canister (developer)"},

    "mandate.create": {"category": "Governance", "description": "Create governance mandates"},
    "mandate.assign_executor": {"category": "Governance", "description": "Assign an executor to a mandate"},
    "proposal.create": {"category": "Governance", "description": "Submit new governance proposals"},
    "proposal.vote": {"category": "Governance", "description": "Vote on governance proposals"},
    "contract.create_under_mandate": {"category": "Governance", "description": "Create contracts under an active mandate"},
    "scope.authorize": {"category": "Governance", "description": "Authorize governance scopes"},
    "governance.update": {"category": "Governance", "description": "Update governance rules and parameters"},
    "permission.view": {"category": "Governance", "description": "View user permissions and access details"},
    "permission.revoke": {"category": "Governance", "description": "Revoke permissions from users"},

    "role.assign": {"category": "Roles & Permissions", "description": "Assign profiles/roles to users"},
    "role.revoke": {"category": "Roles & Permissions", "description": "Revoke profiles/roles from users"},
    "permission.grant": {"category": "Roles & Permissions", "description": "Grant fine-grained permissions to users"},

    "dispute.create": {"category": "Justice", "description": "File a new dispute or complaint"},
    "dispute.view": {"category": "Justice", "description": "View disputes you are party to"},
    "dispute.accept": {"category": "Justice", "description": "Accept a dispute for adjudication"},
    "dispute.reject": {"category": "Justice", "description": "Reject a dispute filing"},
    "dispute.assign": {"category": "Justice", "description": "Assign a dispute to a judge"},
    "dispute.view_all": {"category": "Justice", "description": "View all disputes in the realm"},
    "evidence.evaluate": {"category": "Justice", "description": "Evaluate submitted evidence"},
    "resolution.draft": {"category": "Justice", "description": "Draft a dispute resolution"},
    "resolution.issue": {"category": "Justice", "description": "Issue an official resolution"},
    "resolution.link_contract": {"category": "Justice", "description": "Link a contract to a resolution"},
    "resolution.modify_terms": {"category": "Justice", "description": "Modify terms of a resolution"},
    "resolution.finalize": {"category": "Justice", "description": "Finalize and close a resolution"},
    "appeal.allow": {"category": "Justice", "description": "Allow an appeal to a resolution"},

    "trade.execute": {"category": "Enforcement", "description": "Execute trades as part of enforcement"},
    "fine.apply": {"category": "Enforcement", "description": "Apply fines to users"},
    "access.revoke": {"category": "Enforcement", "description": "Revoke a user's access as enforcement"},
    "contract.terminate": {"category": "Enforcement", "description": "Terminate a contract as enforcement"},
    "resource.reassign": {"category": "Enforcement", "description": "Reassign resources between users"},
    "instrument.lock": {"category": "Enforcement", "description": "Lock financial instruments"},
    "notification.send": {"category": "Enforcement", "description": "Send enforcement notifications"},
    "resolution.query": {"category": "Enforcement", "description": "Query past resolutions"},
    "enforcement.escalate": {"category": "Enforcement", "description": "Escalate an enforcement action"},
    "enforcement.record": {"category": "Enforcement", "description": "Record enforcement actions"},

    "extension.call": {"category": "Extensions", "description": "Call extension functions (generic)"},
    "extension.sync_call": {"category": "Extensions", "description": "Make synchronous extension calls"},
    "extension.async_call": {"category": "Extensions", "description": "Make asynchronous extension calls"},
    "extension.install": {"category": "Extensions", "description": "Install new extensions into the realm"},
    "extension.uninstall": {"category": "Extensions", "description": "Uninstall extensions from the realm"},

    "codex.install": {"category": "Codex", "description": "Install governance codex packages"},
    "codex.uninstall": {"category": "Codex", "description": "Uninstall governance codex packages"},

    "self.join": {"category": "Self-service", "description": "Join the realm as a new member"},
    "self.update_public_profile": {"category": "Self-service", "description": "Update your own public profile"},
    "self.update_private_data": {"category": "Self-service", "description": "Update your own private data"},
    "self.change_quarter": {"category": "Self-service", "description": "Move to a different quarter"},
    "self.invoice_refresh": {"category": "Self-service", "description": "Refresh your own invoices"},
}


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


def grant_profile_permission(args) -> str:
    """Attach a fine-grained Permission entity to a profile.

    Enforces that the caller holds the permission they are granting.
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        profile_name = args_dict.get("profile_name")
        permission_name = args_dict.get("permission_name")
        if not profile_name or not permission_name:
            return json.dumps({"success": False, "error": "profile_name and permission_name are required"})

        if not _is_allowed(caller, Operations.ALL) and not _is_allowed(caller, permission_name):
            return json.dumps({"success": False, "error": f"Cannot grant '{permission_name}' — you don't hold this permission"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        try:
            for perm in profile.permissions:
                if perm.name == permission_name:
                    return json.dumps({"success": False, "error": f"Profile already has permission '{permission_name}'"})
        except Exception:
            pass

        perm = Permission[permission_name]
        if not perm:
            perm = Permission(name=permission_name)
        profile.permissions.add(perm)
        logger.info(f"Permission '{permission_name}' granted to profile '{profile_name}' by {_get_caller_principal()}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Permission '{permission_name}' granted to profile '{profile_name}'",
                "profile_name": profile_name,
                "permission": permission_name,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"grant_profile_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def revoke_profile_permission(args) -> str:
    """Remove a fine-grained Permission entity from a profile."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        profile_name = args_dict.get("profile_name")
        permission_name = args_dict.get("permission_name")
        if not profile_name or not permission_name:
            return json.dumps({"success": False, "error": "profile_name and permission_name are required"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        found = None
        try:
            for perm in profile.permissions:
                if perm.name == permission_name:
                    found = perm
                    break
        except Exception:
            pass

        if not found:
            return json.dumps({"success": False, "error": f"Profile does not have permission '{permission_name}'"})

        profile.permissions.remove(found)
        found.delete()
        logger.info(f"Permission '{permission_name}' revoked from profile '{profile_name}' by {_get_caller_principal()}")

        return json.dumps({
            "success": True,
            "data": {
                "message": f"Permission '{permission_name}' revoked from profile '{profile_name}'",
                "profile_name": profile_name,
                "permission": permission_name,
            },
        })
    except PermissionError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"revoke_profile_permission error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_grant_profile_permissions(args) -> str:
    """Grant multiple permissions to a profile at once.

    Enforces that the caller can only grant permissions they themselves hold
    (or all permissions if they have the 'all' operation).
    """
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_GRANT)

        profile_name = args_dict.get("profile_name")
        permission_names = args_dict.get("permission_names", [])
        if not profile_name or not permission_names:
            return json.dumps({"success": False, "error": "profile_name and permission_names are required"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

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
            for perm in profile.permissions:
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
            perm = Permission[pname]
            if not perm:
                perm = Permission(name=pname)
            profile.permissions.add(perm)
            granted.append(pname)
            existing.add(pname)

        caller_principal = _get_caller_principal()
        if granted:
            logger.info(f"Permissions {granted} granted to profile '{profile_name}' by {caller_principal}")

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
        logger.error(f"batch_grant_profile_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def batch_revoke_profile_permissions(args) -> str:
    """Revoke multiple permissions from a profile at once."""
    try:
        args_dict = _parse_args(args)
        caller = _get_caller_user()
        _require_operation(caller, Operations.PERMISSION_REVOKE)

        profile_name = args_dict.get("profile_name")
        permission_names = args_dict.get("permission_names", [])
        if not profile_name or not permission_names:
            return json.dumps({"success": False, "error": "profile_name and permission_names are required"})

        profile = UserProfile[profile_name]
        if not profile:
            return json.dumps({"success": False, "error": f"Profile '{profile_name}' not found"})

        perm_map = {}
        try:
            for perm in profile.permissions:
                if perm.name:
                    perm_map[perm.name] = perm
        except Exception:
            pass

        revoked = []
        not_found = []
        for pname in permission_names:
            if pname in perm_map:
                profile.permissions.remove(perm_map[pname])
                perm_map[pname].delete()
                revoked.append(pname)
            else:
                not_found.append(pname)

        caller_principal = _get_caller_principal()
        if revoked:
            logger.info(f"Permissions {revoked} revoked from profile '{profile_name}' by {caller_principal}")

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
        logger.error(f"batch_revoke_profile_permissions error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


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
        from datetime import datetime
        reg_code = _create(
            code_hash=args_dict.get("code_hash", ""),
            profile=args_dict.get("profile", "member"),
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
                    "profile": args_dict.get("profile", "member"),
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
                "profile": args_dict.get("profile", "member"),
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
        return json.dumps(_consume(code_hash, args_dict.get("principal", "")))
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
    "get_all_operations": get_all_operations,  # also returns caller capabilities
    "batch_grant_permissions": batch_grant_permissions,
    "batch_revoke_permissions": batch_revoke_permissions,
    # Profile permissions
    "list_profiles_with_permissions": list_profiles_with_permissions,
    "grant_profile_permission": grant_profile_permission,
    "revoke_profile_permission": revoke_profile_permission,
    "batch_grant_profile_permissions": batch_grant_profile_permissions,
    "batch_revoke_profile_permissions": batch_revoke_profile_permissions,
    # Invitations (merged from census)
    "get_user_count": get_user_count,
    "generate_registration_url": generate_registration_url,
    "validate_registration_code": validate_registration_code,
    "consume_registration_code": consume_registration_code,
    "revoke_registration_code": revoke_registration_code,
    "get_registration_codes": get_registration_codes,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})

    return EXTENSION_FUNCTIONS[method_name](args)
