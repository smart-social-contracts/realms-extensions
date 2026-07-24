"""
Demo Simulator — State management.

Handles reading/writing the simulator's persistent state (stored as a Service
entity's description field) and checking runtime config flags.
"""

import json
import random

from .constants import (
    BATCH_STEP_CODE,
    DEFAULT_BATCH_SIZE,
    DEFAULT_INTERVAL_SECONDS,
    DEFAULT_ROTATION_MODE,
    ENTITY_STAT_FIELDS,
    ENTITY_TYPE_KEYS,
    MAX_ENTITIES_TOTAL,
    SCHEDULE_NAME,
    TASK_NAME,
    default_enabled_types,
)


def random_seed():
    """Generate a random seed from ic.time() (nanoseconds), with fallback."""
    try:
        import ic as _ic
        t = _ic.time()
        if t > 0:
            return t % 1_000_000
    except Exception:
        pass
    return random.randint(1, 999999)


def get_state():
    """Load or create the simulator state entity."""
    from ggg import Service

    state = Service["demo_simulator_state"]
    if not state:
        state = Service(
            service_id="demo_simulator_state",
            name="demo_simulator_state",
            description=json.dumps(_default_state_data()),
        )
    return state


def _default_state_data():
    counters = {field: 0 for field in ENTITY_STAT_FIELDS.values()}
    return {
        "batch_number": 0,
        **counters,
        "seed": 0,
        "batch_size": DEFAULT_BATCH_SIZE,
        "max_entities": MAX_ENTITIES_TOTAL,
        "rotation_mode": DEFAULT_ROTATION_MODE,
        "enabled_types": default_enabled_types(),
        "type_counts": {},
    }


def normalize_state_data(data):
    """Merge persisted state with defaults for newer config fields."""
    base = _default_state_data()
    if not isinstance(data, dict):
        return base
    merged = {**base, **data}
    enabled = merged.get("enabled_types")
    if not isinstance(enabled, dict):
        enabled = default_enabled_types()
    else:
        normalized_enabled = default_enabled_types()
        for key in ENTITY_TYPE_KEYS:
            if key in enabled:
                normalized_enabled[key] = bool(enabled[key])
        enabled = normalized_enabled
    merged["enabled_types"] = enabled
    type_counts = merged.get("type_counts")
    merged["type_counts"] = type_counts if isinstance(type_counts, dict) else {}
    mode = merged.get("rotation_mode") or DEFAULT_ROTATION_MODE
    if mode not in ("round_robin", "random", "all"):
        mode = DEFAULT_ROTATION_MODE
    merged["rotation_mode"] = mode
    return merged


def load_state_data(state):
    """Parse state JSON stored in the description field (2048 char limit)."""
    try:
        raw = json.loads(state.description) if state.description else {}
    except (json.JSONDecodeError, TypeError):
        raw = {}
    return normalize_state_data(raw)


def save_state_data(state, data):
    """Persist state JSON to the description field."""
    state.description = json.dumps(data)


def is_demo_mode_active():
    """Check if test_mode and test_mode_demo_data are both enabled.

    Reads the runtime Realm entity flags (set via set_canister_config), not the
    build-time config module — so a Casals arrangement / set_canister_config can
    flip demo mode without rebuilding the WASM.
    """
    try:
        from core.runtime_flags import is_demo_data_active
        return is_demo_data_active()
    except Exception:
        return False


def _ensure_async_batch_codex(schedule):
    """Upgrade legacy sync schedules so quarter routing can use inter-canister calls."""
    from ggg import Task

    task = schedule.task if schedule else None
    if not task:
        task = Task[TASK_NAME]
    if not task or not task.steps:
        return False

    step = task.steps[0]
    call = getattr(step, "call", None)
    codex = getattr(call, "codex", None) if call else None
    if not call or not codex:
        return False

    code = str(codex.code or "")
    needs_upgrade = (
        not bool(getattr(call, "is_async", False))
        or "run_batch_async" not in code
        or "async_task" not in code
    )
    if not needs_upgrade:
        return False

    codex.code = BATCH_STEP_CODE
    call.is_async = True
    logger = __import__("ic_python_logging").get_logger("extensions.demo_simulator")
    logger.info("Upgraded demo simulator schedule codex to async batch runner")
    return True


def get_or_create_schedule():
    """Get the demo simulator schedule, creating it if missing.

    Idempotent: if a previous init failed midway (Task created but no Schedule),
    detects the orphaned state, cleans up, and retries.
    """
    from ggg import Call, Codex, Task, TaskSchedule, TaskStep

    schedule = TaskSchedule[SCHEDULE_NAME]
    if schedule:
        return schedule

    # Detect partial state from a previous failed init
    orphan_task = Task[TASK_NAME]
    if orphan_task:
        orphan_task.delete()

    codex = Codex(
        name="demo_simulator_batch",
        description="Executes one batch of demo data generation (async for quarter routing)",
        code=BATCH_STEP_CODE,
    )

    call = Call(is_async=True, codex=codex)
    task = Task(name=TASK_NAME)
    TaskStep(call=call, status="pending", run_next_after=0, task=task)

    return TaskSchedule(
        name=SCHEDULE_NAME,
        task=task,
        repeat_every=DEFAULT_INTERVAL_SECONDS,
        run_at=0,
        last_run_at=0,
        disabled=True,
    )
