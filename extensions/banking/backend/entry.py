"""Banking's backend: the only way its screen reaches the realm. The realm runs it as the member who calls it, in a
sandbox that lets it call only the operations the manifest declares, and only as that member allows (the treasury's
staff: the realm refuses everyone else). The screen's ``read(name, args)`` runs a function as a query, its
``run(name, args)`` as an update.

The reads are the realm operations by their own names. The writes are Banking's own, so that what the realm records
holds together whatever the screen does:

- ``commit_order`` stores an order and sends its dispatch to the bank in one call, the dispatch naming the file's
  sha256 from the order's own facts: an order is never stored without its commitment, nor committed without its record;
- ``download_allowed`` is what the host asks before a file leaves the frame (capability ``download``): a payment file
  is handed out only once a dispatch to the bank names its sha256;
- ``save_register`` and ``import_statement`` store the register and the bank's files, each of its own kind only.

A function that fails after it changed the realm traps, and the realm undoes the whole call.
"""

BANK = "bank"
KINDS = {"register": "banking.register", "order": "banking.order", "statement": "banking.statement"}
# What a stored document carries: the fields of ``document_store`` the screen may set.
DOCUMENT_FIELDS = ("department", "document", "title", "languages", "kind", "ref", "hash", "keys", "facts")


# --- the reads: the realm's operations, as the member --------------------------------------------------------------


def me(**args):
    return rpc("me", **args)


def department_chart(**args):
    return rpc("department_chart", **args)


def document_list(**args):
    return rpc("document_list", **args)


def document_get(**args):
    return rpc("document_get", **args)


def dispatch_list(**args):
    return rpc("dispatch_list", **args)


def external_list(**args):
    return rpc("external_list", **args)


# --- the writes ----------------------------------------------------------------------------------------------------


def _done(reply, what):
    """``reply`` when the realm did ``what``; otherwise raise, which undoes what this call already did."""
    if not isinstance(reply, dict) or not reply.get("ok"):
        error = reply.get("error") if isinstance(reply, dict) else reply
        raise RuntimeError(what + ": " + str(error))
    return reply


def _document(args, kind):
    fields = {k: args[k] for k in DOCUMENT_FIELDS if k in args}
    if fields.get("kind") != kind:
        raise ValueError("this function stores " + kind + " documents only")
    if not str(fields.get("ref", "")).startswith("inline:") or not fields.get("keys"):
        raise ValueError("a Banking document is stored sealed, with the keys of who may open it")
    return fields


def save_register(**args):
    """Store the bank register (sealed for the treasury's staff), or its new version."""
    reply = rpc("document_store", **_document(args, KINDS["register"]))
    return {"ok": True, "document": _done(reply, "document_store")["document"]}


def _order_title(facts):
    what = "Direct debit collection" if facts.get("kind") == "collection" else "Payment order"
    return what + " " + str(facts["message_id"]) + " sha256:" + str(facts["file_sha256"])


def commit_order(**args):
    """Store a payment or collection order and commit its file for the bank, in one call: the sealed file, with its
    sha256 and every line in the facts, then a dispatch to the bank that names the document and the file's sha256."""
    fields = _document(args, KINDS["order"])
    facts = fields.get("facts") or {}
    sha = str(facts.get("file_sha256", ""))
    if len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha) or not facts.get("message_id"):
        raise ValueError("an order's facts carry its message_id and the file's sha256")
    document = _done(rpc("document_store", **fields), "document_store")["document"]
    sent = _done(rpc("notification_send", recipient="External:" + BANK, topic=KINDS["order"],
                     title=_order_title(facts), body=document), "notification_send")
    return {"ok": True, "document": document, "dispatch": sent.get("dispatch")}


def import_statement(document, reports, topic=KINDS["statement"]):
    """Store an imported bank file (a camt statement or a pain.002 status report, sealed with its matches) and report
    each statement in it to the realm, in one call."""
    if topic not in (KINDS["statement"], "banking.status"):
        raise ValueError("a bank file is reported as " + KINDS["statement"] + " or banking.status")
    stored = _done(rpc("document_store", **_document(document, KINDS["statement"])), "document_store")["document"]
    for report in reports:
        _done(rpc("external_report", external=BANK, topic=topic, body=report, evidence_ref=stored), "external_report")
    return {"ok": True, "document": stored}


def dispatch_confirm(dispatch, outcome):
    """The bank's answer to an order: confirmed with its receipt, or failed with the reason."""
    return rpc("dispatch_confirm", dispatch=dispatch, outcome=outcome)


def register_bank(name):
    """Register the bank as an outside body with a manual channel (a realm-wide change: it may become a proposal)."""
    return rpc("external_add", external=BANK, name=name, kind="bank", channel="manual")


# --- what the host asks before a file leaves -----------------------------------------------------------------------


def download_allowed(name, sha256, size):
    """Whether the member may save this file: a payment file leaves only once a dispatch to the bank names its sha256,
    that is once ``commit_order`` recorded it."""
    mark = "sha256:" + str(sha256)
    start = 1
    while start:
        page = rpc("dispatch_list", to=BANK, **{"from": start, "count": 500})
        if not page.get("ok"):
            return {"ok": True, "allowed": False, "reason": "the realm refused the bank's outbox: " + str(page.get("error"))}
        for d in page.get("dispatches", []):
            if d.get("topic") == KINDS["order"] and str(d.get("title", "")).endswith(mark):
                return {"ok": True, "allowed": True}
        start = page.get("next")
    return {"ok": True, "allowed": False, "reason": "no order committed for the bank has this file's sha256"}
