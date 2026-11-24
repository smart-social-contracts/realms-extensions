"""member_dashboard's backend: the only way its screen reaches the realm. The realm runs it as the member who calls it, in a
sandbox that lets it call only the operations the manifest declares. Each function below is one of them, by the same
name: the screen's ``read(name, args)`` runs a read one as a query, free; its ``run(name, args)`` runs one that changes
the realm, which waits for the operation (it may call other canisters) and returns its reply.

Written by realms-gos scripts/extension_backend.py from the manifest; functions of the extension's own go below them.
"""


def me(**args):
    return rpc("me", **args)


def my_invoices(**args):
    return rpc("my_invoices", **args)


def invoice_check(**args):
    return (yield wait("invoice_check", **args))


def notification_list(**args):
    return rpc("notification_list", **args)


def notification_read(**args):
    return (yield wait("notification_read", **args))


def extension_list(**args):
    return rpc("extension_list", **args)


def token_catalog(**args):
    return rpc("token_catalog", **args)
