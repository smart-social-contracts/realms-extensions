"""Reference implementation of a sandboxable extension backend.

Runs in a subinterpreter, so the importable set is exactly CPython's
frozen/builtin modules — ``json`` is not among them. Everything here therefore
uses plain string handling. An extension that needs ``json``, ``ggg`` or
``core`` cannot spawn and must declare ``"runtime": "in_process"`` instead;
there is no fallback that would run it privileged.
"""


def _extract(args: str, key: str) -> str:
    """Read one top-level string value out of a flat JSON object."""
    marker = '"%s"' % key
    start = args.find(marker)
    if start < 0:
        return ""
    colon = args.find(":", start + len(marker))
    if colon < 0:
        return ""
    open_quote = args.find('"', colon)
    if open_quote < 0:
        return ""
    close_quote = args.find('"', open_quote + 1)
    if close_quote < 0:
        return ""
    return args[open_quote + 1 : close_quote]


def _quote(value: str) -> str:
    return '"%s"' % value.replace("\\", "\\\\").replace('"', '\\"')


def greet(args: str) -> str:
    """Return a hello world greeting for the given name.

    Args:
        args: JSON string, e.g. '{"name": "Alice"}'.

    Returns:
        JSON string with the greeting, e.g. '"Hello, Alice!"'.
    """
    name = _extract(args or "", "name").strip() or "World"
    return _quote("Hello, %s!" % name)
