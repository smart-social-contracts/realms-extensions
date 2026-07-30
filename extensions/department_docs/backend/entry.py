"""
Department Documents Extension Backend

Encrypted documents shared with a department. The ciphertext is an opaque
AES-GCM blob; who can decrypt it is governed by ``KeyEnvelope`` records at scope
``dept:<department>:doc:<id>``, granted and revoked through the realm's generic
crypto endpoints. All crypto happens in the browser — the canister never sees
plaintext, a DEK, or a vetKey.

Runs sandboxed. Access decisions live in ``core.dept_docs_bridge``, not here:
whether a caller may read a department's documents, and whether they may create,
edit or delete one, is exactly the kind of question an extension should not be
answering about itself. This module chooses what to ask for and how to shape the
reply.

API:
  - list_departments        : departments the caller can view, with members
  - create_document         : create an (empty) doc; returns id + scope
  - set_document_ciphertext : attach the encrypted blob after client encryption
  - list_documents          : documents in departments the caller can view
  - get_document            : a single document incl. ciphertext (for decryption)
  - delete_document         : remove a document (manager only)
"""

import json

from ggg_sdk import ctx


def _parse_args(args):
    if isinstance(args, dict):
        return args
    if isinstance(args, str) and args.strip():
        try:
            return json.loads(args)
        except Exception:
            return {}
    return {}


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(msg):
    return json.dumps({"success": False, "error": str(msg)})


def list_departments(args=None) -> str:
    """Departments the caller can view, with their member principals.

    Managers need the member list to choose recipients when sharing a document;
    members see it for their own department.
    """
    try:
        return _ok({"departments": ctx.departments()})
    except Exception as e:
        return _err(e)


def create_document(args) -> str:
    """Create an empty document for a department; return its id and scope.

    Two-step by design: the scope embeds the new id, so the client encrypts and
    calls ``set_document_ciphertext`` once it knows the scope.
    """
    a = _parse_args(args)
    department = (a.get("department") or "").strip()
    title = (a.get("title") or "").strip()
    if not department:
        return _err("department is required")
    if not title:
        return _err("title is required")

    try:
        return _ok(ctx.dept_docs.create(department, title))
    except Exception as e:
        return _err(e)


def set_document_ciphertext(args) -> str:
    """Attach (or replace) the encrypted blob for a document."""
    a = _parse_args(args)
    doc_id = a.get("id")
    if doc_id is None:
        return _err("id is required")

    try:
        return _ok(ctx.dept_docs.set_ciphertext(doc_id, a.get("ciphertext") or ""))
    except Exception as e:
        return _err(e)


def list_documents(args=None) -> str:
    """List documents (metadata only) in departments the caller can view."""
    a = _parse_args(args)
    try:
        return _ok(ctx.dept_docs.list((a.get("department") or "").strip()))
    except Exception as e:
        return _err(e)


def get_document(args) -> str:
    """Return a single document including its ciphertext (for decryption).

    Returning the ciphertext to any department member is safe — it is AES-GCM
    encrypted and only decryptable by principals holding a KeyEnvelope.
    """
    a = _parse_args(args)
    doc_id = a.get("id")
    if doc_id is None:
        return _err("id is required")

    try:
        return _ok(ctx.dept_docs.get(doc_id))
    except Exception as e:
        return _err(e)


def delete_document(args) -> str:
    """Delete a document (department head or realm admin only).

    Orphaned KeyEnvelopes for the scope are harmless — they wrap a DEK for data
    that no longer exists — and the returned scope lets a manager revoke them
    via the realm's ``crypto_revoke_from_scope_batch`` endpoint.
    """
    a = _parse_args(args)
    doc_id = a.get("id")
    if doc_id is None:
        return _err("id is required")

    try:
        return _ok(ctx.dept_docs.delete(doc_id))
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "list_departments": list_departments,
    "create_document": create_document,
    "set_document_ciphertext": set_document_ciphertext,
    "list_documents": list_documents,
    "get_document": get_document,
    "delete_document": delete_document,
}


def extension_sync_call(method_name: str, args: dict):
    """Synchronous extension API dispatch."""
    if method_name not in EXTENSION_FUNCTIONS:
        return _err(f"Unknown method: {method_name}")
    return EXTENSION_FUNCTIONS[method_name](args)
