"""System Info — admin diagnostics dashboard, sandboxed.

Reports Python/Basilisk versions, installed extensions, database entity
counts, filesystem usage, canister cycles and memory, and cached token
balances.

All of that is host state, so it is gathered host-side behind the admin-gated
``system.snapshot`` capability and this module only shapes the result. That is
the substantive change from the pre-sandbox version: an extension that walked
``/`` and enumerated every ORM class now has no way to do either, and the
build-time version placeholders below are the only thing it still supplies on
its own.
"""

import json

from ggg_sdk import ctx

# Replaced by CI at build time.
REALMS_BUILD = {
    "version": "VERSION_PLACEHOLDER",
    "commit": "COMMIT_HASH_PLACEHOLDER",
    "commit_datetime": "COMMIT_DATETIME_PLACEHOLDER",
}

DEPENDENCIES = [
    "ic-basilisk==BASILISK_VERSION_PLACEHOLDER",
    "ic-python-db==IC_PYTHON_DB_VERSION_PLACEHOLDER",
    "ic-python-logging==IC_PYTHON_LOGGING_VERSION_PLACEHOLDER",
]

EXTENSIONS_BUILD = {
    "commit": "EXTENSIONS_COMMIT_HASH_PLACEHOLDER",
    "commit_datetime": "EXTENSIONS_COMMIT_DATETIME_PLACEHOLDER",
}


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(e):
    ctx.log(f"system_info error: {e}")
    return json.dumps({"success": False, "error": str(e)})


def _sections(*names):
    return ctx.system_snapshot(list(names))


def get_system_info(args: str) -> str:
    """Return a comprehensive system information snapshot."""
    try:
        snap = ctx.system_snapshot()
        runtime = snap.get("runtime", {})

        extensions = snap.get("extensions", {})
        for entry in extensions.get("extensions", []):
            entry.update(EXTENSIONS_BUILD)

        return _ok({
            "python": runtime.get("python", {}),
            "basilisk": runtime.get("basilisk", {}),
            "realms": dict(REALMS_BUILD),
            "extensions": extensions,
            "db": snap.get("db", {}),
            "files": snap.get("files", {}),
            "canister": snap.get("canister", {}),
            "tokens": snap.get("tokens", {}),
            "dependencies": list(DEPENDENCIES),
        })
    except Exception as e:
        return _err(e)


def get_db_stats(args: str) -> str:
    """Return per-entity-type counts from the database."""
    try:
        return _ok(_sections("db").get("db", {}))
    except Exception as e:
        return _err(e)


def get_canister_stats(args: str) -> str:
    """Return canister-level metrics: cycles, memory, IDs."""
    try:
        return _ok(_sections("canister").get("canister", {}))
    except Exception as e:
        return _err(e)


def get_token_balances(args: str) -> str:
    """Return cached token balances (no inter-canister calls)."""
    try:
        return _ok(_sections("tokens").get("tokens", {}))
    except Exception as e:
        return _err(e)
