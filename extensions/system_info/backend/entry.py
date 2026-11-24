"""system_info's backend: the only way its screen reaches the realm. The realm runs it as the member who calls it, in a
sandbox that lets it call only the operations the manifest declares. Each function below is one of them, by the same
name: the screen's ``read(name, args)`` runs a read one as a query, free; its ``run(name, args)`` runs one that changes
the realm, which waits for the operation (it may call other canisters) and returns its reply.

Written by realms-gos scripts/extension_backend.py from the manifest; functions of the extension's own go below them.
"""


def status(**args):
    return rpc("status", **args)


def realm_monitor(**args):
    return rpc("realm_monitor", **args)


def extension_list(**args):
    return rpc("extension_list", **args)


def codex_status(**args):
    return rpc("codex_status", **args)


def quarter_directory(**args):
    return rpc("quarter_directory", **args)


def scale_status(**args):
    return rpc("scale_status", **args)
