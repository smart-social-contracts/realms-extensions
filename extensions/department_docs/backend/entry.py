"""
Department Documents Extension Backend

A worked example of the *generic* encrypted-sharing layer applied to a payload
other than personal data: encrypted documents shared with a department.

The ciphertext is stored opaque on a ``DepartmentDocument`` entity; read access
is governed by ``KeyEnvelope`` records at scope ``dept:<department>:doc:<id>``,
which the pluggable policy in ``core.crypto_scopes`` lets the department head
(or a realm admin) manage. This backend only stores/serves metadata + ciphertext
and enforces who may create/read/delete; all crypto happens in the browser via
the host's ``ctx.crypto`` helpers, and grant/revoke goes through the realm's
generic ``crypto_grant_to_scope_batch`` endpoint.

API:
  - list_departments        : departments the caller can view, with members
  - create_document         : create an (empty) doc; returns id + scope
  - set_document_ciphertext : attach the encrypted blob after client encryption
  - list_documents          : documents in departments the caller can view
  - get_document            : a single document incl. ciphertext (for decryption)
  - delete_document         : remove a document (manager only)
"""

import json
import traceback

from ggg import Department
from ic_python_db import String
from ic_python_logging import get_logger
from core.extensions import create_extension_entity_class

try:
    from _cdk import ic as _ic
except ImportError:
    _ic = None

logger = get_logger("extensions.department_docs")

# This extension owns its encrypted-document entity (no host ggg edit needed).
ExtensionEntity = create_extension_entity_class("department_docs")


class DepartmentDocument(ExtensionEntity):
    """An encrypted document shared with a department.

    Stored namespaced as ``ext_department_docs::DepartmentDocument``. The
    ``ciphertext`` is opaque to the canister (AES-GCM under a per-document DEK);
    read access is governed by KeyEnvelope records at scope
    ``dept:<department>:doc:<id>``, which the host's built-in ``dept:`` scope
    policy lets the department head (or a realm admin) manage. The canister
    never sees the plaintext, the DEK, or any vetKey.
    """

    department = String(max_length=256)
    title = String(max_length=512)
    ciphertext = String()  # enc:v=2:... AES-GCM blob (may be empty until set)
    scope = String(max_length=512)  # dept:<department>:doc:<id>
    created_by = String(max_length=128)  # author principal


def register_entities():
    """Register this extension's entity types (called by the host at init)."""
    from ic_python_db import Database

    Database.get_instance().register_entity_type(DepartmentDocument)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_args(args):
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _caller_principal() -> str:
    if _ic is not None:
        try:
            return _ic.caller().to_str()
        except Exception:
            pass
    return ""


def _auth_ctx():
    # Reuse the realm's scope-authorization context (admin / department head).
    from core.crypto_scopes import production_context

    return production_context()


def _can_manage_department(department: str, caller: str) -> bool:
    ctx = _auth_ctx()
    return ctx.is_realm_admin(caller) or ctx.is_department_head(department, caller)


def _department_member_principals(department: str) -> list[str]:
    try:
        from core.membership import department_member_principals

        dept = Department[department]
        if not dept:
            return []
        return department_member_principals(dept, include_head=True)
    except Exception as e:
        logger.warning(f"_department_member_principals({department}): {e}")
        return []


def _is_department_member(department: str, caller: str) -> bool:
    """Forward membership check — cheap, no user scan (issue #242)."""
    try:
        from core.membership import user_in_department
        from ggg import User

        dept = Department[department]
        if not dept:
            return False
        head = getattr(dept, "head", None)
        if head is not None and getattr(head, "id", None) == caller:
            return True
        return user_in_department(User[caller], dept)
    except Exception:
        return caller in _department_member_principals(department)


def _can_view_department(department: str, caller: str) -> bool:
    return _can_manage_department(department, caller) or _is_department_member(
        department, caller
    )


def _doc_to_dict(doc, caller: str, *, include_ciphertext: bool = False) -> dict:
    out = {
        "id": doc._id,
        "title": getattr(doc, "title", "") or "",
        "department": getattr(doc, "department", "") or "",
        "scope": getattr(doc, "scope", "") or "",
        "created_by": getattr(doc, "created_by", "") or "",
        "created_at": getattr(doc, "timestamp_created", "") or "",
        "can_manage": _can_manage_department(getattr(doc, "department", "") or "", caller),
    }
    if include_ciphertext:
        out["ciphertext"] = getattr(doc, "ciphertext", "") or ""
    return out


# ---------------------------------------------------------------------------
# API functions
# ---------------------------------------------------------------------------

