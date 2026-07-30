"""Realm context provider for the AI assistant, sandboxed.

Supplies the LLM with realm state. That makes the boundary here worth being
explicit about: whatever this returns can end up in a prompt sent to a remote
service, so it exposes only what the *calling* member is already entitled to
see, obtained through the bridge under declared capabilities rather than read
directly out of the host.
"""

import json

from ggg_sdk import ctx


def get_config(args: str = "") -> str:
    """Report that the assistant extension is available."""
    return json.dumps({"response": "AI assistance extension is ready"})


def get_realm_data(args: str = "") -> str:
    """Collect realm context for the LLM to reason over.

    Returns ``{"json", "principal_id", "timestamp"}``, where ``json`` is a
    nested JSON document of realm state scoped to the caller.

        dfx canister call realm_backend extension_sync_call \\
          '("llm_chat", "get_realm_data", "{}")' --output=json \\
          | jq -r '.response' | jq -r '.json' | jq .
    """
    caller = ctx.caller()
    timestamp = ctx.now()

    try:
        combined = {
            "caller": {
                "id": caller.get("id"),
                "name": caller.get("name"),
                "registered": caller.get("registered"),
            },
            "schema": ctx.entities.erd(),
        }
        return json.dumps({
            "json": json.dumps(combined),
            "principal_id": caller.get("id", ""),
            "timestamp": timestamp,
        })
    except Exception as e:
        ctx.log(f"Error collecting realm data: {e}")
        return json.dumps({
            "json": "{}",
            "principal_id": caller.get("id", ""),
            "timestamp": timestamp,
        })
