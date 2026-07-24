"""
Demo Simulator Extension — API Entry Point

Thin dispatch layer that wires the frontend API and canister lifecycle hooks
to the generator and state modules.
"""

import json
import traceback

from ic_python_logging import get_logger

from .constants import (
    DEFAULT_BATCH_SIZE,
    DEFAULT_INTERVAL_SECONDS,
    DEFAULT_ROTATION_MODE,
    ENTITY_STAT_FIELDS,
    ENTITY_TYPE_KEYS,
    MAX_ENTITIES_TOTAL,
    ROTATION_MODES,
    SCHEDULE_NAME,
    default_enabled_types,
    default_type_count,
    entity_type_catalog,
)
from .generators import (
    backfill_proposal_content,
    build_demo_citizen_payloads,
    generate_budget_batch,
    generate_case_batch,
    generate_court_batch,
    generate_department_batch,
    generate_dispute_batch,
    generate_fiscal_period_batch,
    generate_fund_batch,
    generate_land_batch,
    generate_ledger_batch,
    generate_notification_batch,
    generate_org_batch,
    generate_proposal_batch,
    generate_transfer_batch,
    generate_vote_batch,
)
from .state import (
    get_or_create_schedule,
    get_state,
    is_demo_mode_active,
    load_state_data,
    normalize_state_data,
    random_seed,
    save_state_data,
    _ensure_async_batch_codex,
)

logger = get_logger("extensions.demo_simulator")


GENERATORS = {
    "organizations": generate_org_batch,
    "proposals": generate_proposal_batch,
    "transfers": generate_transfer_batch,
    "disputes": generate_dispute_batch,
    "votes": generate_vote_batch,
    "lands": generate_land_batch,
    "courts": generate_court_batch,
    "cases": generate_case_batch,
    "funds": generate_fund_batch,
    "fiscal_periods": generate_fiscal_period_batch,
    "budgets": generate_budget_batch,
    "ledger_entries": generate_ledger_batch,
    "messages": generate_notification_batch,
    "departments": generate_department_batch,
}


def _parse_args(args):
    if isinstance(args, str):
        try:
            return json.loads(args) if args else {}
        except json.JSONDecodeError:
            return {}
    return args if isinstance(args, dict) else {}


def _enabled_type_keys(state_data):
    enabled = state_data.get("enabled_types") or default_enabled_types()
    return [key for key in ENTITY_TYPE_KEYS if enabled.get(key, True)]


def _resolve_type_count(state_data, type_key):
    overrides = state_data.get("type_counts") or {}
    if type_key in overrides and overrides[type_key] is not None:
        return max(0, int(overrides[type_key]))
    batch_size = state_data.get("batch_size", DEFAULT_BATCH_SIZE)
    return default_type_count(type_key, batch_size)


def _total_entities_created(state_data):
    return sum(int(state_data.get(field, 0) or 0) for field in ENTITY_STAT_FIELDS.values())


def _pick_types_for_batch(state_data, enabled_keys, override_types=None):
    if override_types:
        picked = [t for t in override_types if t in GENERATORS and t in enabled_keys]
        return picked or enabled_keys[:1]

    if not enabled_keys:
        return []

    mode = state_data.get("rotation_mode", DEFAULT_ROTATION_MODE)
    if mode == "all":
        return list(enabled_keys)

    if mode == "random":
        import random as _random

        seed = int(state_data.get("seed") or 0)
        batch_number = int(state_data.get("batch_number") or 0)
        rng = _random.Random(seed + batch_number * 9973)
        return [rng.choice(enabled_keys)]

    # round_robin (default)
    idx = int(state_data.get("batch_number") or 0) % len(enabled_keys)
    return [enabled_keys[idx]]


