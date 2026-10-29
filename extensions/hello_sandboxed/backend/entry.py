"""Reference sandboxed backend.

It runs in a subinterpreter with CPython builtins only (no ``json``, no third-party
imports). Each public function takes keyword arguments and returns plain data.
``rpc(op, **args)`` calls one of the manifest's ``operations`` as the calling user
and returns its reply: ``{"ok": True, ...}`` or ``{"ok": False, "error": ...}``.
"""


def greet(name="World"):
    """Greet ``name`` in the realm's name, called from the frontend with
    ``client.callExtension('greet', { name })``."""
    realm = rpc("realm_info")["realm"]
    return f"Hello, {name}! Welcome to {realm['name']}."
