"""Smoke-test extension, sandboxed.

Kept deliberately minimal: it is the thing you call to confirm the extension
call path itself works, so it should fail only when that path is broken.

dfx canister call realm_backend run '(
  "extension_call", "{\"extension\": \"test_bench\", \"function\": \"get_data\", \"args\": {\"some_param\": false}}"
)'
"""


def get_data(**args):
    """Echo the received args back, proving the call path end to end."""
    return {"data": f"some data {args}"}
