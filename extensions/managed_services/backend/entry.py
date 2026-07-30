"""
Managed Services Extension — backend entry point.

Configuration, credit transaction history, and billing integration for realm
administrators.

Runs sandboxed. ``get_transactions`` reaches the registry canister through the
async capability bridge (issue #279): ``ctx.services.query`` cannot return a
value on the pass that asks for one, so the host performs the outcall and runs
this function again with the result in hand. The body therefore executes more
than once and must not write — the writes live in ``set_config``, which is an
ordinary synchronous call.
"""

import json

from ggg_sdk import ctx, ServiceCallError

DEFAULT_BILLING_SERVICE_URL = "https://billing.realmsgos.dev"
UPGRADE_COST_CREDITS = 5

CONFIG_TYPE = "ManagedServicesConfig"
BILLING_URL_KEY = "billing_service_url"


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(msg):
    return json.dumps({"success": False, "error": str(msg)})


def _config_row(key):
    for row in ctx.own.list(CONFIG_TYPE, where={"key": key}, limit=1):
        return row
    return None


def _get_cfg(key, default=""):
    row = _config_row(key)
    if row and row.get("value"):
        return row["value"]
    return default


def _set_cfg(key, value):
    row = _config_row(key)
    if row:
        ctx.own.update(CONFIG_TYPE, row["id"], {"value": value})
    else:
        ctx.own.create(CONFIG_TYPE, {"key": key, "value": value})


def get_config(args: str) -> str:
    """Billing and realm configuration the frontend needs."""
    try:
        info = ctx.realm_info()
        return _ok({
            "billing_service_url": _get_cfg(
                BILLING_URL_KEY, DEFAULT_BILLING_SERVICE_URL
            ),
            "realm_canister_id": info.get("canister_id", ""),
            "registry_canister_id": info.get("registry_canister_id", ""),
            "current_version": info.get("version", ""),
            "upgrade_cost_credits": UPGRADE_COST_CREDITS,
        })
    except Exception as e:
        return _err(e)


def get_transactions(args: str) -> str:
    """Credit transaction history from the registry.

    Declared in the manifest's ``async_functions``. The host resolves which
    registry to ask and which principal to ask about; this function chooses only
    how many rows it wants.
    """
    try:
        params = json.loads(args) if args else {}
    except Exception:
        params = {}
    try:
        limit = int(params.get("limit", 20))
    except (TypeError, ValueError):
        limit = 20

    try:
        result = ctx.services.query("registry.get_transactions", limit=limit)
        return _ok({
            "transactions": result.get("transactions", []),
            "count": result.get("count", 0),
        })
    except ServiceCallError as e:
        return _err(e)
    except Exception as e:
        return _err(e)


def set_config(args: str) -> str:
    """Update extension configuration. Synchronous, so it may write."""
    try:
        params = json.loads(args) if args else {}
    except Exception:
        return _err("Invalid JSON arguments")

    url = str(params.get(BILLING_URL_KEY, "")).strip()
    if not url:
        return _err("No valid configuration keys provided")

    try:
        _set_cfg(BILLING_URL_KEY, url)
    except Exception as e:
        return _err(e)
    return _ok({"updated": {BILLING_URL_KEY: url}})