def list_departments(args=None) -> str:
    """Departments the caller can view, with their member principals.

    Managers (head/admin) need the member list to choose recipients when
    sharing a document; members see it too (it's their own department).
    """
    try:
        caller = _caller_principal()
        result = []
        for dept in Department.instances():
            name = getattr(dept, "name", "") or ""
            if not name or not _can_view_department(name, caller):
                continue
            result.append(
                {
                    "name": name,
                    "description": getattr(dept, "description", "") or "",
                    "can_manage": _can_manage_department(name, caller),
                    "members": _department_member_principals(name),
                }
            )
        return json.dumps({"success": True, "data": {"departments": result}})
    except Exception as e:
        logger.error(f"list_departments error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def create_document(args) -> str:
    """Create an empty document for a department; return its id and scope.

    Two-step by design: the scope embeds the new id, so the client encrypts and
    calls ``set_document_ciphertext`` once it knows the scope.
    """
    try:
        a = _parse_args(args)
        department = (a.get("department") or "").strip()
        title = (a.get("title") or "").strip()
        if not department:
            return json.dumps({"success": False, "error": "department is required"})
        if not title:
            return json.dumps({"success": False, "error": "title is required"})

        caller = _caller_principal()
        if not _can_manage_department(department, caller):
            return json.dumps(
                {"success": False, "error": "Only the department head or an admin may create documents"}
            )

        dept = Department[department]
        if not dept:
            return json.dumps({"success": False, "error": f"Department '{department}' not found"})

        doc = DepartmentDocument(
            department=department,
            title=title,
            ciphertext="",
            scope="",
            created_by=caller,
        )
        scope = f"dept:{department}:doc:{doc._id}"
        doc.scope = scope

        logger.info(f"Created department document {doc._id} in {department} by {caller}")
        return json.dumps({"success": True, "data": {"id": doc._id, "scope": scope}})
    except Exception as e:
        logger.error(f"create_document error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def set_document_ciphertext(args) -> str:
    """Attach (or replace) the encrypted blob for a document."""
    try:
        a = _parse_args(args)
        doc_id = a.get("id")
        ciphertext = a.get("ciphertext") or ""
        if doc_id is None:
            return json.dumps({"success": False, "error": "id is required"})

        doc = DepartmentDocument[doc_id]
        if not doc:
            return json.dumps({"success": False, "error": f"Document '{doc_id}' not found"})

        caller = _caller_principal()
        if not _can_manage_department(getattr(doc, "department", "") or "", caller):
            return json.dumps({"success": False, "error": "Not allowed to edit this document"})

        doc.ciphertext = ciphertext
        return json.dumps({"success": True, "data": {"id": doc._id}})
    except Exception as e:
        logger.error(f"set_document_ciphertext error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def list_documents(args=None) -> str:
    """List documents (metadata only) in departments the caller can view."""
    try:
        a = _parse_args(args)
        department_filter = (a.get("department") or "").strip()
        caller = _caller_principal()

        docs = []
        for doc in DepartmentDocument.instances():
            dept = getattr(doc, "department", "") or ""
            if department_filter and dept != department_filter:
                continue
            if not _can_view_department(dept, caller):
                continue
            docs.append(_doc_to_dict(doc, caller))

        docs.sort(key=lambda d: str(d.get("created_at", "")), reverse=True)
        return json.dumps({"success": True, "data": {"documents": docs, "total": len(docs)}})
    except Exception as e:
        logger.error(f"list_documents error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_document(args) -> str:
    """Return a single document including its ciphertext (for decryption).

    Returning the ciphertext to any department member is safe — it is AES-GCM
    encrypted and only decryptable by principals holding a KeyEnvelope.
    """
    try:
        a = _parse_args(args)
        doc_id = a.get("id")
        if doc_id is None:
            return json.dumps({"success": False, "error": "id is required"})

        doc = DepartmentDocument[doc_id]
        if not doc:
            return json.dumps({"success": False, "error": f"Document '{doc_id}' not found"})

        caller = _caller_principal()
        if not _can_view_department(getattr(doc, "department", "") or "", caller):
            return json.dumps({"success": False, "error": "Not allowed to view this document"})

        return json.dumps(
            {"success": True, "data": _doc_to_dict(doc, caller, include_ciphertext=True)}
        )
    except Exception as e:
        logger.error(f"get_document error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def delete_document(args) -> str:
    """Delete a document (department head or realm admin only).

    Note: orphaned KeyEnvelopes for the scope are harmless (they wrap a DEK for
    data that no longer exists); a manager can also revoke them via the realm's
    ``crypto_revoke_from_scope_batch`` endpoint.
    """
    try:
        a = _parse_args(args)
        doc_id = a.get("id")
        if doc_id is None:
            return json.dumps({"success": False, "error": "id is required"})

        doc = DepartmentDocument[doc_id]
        if not doc:
            return json.dumps({"success": False, "error": f"Document '{doc_id}' not found"})

        caller = _caller_principal()
        if not _can_manage_department(getattr(doc, "department", "") or "", caller):
            return json.dumps({"success": False, "error": "Not allowed to delete this document"})

        scope = getattr(doc, "scope", "") or ""
        doc.delete()
        return json.dumps({"success": True, "data": {"id": doc_id, "scope": scope}})
    except Exception as e:
        logger.error(f"delete_document error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Extension API registry
# ---------------------------------------------------------------------------

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
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})
    return EXTENSION_FUNCTIONS[method_name](args)
