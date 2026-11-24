"""vault's backend: the only way its screen reaches the realm. The realm runs it as the member who calls it, in a
sandbox that lets it call only the operations the manifest declares. Each function below is one of them, by the same
name: the screen's ``read(name, args)`` runs a read one as a query, free; its ``run(name, args)`` runs one that changes
the realm, which waits for the operation (it may call other canisters) and returns its reply.

Written by realms-gos scripts/extension_backend.py from the manifest; functions of the extension's own go below them.
"""


def me(**args):
    return rpc("me", **args)


def status(**args):
    return rpc("status", **args)


def token_catalog(**args):
    return rpc("token_catalog", **args)


def treasury_view(**args):
    return rpc("treasury_view", **args)


def ledger_view(**args):
    return rpc("ledger_view", **args)


def user_list(**args):
    return rpc("user_list", **args)


def transfer_create(**args):
    return (yield wait("transfer_create", **args))


def invoice_refresh(**args):
    return (yield wait("invoice_refresh", **args))
