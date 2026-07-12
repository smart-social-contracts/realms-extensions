"""Authorization helpers for the procurement extension."""

from ggg import User
from ggg.system.user_profile import Operations, OPERATIONS_SEPARATOR

try:
    from basilisk import ic as _ic
except ImportError:
    _ic = None

# Extension-local operation strings (no realms repo Operations enum required).
PROCUREMENT_RFP_CREATE = "procurement.rfp.create"
PROCUREMENT_RFP_PUBLISH = "procurement.rfp.publish"
PROCUREMENT_BID_SUBMIT = "procurement.bid.submit"
PROCUREMENT_EVALUATE = "procurement.evaluate"
PROCUREMENT_AWARD = "procurement.award"
PROCUREMENT_EXECUTE = "procurement.execute"

PROCUREMENT_DEPARTMENT = "Procurement"
SYSTEM_ACTOR = "system"


def caller_principal() -> str:
    if _ic is not None:
        try:
            return _ic.caller().to_str()
        except Exception:
            pass
    return ""


def now_epoch() -> int:
    if _ic is not None:
        try:
            return int(_ic.time() // 1_000_000_000)
        except Exception:
            pass
    import time

    return int(time.time())


def get_caller_user() -> User:
    principal = caller_principal()
    if not principal:
        raise PermissionError("Not authenticated")
    user = User[principal]
    if not user:
        raise PermissionError(f"User {principal} not found")
    return user


def is_allowed(user: User, operation: str) -> bool:
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


def require_op(user: User, operation: str) -> None:
    if not is_allowed(user, operation):
        raise PermissionError(
            f"Access denied: user {user.id} lacks permission '{operation}'"
        )


def is_realm_admin(caller: str) -> bool:
    if not caller:
        return False
    try:
        from core.crypto_scopes import production_context

        return production_context().is_realm_admin(caller)
    except Exception:
        return is_allowed(User[caller], Operations.ALL) if User[caller] else False


def _department_member_principals(department: str) -> list[str]:
    try:
        from core.membership import department_member_principals
        from ggg import Department

        dept = Department[department]
        if not dept:
            return []
        return department_member_principals(dept, include_head=True)
    except Exception:
        return []


def is_evaluator(user: User) -> bool:
    if is_realm_admin(str(user.id)):
        return True
    if is_allowed(user, PROCUREMENT_EVALUATE):
        return True
    # Forward membership check — cheap, no user scan (issue #242).
    try:
        from core.membership import user_in_department
        from ggg import Department

        dept = Department[PROCUREMENT_DEPARTMENT]
        if dept is None:
            return False
        head = getattr(dept, "head", None)
        if head is not None and getattr(head, "id", None) == str(user.id):
            return True
        return user_in_department(user, dept)
    except Exception:
        return str(user.id) in _department_member_principals(PROCUREMENT_DEPARTMENT)


def is_approver(user: User) -> bool:
    if is_realm_admin(str(user.id)):
        return True
    if is_allowed(user, PROCUREMENT_AWARD):
        return True
    if is_allowed(user, PROCUREMENT_EXECUTE):
        return True
    return False


def is_requester(user: User) -> bool:
    if is_realm_admin(str(user.id)):
        return True
    return is_allowed(user, PROCUREMENT_RFP_CREATE)


def is_vendor(user: User) -> bool:
    if is_realm_admin(str(user.id)):
        return True
    return is_allowed(user, PROCUREMENT_BID_SUBMIT)


def list_evaluator_principals() -> list[str]:
    """Principals who may evaluate bids (department + permission holders)."""
    principals = set(_department_member_principals(PROCUREMENT_DEPARTMENT))
    try:
        from ggg import User

        for user in User.instances():
            uid = str(getattr(user, "id", "") or "")
            if uid and is_evaluator(user):
                principals.add(uid)
    except Exception:
        pass
    return sorted(principals)
