"""Leftover-safe access to host ``core.proposal_dispatch``.

Live leftover pins expose ``core.proposal_dispatch`` but do not export
``freeze_action`` (``ImportError: cannot import name 'freeze_action' from
'core.proposal_dispatch' (unknown location)``). A name-import of that symbol
aborts every submit, including polls whose frozen action is empty.

Never ``from core.proposal_dispatch import freeze_action``. Resolve helpers
with ``getattr``. When the host name is missing, freeze a poll locally and
refuse other types with a visible error.
"""

from typing import Any, Dict, List, Optional, Tuple

_FORBIDDEN_SUBMIT_KEYS = ("code_inline", "codices", "codex_name")


def _dispatch_module():
    try:
        from core import proposal_dispatch

        return proposal_dispatch
    except Exception:
        return None


def _dispatch_attr(name: str):
    mod = _dispatch_module()
    if mod is None:
        return None
    try:
        return getattr(mod, name, None)
    except Exception:
        return None


def submit_gate(proposal_type: str, action: dict) -> str:
    fn = _dispatch_attr("submit_gate")
    if fn:
        return fn(proposal_type, action)
    if proposal_type == "transaction":
        return "transfer.create"
    if proposal_type == "upgrade":
        target = (action or {}).get("target")
        if target == "codex":
            return "codex.install"
        if target == "codex_revert":
            return "codex.revert"
        if target == "extension":
            return "extension.install"
        if target == "core":
            return "orchestration.approve"
        return "extension.install"
    return "proposal.create"


def reject_forbidden_submit_keys(args: dict) -> Optional[dict]:
    fn = _dispatch_attr("reject_forbidden_submit_keys")
    if fn:
        return fn(args)
    for key in _FORBIDDEN_SUBMIT_KEYS:
        if key in args and args[key] not in (None, "", [], {}):
            return {
                "error": f"{key} is not accepted",
                "error_code": "forbidden_field",
            }
    return None


def freeze_action(
    proposal_type: str,
    raw_action: Any,
    *,
    source: str = "",
    source_url: str = "",
    requested_permissions: Any = None,
    proposal_id: str = "",
) -> Tuple[dict, List[str], Optional[dict]]:
    fn = _dispatch_attr("freeze_action")
    if fn:
        return fn(
            proposal_type,
            raw_action,
            source=source,
            source_url=source_url,
            requested_permissions=requested_permissions,
            proposal_id=proposal_id,
        )
    if proposal_type == "poll":
        return {}, [], None
    return {}, [], {
        "error": (
            f"This realm host does not export freeze_action; "
            f"{proposal_type} proposals cannot be submitted until the host is updated"
        ),
        "error_code": "host_dispatch_unavailable",
    }


def persist_code_execution_source(
    proposal_id: str,
    source: str,
    source_url: str = "",
):
    fn = _dispatch_attr("persist_code_execution_source")
    if fn:
        return fn(proposal_id, source, source_url)
    raise RuntimeError(
        "host persist_code_execution_source is unavailable on this realm pin"
    )
