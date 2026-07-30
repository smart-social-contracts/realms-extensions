"""Smoke-test extension, sandboxed.

Kept deliberately minimal: it is the thing you call to confirm the extension
call path itself works, so it should fail only when that path is broken.

dfx canister call realm_backend extension_sync_call '(
  "test_bench", "get_data", "{\"some_param\": false}"
)'
"""

import json

from ggg_sdk import ctx


def get_data(args: str) -> str:
    """Echo the received args back, proving the call path end to end.

    Returns the same ``{"data": ...}`` shape as before the sandbox port —
    basilisk ``Record`` instances were plain dicts on the wire, so callers see
    no difference.
    """
    ctx.log(f"get_data received: {args!r}")
    return json.dumps({"data": f"some data {args}"})