def _run_generators(state_data, type_keys):
    results = {}
    for type_key in type_keys:
        count = _resolve_type_count(state_data, type_key)
        if count <= 0:
            continue
        generator = GENERATORS.get(type_key)
        if not generator:
            continue
        try:
            results[type_key if type_key != "messages" else "messages"] = generator(state_data, count)
        except Exception as e:
            logger.error(f"Demo simulator generator {type_key} failed: {e}")
            logger.error(traceback.format_exc())
            results.setdefault("errors", []).append({type_key: str(e)})
    return results


def _apply_user_registration_result(state_data, result):
    if not isinstance(result, dict) or not result.get("success"):
        return {
            "error": (result or {}).get("error", "demo user registration failed"),
            "created": [],
        }
    created = result.get("created") or []
    state_data["total_users_created"] = int(state_data.get("total_users_created", 0)) + len(created)
    return {"created": created, "target": result.get("target")}


def _register_demo_users_local(state_data, count):
    from core.demo_registration import authorize_capital_demo_registration, register_demo_citizens_local

    auth = authorize_capital_demo_registration()
    if not auth.get("ok"):
        return {"error": auth["error"], "created": []}

    citizens = build_demo_citizen_payloads(state_data, count)
    return _apply_user_registration_result(state_data, register_demo_citizens_local(citizens))


def _register_demo_users_routed(state_data, count):
    from core.demo_registration import authorize_capital_demo_registration, register_demo_citizens_routed

    auth = authorize_capital_demo_registration()
    if not auth.get("ok"):
        return {"error": auth["error"], "created": []}

    citizens = build_demo_citizen_payloads(state_data, count)
    result = yield from register_demo_citizens_routed(citizens)
    return _apply_user_registration_result(state_data, result)


def _prepare_batch(state_data, params):
    from ggg import TaskSchedule

    max_entities = state_data.get("max_entities", MAX_ENTITIES_TOTAL)
    batch_number = state_data.get("batch_number", 0)
    total_created = _total_entities_created(state_data)

    if max_entities and total_created >= max_entities:
        logger.info(f"Demo simulator reached max entities ({max_entities}), pausing.")
        schedule = TaskSchedule[SCHEDULE_NAME]
        if schedule:
            schedule.disabled = True
        return None, json.dumps({
            "status": "paused",
            "reason": "max_entities_reached",
            "total": total_created,
        })

    enabled_keys = _enabled_type_keys(state_data)
    if not enabled_keys:
        return None, json.dumps({
            "status": "skipped",
            "reason": "no_enabled_types",
            "batch": batch_number,
        })

    override_types = params.get("types")
    if isinstance(override_types, str):
        override_types = [t.strip() for t in override_types.split(",") if t.strip()]
    type_keys = _pick_types_for_batch(state_data, enabled_keys, override_types)
    return (batch_number, type_keys), None


def _finalize_batch(state, state_data, batch_number, type_keys, results):
    state_data["batch_number"] = batch_number + 1
    save_state_data(state, state_data)
    logger.info(f"Demo simulator batch {batch_number + 1} complete: {results}")
    return json.dumps({
        "status": "ok",
        "batch": batch_number + 1,
        "types": type_keys,
        "created": results,
    })


def run_batch_async(args: str = "{}"):
    """Async batch runner — required when demo users route to peer quarters."""
    params = _parse_args(args)
    state = get_state()
    state_data = load_state_data(state)
    prepared, early = _prepare_batch(state_data, params)
    if early:
        return early

    batch_number, type_keys = prepared
    results = {}
    sync_keys = [k for k in type_keys if k != "users"]
    if sync_keys:
        results.update(_run_generators(state_data, sync_keys))

    if "users" in type_keys:
        count = _resolve_type_count(state_data, "users")
        if count > 0:
            try:
                user_result = yield from _register_demo_users_routed(state_data, count)
                results["users"] = user_result.get("created", [])
                if user_result.get("target"):
                    results["users_target"] = user_result.get("target")
                if user_result.get("error"):
                    results.setdefault("errors", []).append({"users": user_result["error"]})
            except Exception as e:
                logger.error(f"Demo user batch failed: {e}")
                logger.error(traceback.format_exc())
                results.setdefault("errors", []).append({"users": str(e)})

    return _finalize_batch(state, state_data, batch_number, type_keys, results)


