"""
Census Extension Backend Entry Point

Provides user count statistics and registration code (invitation) management.
"""

import json
import traceback
from typing import Any, Dict

from ic_python_db import Database, Entity
from ic_python_logging import get_logger

from ggg.system.registration_code import (
    RegistrationCode,
    consume_registration_code as _consume,
    create_registration_code as _create,
    list_registration_codes as _list_codes,
    revoke_registration_code as _revoke,
    validate_registration_code as _validate,
)

logger = get_logger("extensions.census")


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API calls for census operations."""
    methods = {
        "get_user_count": (get_user_count, False),
        "generate_registration_url": (generate_registration_url, True),
        "validate_registration_code": (validate_registration_code, True),
        "get_registration_codes": (get_registration_codes, True),
        "consume_registration_code": (consume_registration_code, True),
        "revoke_registration_code": (revoke_registration_code, True),
    }

    if method_name not in methods:
        return {"success": False, "error": f"Unknown method: {method_name}"}

    function, requires_args = methods[method_name]

    try:
        if requires_args:
            return function(args)
        else:
            return function()
    except Exception as e:
        return {"success": False, "error": f"Error calling {method_name}: {str(e)}"}


def get_user_count(args=None):
    """Return the number of registered users in the realm."""
    db = Database.get_instance()
    try:
        user_cls = db._entity_types.get("User")
        if not user_cls:
            return {"success": True, "data": {"user_count": 0}}
        count = len(user_cls.instances())
        return {"success": True, "data": {"user_count": count}}
    except Exception as e:
        logger.error(f"Error counting users: {e}")
        return {"success": False, "error": str(e)}


def _self_canister_id() -> str:
    """Canister id this code lives on (the active quarter). Used by the frontend
    to build a quarter-scoped invite link (issue #156)."""
    try:
        from kybra import ic as _ic
        return _ic.id().to_str()
    except Exception:
        return ""


def generate_registration_url(args: dict):
    """Generate a registration URL for inviting a new user."""
    try:
        if isinstance(args, str):
            args = json.loads(args)

        user_id = args.get("user_id", "admin")

        from datetime import datetime

        reg_code = _create(
            code_hash=args.get("code_hash", ""),
            profile=args.get("profile", "member"),
            max_uses=args.get("max_uses", 1),
            expires_in_hours=args.get("expires_in_hours", 24),
            created_by=args.get("created_by", "admin"),
            user_id=user_id,
            frontend_url=args.get("frontend_url", "https://localhost:3000"),
            email=args.get("email", ""),
            department=args.get("department", ""),
        )

        canister_id = _self_canister_id()

        code_hash = args.get("code_hash")
        if code_hash:
            return {
                "success": True,
                "data": {
                    "code_hash": code_hash[:8],
                    "expires_at": datetime.fromtimestamp(reg_code.expires_at).isoformat(),
                    "profile": args.get("profile", "member"),
                    "canister_id": canister_id,
                },
            }

        return {
            "success": True,
            "data": {
                "code": reg_code.code,
                "code_hash": reg_code.code_hash,
                "registration_url": reg_code.registration_url,
                "expires_at": datetime.fromtimestamp(reg_code.expires_at).isoformat(),
                "user_id": reg_code.user_id,
                "profile": args.get("profile", "member"),
                "department": reg_code.department or "",
                "canister_id": canister_id,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def validate_registration_code(args: dict):
    """Validate a registration code."""
    try:
        if isinstance(args, str):
            args = json.loads(args)

        code_hash = args.get("code_hash", "")
        if not code_hash:
            import hashlib
            plaintext = args.get("code", "")
            if not plaintext:
                return {"success": False, "error": "code or code_hash is required"}
            code_hash = hashlib.sha256(plaintext.encode()).hexdigest()

        return _validate(code_hash)
    except Exception as e:
        return {"success": False, "error": str(e)}


def consume_registration_code(args: dict):
    """Consume a registration code."""
    try:
        if isinstance(args, str):
            args = json.loads(args)

        code_hash = args.get("code_hash", "")
        if not code_hash:
            import hashlib
            plaintext = args.get("code", "")
            if not plaintext:
                return {"success": False, "error": "code or code_hash is required"}
            code_hash = hashlib.sha256(plaintext.encode()).hexdigest()

        return _consume(code_hash, args.get("principal", ""))
    except Exception as e:
        return {"success": False, "error": str(e)}


def revoke_registration_code(args: dict):
    """Revoke a registration code."""
    try:
        if isinstance(args, str):
            args = json.loads(args)
        return _revoke(code=args.get("code"), code_hash=args.get("code_hash"))
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_registration_codes(args: dict):
    """List registration codes."""
    try:
        if isinstance(args, str):
            args = json.loads(args)

        user_id = args.get("user_id")
        include_used = args.get("include_used", False)

        if user_id:
            from datetime import datetime
            codes = RegistrationCode.find_by_user_id(user_id)
            if not include_used:
                codes = [c for c in codes if c.used == 0]
            return {
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
            }

        return {"success": True, "data": _list_codes(include_used=include_used)}
    except Exception as e:
        return {"success": False, "error": str(e)}
