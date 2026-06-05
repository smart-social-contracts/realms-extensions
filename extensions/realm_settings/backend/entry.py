"""
Realm Settings Extension Backend Entry Point

Realm settings are managed directly via the backend's update_realm_config
and status endpoints. This extension provides lifecycle stage management
and delegates general settings to the core realm backend.
"""

import json

from ic_python_logging import get_logger

logger = get_logger("extensions.realm_settings")

VALID_STAGES = ["alpha", "beta", "production", "deprecation", "terminated"]
STAGE_ORDER = {stage: i for i, stage in enumerate(VALID_STAGES)}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API calls for realm settings."""
    methods = {
        "health": (health, False),
        "get_realm_stage": (get_realm_stage, False),
        "set_realm_stage": (set_realm_stage, True),
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


def health(args=None):
    """Health check."""
    return {"success": True, "data": {"status": "ok"}}


def get_realm_stage(args=None):
    """Return the current realm lifecycle stage and metadata."""
    from ggg import Realm, User

    try:
        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        stage = getattr(realm, "status", "alpha") or "alpha"
        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        lifecycle = manifest.get("lifecycle", {})
        users_count = User.count()

        return {
            "success": True,
            "data": {
                "stage": stage,
                "stages": VALID_STAGES,
                "stage_index": STAGE_ORDER.get(stage, 0),
                "lifecycle": {
                    "critical_mass": lifecycle.get("critical_mass", 10000),
                    "registered_users": users_count,
                    "deposits_locked": lifecycle.get("deposits_locked", False),
                    "land_acquired": lifecycle.get("land_acquired", False),
                    "infrastructure_ready": lifecycle.get("infrastructure_ready", False),
                    "providers_ready": lifecycle.get("providers_ready", False),
                    "history": lifecycle.get("history", []),
                    # Codex-driven fields consumed by the input-driven public dashboard.
                    "population_target": lifecycle.get("population_target"),
                    "go_live_target": lifecycle.get("go_live_target"),
                    "deposit_label": lifecycle.get("deposit_label"),
                },
                # Presentation config written by the codex (see codices/*/init.py).
                # The public dashboard renders blocks based on this, with a
                # graceful fallback to the default layout when absent.
                "dashboard": manifest.get("dashboard", {}),
                "onboarding": manifest.get("onboarding", {}),
                "departments": manifest.get("departments", []),
            },
        }
    except Exception as e:
        logger.error(f"get_realm_stage error: {e}")
        return {"success": False, "error": str(e)}


def set_realm_stage(args: dict):
    """Advance the realm to a new lifecycle stage. Admin only."""
    from ggg import Realm

    try:
        realm = Realm.load("1")
        if not realm:
            return {"success": False, "error": "Realm not found"}

        new_stage = args.get("stage", "").strip().lower()
        reason = args.get("reason", "Admin action")

        if new_stage not in VALID_STAGES:
            return {
                "success": False,
                "error": f"Invalid stage '{new_stage}'. Valid stages: {VALID_STAGES}",
            }

        current_stage = getattr(realm, "status", "alpha") or "alpha"
        current_idx = STAGE_ORDER.get(current_stage, 0)
        new_idx = STAGE_ORDER.get(new_stage, 0)

        if new_idx <= current_idx:
            return {
                "success": False,
                "error": f"Cannot move from '{current_stage}' to '{new_stage}'. "
                         f"Stage can only advance forward.",
            }

        if new_idx > current_idx + 1:
            return {
                "success": False,
                "error": f"Cannot skip stages. Current: '{current_stage}', "
                         f"next allowed: '{VALID_STAGES[current_idx + 1]}'.",
            }

        realm.status = new_stage

        manifest_raw = getattr(realm, "manifest_data", "{}") or "{}"
        try:
            manifest = json.loads(manifest_raw)
        except (json.JSONDecodeError, TypeError):
            manifest = {}

        lifecycle = manifest.setdefault("lifecycle", {})
        history = lifecycle.setdefault("history", [])
        history.append({"stage": new_stage, "reason": reason})

        if new_stage == "beta":
            lifecycle["deposits_locked"] = True

        realm.manifest_data = json.dumps(manifest)

        logger.info(f"Realm stage advanced: {current_stage} -> {new_stage} ({reason})")

        return {
            "success": True,
            "data": {
                "previous_stage": current_stage,
                "new_stage": new_stage,
                "reason": reason,
            },
        }
    except Exception as e:
        logger.error(f"set_realm_stage error: {e}")
        return {"success": False, "error": str(e)}