# ── Core batch runner ────────────────────────────────────────────────────────

def run_batch(args: str = "{}"):
    """Sync batch runner for Run Once (local capital users only)."""
    params = _parse_args(args)
    state = get_state()
    state_data = load_state_data(state)
    prepared, early = _prepare_batch(state_data, params)
    if early:
        return early

    batch_number, type_keys = prepared
    results = {}
    sync_keys = [k for k in type_keys if k != "users"]
    if sync_keys:
        results.update(_run_generators(state_data, sync_keys))

    if "users" in type_keys:
        count = _resolve_type_count(state_data, "users")
        if count > 0:
            try:
                from _cdk import ic
                from core.demo_registration import pick_target_quarter_canister

                self_id = ic.id().to_str()
                target = pick_target_quarter_canister(self_id)
                if target != self_id:
                    return json.dumps({
                        "status": "error",
                        "error": (
                            "Demo users are routed to a peer quarter; start the simulator "
                            "schedule (async batch) instead of Run Once."
                        ),
                    })

                user_result = _register_demo_users_local(state_data, count)
                if user_result.get("error"):
                    return json.dumps({"status": "error", "error": user_result["error"]})
                results["users"] = user_result.get("created", [])
                if user_result.get("target"):
                    results["users_target"] = user_result.get("target")
            except Exception as e:
                logger.error(f"Demo user batch failed: {e}")
                logger.error(traceback.format_exc())
                return json.dumps({"status": "error", "error": str(e)})

    return _finalize_batch(state, state_data, batch_number, type_keys, results)


# ── Extension API ────────────────────────────────────────────────────────────

