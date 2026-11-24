"""tax_manager's backend: the only way its screen reaches the realm. The realm runs it as the member who calls it, in a
sandbox that lets it call only the operations the manifest declares. Each function below is one of them, by the same
name: the screen's ``read(name, args)`` runs a read one as a query, free; its ``run(name, args)`` runs one that changes
the realm, which waits for the operation (it may call other canisters) and returns its reply.

Written by realms-gos scripts/extension_backend.py from the manifest; functions of the extension's own go below them.
"""


def tax_policy_view(**args):
    return rpc("tax_policy_view", **args)


def me(**args):
    return rpc("me", **args)


def department_list(**args):
    return rpc("department_list", **args)


def department_get(**args):
    return rpc("department_get", **args)


def tax_policy_draft(**args):
    return (yield wait("tax_policy_draft", **args))


def tax_policy_propose(**args):
    return (yield wait("tax_policy_propose", **args))


def tax_assess(**args):
    return (yield wait("tax_assess", **args))


def tax_declare(**args):
    return (yield wait("tax_declare", **args))