def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API — called by the extension runtime."""
    methods = {
        "initialize": initialize,
        "get_status": get_status,
        "toggle": toggle,
        "update_config": update_config,
        "set_seed": set_seed,
        "reset": reset,
        "run_once": run_once,
        "backfill_proposals": backfill_proposals,
    }

    if method_name not in methods:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})

    try:
        return methods[method_name](args)
    except Exception as e:
        logger.error(f"demo_simulator.{method_name} error: {e}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def initialize(args):
    """Called by the canister on every start/upgrade and after extension install.

    Creates the TaskSchedule if needed and auto-enables it when the
    runtime Realm flags test_mode + test_mode_demo_data are both True
    (read live via core.runtime_flags, so a Casals arrangement /
    set_canister_config can flip it without a rebuild) — but only for a
    *newly created* schedule.  If the schedule already exists (e.g.
    extension re-install or upgrade), its disabled state is preserved
    so that a user who manually stopped the simulator doesn't have it
    re-enabled behind their back.

    Calls TaskManager().run() to (re-)register IC timers for all
    scheduled tasks. This handles both fresh installs and upgrades
    (IC timers are lost on upgrade; TaskManager resets and reschedules).
    """
    from ggg import TaskSchedule
    from core.task_manager import TaskManager

    already_existed = TaskSchedule[SCHEDULE_NAME] is not None
    schedule = get_or_create_schedule()
    codex_upgraded = False
    if already_existed:
        codex_upgraded = _ensure_async_batch_codex(schedule)

    if not already_existed and is_demo_mode_active():
        schedule.disabled = False
        logger.info("Demo simulator auto-activated (new schedule + runtime test_mode + test_mode_demo_data)")
    elif already_existed:
        logger.info(f"Demo simulator schedule already exists (disabled={schedule.disabled}), preserving state")
    else:
        logger.info("Demo simulator initialized (schedule disabled — demo mode flags not set)")

    try:
        TaskManager().run()
        logger.info("TaskManager started — schedules registered")
    except Exception as e:
        logger.error(f"Failed to start TaskManager: {e}\n{traceback.format_exc()}")

    return json.dumps({
        "success": True,
        "auto_activated": not already_existed and is_demo_mode_active(),
        "running": not schedule.disabled,
        "codex_upgraded": codex_upgraded,
    })


def get_status(args):
    """Return current simulator status: running/paused, stats, config."""
    from ggg import TaskSchedule

    state = get_state()
    state_data = load_state_data(state)
    batch_size = state_data.get("batch_size", DEFAULT_BATCH_SIZE)

    schedule = TaskSchedule[SCHEDULE_NAME]
    is_running = bool(schedule and not schedule.disabled)
    interval = schedule.repeat_every if schedule else DEFAULT_INTERVAL_SECONDS

    enabled_types = state_data.get("enabled_types") or default_enabled_types()
    type_counts = state_data.get("type_counts") or {}
    resolved_counts = {
        key: _resolve_type_count(state_data, key)
        for key in ENTITY_TYPE_KEYS
    }

    return json.dumps({
        "success": True,
        "running": is_running,
        "interval_seconds": interval,
        "batch_size": batch_size,
        "max_entities": state_data.get("max_entities", MAX_ENTITIES_TOTAL),
        "batch_number": state_data.get("batch_number", 0),
        "seed": state_data.get("seed", 0),
        "rotation_mode": state_data.get("rotation_mode", DEFAULT_ROTATION_MODE),
        "rotation_modes": list(ROTATION_MODES),
        "enabled_types": enabled_types,
        "type_counts": type_counts,
        "resolved_type_counts": resolved_counts,
        "entity_types": entity_type_catalog(),
        "stats": {
            "users": state_data.get("total_users_created", 0),
            "organizations": state_data.get("total_orgs_created", 0),
            "proposals": state_data.get("total_proposals_created", 0),
            "transfers": state_data.get("total_transfers_created", 0),
            "disputes": state_data.get("total_disputes_created", 0),
            "votes": state_data.get("total_votes_created", 0),
            "lands": state_data.get("total_lands_created", 0),
            "courts": state_data.get("total_courts_created", 0),
            "cases": state_data.get("total_cases_created", 0),
            "funds": state_data.get("total_funds_created", 0),
            "fiscal_periods": state_data.get("total_fiscal_periods_created", 0),
            "budgets": state_data.get("total_budgets_created", 0),
            "ledger_entries": state_data.get("total_ledger_entries_created", 0),
            "messages": state_data.get("total_notifications_created", 0),
            "departments": state_data.get("total_departments_created", 0),
        },
        "demo_mode_active": is_demo_mode_active(),
    })


def _restart_task_manager():
    from core.task_manager import TaskManager

    TaskManager().run()


def toggle(args):
    """Enable or disable the simulator schedule.

    When enabling, restarts the TaskManager so that an IC timer is
    registered for the schedule.  Without this, the schedule flag
    says "enabled" but no timer actually fires ``run_batch()``.
    """
    from ggg import TaskSchedule

    if isinstance(args, str):
        args = json.loads(args) if args else {}

    enabled = args.get("enabled")
    if enabled is None:
        schedule = TaskSchedule[SCHEDULE_NAME]
        enabled = bool(schedule and schedule.disabled)

    schedule = get_or_create_schedule()
    schedule.disabled = not enabled

    if enabled:
        _restart_task_manager()

    action = "started" if enabled else "stopped"
    logger.info(f"Demo simulator {action}")
    return json.dumps({"success": True, "running": enabled, "action": action})


def update_config(args):
    """Update simulator parameters (interval, batch_size, max_entities, types, rotation)."""
    if isinstance(args, str):
        args = json.loads(args) if args else {}

    state = get_state()
    state_data = load_state_data(state)

    if "batch_size" in args:
        state_data["batch_size"] = max(1, min(20, int(args["batch_size"])))
    if "max_entities" in args:
        val = args["max_entities"]
        state_data["max_entities"] = None if val is None or val == 0 else max(10, int(val))
    if "seed" in args:
        state_data["seed"] = int(args["seed"])
    if "rotation_mode" in args:
        mode = str(args["rotation_mode"])
        if mode in ROTATION_MODES:
            state_data["rotation_mode"] = mode
    if "enabled_types" in args and isinstance(args["enabled_types"], dict):
        enabled = default_enabled_types()
        for key in ENTITY_TYPE_KEYS:
            if key in args["enabled_types"]:
                enabled[key] = bool(args["enabled_types"][key])
        state_data["enabled_types"] = enabled
    if "type_counts" in args and isinstance(args["type_counts"], dict):
        type_counts = {}
        for key, val in args["type_counts"].items():
            if key not in ENTITY_TYPE_KEYS:
                continue
            if val is None or val == "":
                continue
            type_counts[key] = max(0, min(100, int(val)))
        state_data["type_counts"] = type_counts

    save_state_data(state, state_data)

    if "interval_seconds" in args:
        schedule = get_or_create_schedule()
        schedule.repeat_every = max(10, int(args["interval_seconds"]))

    return json.dumps({
        "success": True,
        "config": {
            "batch_size": state_data.get("batch_size"),
            "max_entities": state_data.get("max_entities"),
            "seed": state_data.get("seed"),
            "rotation_mode": state_data.get("rotation_mode"),
            "enabled_types": state_data.get("enabled_types"),
            "type_counts": state_data.get("type_counts"),
        },
    })


def set_seed(args):
    """Set the random seed. When set, all subsequent batches are deterministic.

    Pass {"seed": <integer>} to lock the seed, or {"seed": null} to randomize.
    """
    if isinstance(args, str):
        args = json.loads(args) if args else {}

    state = get_state()
    state_data = load_state_data(state)

    seed_value = args.get("seed")
    if seed_value is None:
        state_data["seed"] = random_seed()
    else:
        state_data["seed"] = int(seed_value)

    save_state_data(state, state_data)
    return json.dumps({"success": True, "seed": state_data["seed"]})


def reset(args):
    """Reset all demo data counters (does not delete created entities).

    Generates a new random seed unless one was explicitly set by the user.
    """
    if isinstance(args, str):
        args = json.loads(args) if args else {}

    state = get_state()
    state_data = load_state_data(state)

    keep_seed = args.get("keep_seed", False)
    old_seed = state_data.get("seed", 0)

    state_data["batch_number"] = 0
    state_data["total_users_created"] = 0
    state_data["total_orgs_created"] = 0
    state_data["total_proposals_created"] = 0
    state_data["total_transfers_created"] = 0
    state_data["total_disputes_created"] = 0
    state_data["total_votes_created"] = 0
    state_data["total_lands_created"] = 0
    state_data["total_courts_created"] = 0
    state_data["total_cases_created"] = 0
    state_data["total_funds_created"] = 0
    state_data["total_fiscal_periods_created"] = 0
    state_data["total_budgets_created"] = 0
    state_data["total_ledger_entries_created"] = 0
    state_data["total_notifications_created"] = 0
    state_data["total_departments_created"] = 0

    if not keep_seed:
        state_data["seed"] = random_seed()

    save_state_data(state, state_data)
    return json.dumps({"success": True, "action": "reset", "seed": state_data["seed"]})


def run_once(args):
    """Manually trigger a single batch (regardless of schedule state)."""
    return run_batch(json.dumps(args) if isinstance(args, dict) else args or "{}")


def backfill_proposals(args):
    """Backfill meaningful descriptions and proposal code on legacy demo proposals."""
    if isinstance(args, str):
        args = json.loads(args) if args else {}

    page_size = int(args.get("page_size", 20))
    max_pages = int(args.get("max_pages", 50))
    updated = backfill_proposal_content(page_size=page_size, max_pages=max_pages)
    return json.dumps({
        "success": True,
        "count": len(updated),
        "updated": updated,
    })
