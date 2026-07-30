"""Procurement extension — RFP tendering with sealed bids.

Runs sandboxed. The lifecycle, the four roles, the seal rules and the scoring
arithmetic are all host-side in ``core.procurement``, reached through
``ctx.procurement.*``; what is left here is parsing arguments off the wire and
shaping the JSON that goes back.

Bids are sealed with vetKeys: the canister stores an opaque blob and a key scope,
and the host decides who may read the blob. While an RFP is open, that is the
bidder and nobody else — not the requester, not an admin. This module could not
change that if it tried, which is the point of the port.
"""

import json

from ggg_sdk import ctx

# Keys the caller may edit on a draft. Only those actually present in the request
# are forwarded, because the host reads an absent key as "leave it alone".
EDITABLE = ("title", "description", "opens_at", "closes_at", "rubric_json")


def _parse_args(args) -> dict:
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _ok(data: dict) -> str:
    return json.dumps({"success": True, **data})


def _err(message: str) -> str:
    return json.dumps({"success": False, "error": message})


def _handle(fn):
    """Turn a host refusal into ``{"success": false, "error": ...}``.

    The frontend has always read that shape, and a refused verb is a normal
    answer here — an evaluator who is not an approver clicking award is a UI
    state, not a fault.
    """

    def wrapper(args: str) -> str:
        try:
            return fn(args)
        except Exception as e:
            return _err(str(e))

    wrapper.__name__ = fn.__name__
    return wrapper


def _text(params: dict, key: str) -> str:
    return str(params.get(key, "") or "").strip()


# ---------------------------------------------------------------------------
# Health and roles
# ---------------------------------------------------------------------------


@_handle
def health(args: str) -> str:
    return _ok({
        "status": "ok",
        "extension": "procurement",
        "encryption_default": "vetkeys",
        "sealed_bidding": True,
    })


@_handle
def get_my_roles(args: str) -> str:
    return _ok(ctx.procurement.roles())


# ---------------------------------------------------------------------------
# RFP
# ---------------------------------------------------------------------------


@_handle
def create_rfp(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.rfp_create(
        title=_text(params, "title"),
        description=str(params.get("description", "") or ""),
        rubric_json=params.get("rubric_json", "[]"),
        opens_at=params.get("opens_at", 0),
        closes_at=params.get("closes_at", 0),
    ))


@_handle
def update_rfp(args: str) -> str:
    params = _parse_args(args)
    fields = {key: params[key] for key in EDITABLE if key in params}
    return _ok(ctx.procurement.rfp_update(_text(params, "rfp_id"), **fields))


@_handle
def publish_rfp(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.rfp_publish(_text(params, "rfp_id")))


@_handle
def get_rfp(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.rfp_get(_text(params, "rfp_id")))


@_handle
def list_rfps(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.rfp_list(status=_text(params, "status")))


@_handle
def close_rfp(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.rfp_close(_text(params, "rfp_id")))


@_handle
def get_rfp_transitions(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.transitions(_text(params, "rfp_id")))


@_handle
def demo_advance_rfp(args: str) -> str:
    """Test-mode only: advance to the next lifecycle stage (demo / QA)."""
    params = _parse_args(args)
    return _ok(ctx.procurement.demo_advance(_text(params, "rfp_id")))


# ---------------------------------------------------------------------------
# Bidding
# ---------------------------------------------------------------------------


@_handle
def create_bid_shell(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.bid_create(_text(params, "rfp_id")))


@_handle
def set_bid_payload(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.bid_set_payload(
        _text(params, "bid_id"),
        str(params.get("ciphertext", "") or ""),
        encryption_mode=_text(params, "encryption_mode"),
    ))


@_handle
def list_bids(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.bid_list(
        _text(params, "rfp_id"),
        include_payload=bool(params.get("include_payload", False)),
    ))


@_handle
def get_bid_payload(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.bid_payload(_text(params, "bid_id")))


@_handle
def get_evaluator_principals(args: str) -> str:
    return _ok(ctx.procurement.evaluators())


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------


@_handle
def submit_scores(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.scores_submit(
        _text(params, "bid_id"), params.get("scores", {})
    ))


@_handle
def compute_totals(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.totals_compute(_text(params, "rfp_id")))


@_handle
def list_scores(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.score_list(_text(params, "rfp_id")))


# ---------------------------------------------------------------------------
# Award and execution
# ---------------------------------------------------------------------------


@_handle
def award_rfp(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.award(
        _text(params, "rfp_id"), _text(params, "winning_bid_id")
    ))


@_handle
def execute_contract(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.execute(
        _text(params, "rfp_id"), note=str(params.get("note", "") or "")
    ))


# ---------------------------------------------------------------------------
# Vendor reputation
# ---------------------------------------------------------------------------


@_handle
def flag_vendor(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.vendor_flag(
        _text(params, "vendor_id"),
        _text(params, "code"),
        note=str(params.get("note", "") or ""),
        rfp_id=_text(params, "rfp_id"),
        bid_id=_text(params, "bid_id"),
    ))


@_handle
def get_vendor_record(args: str) -> str:
    params = _parse_args(args)
    return _ok(ctx.procurement.vendor_get(_text(params, "vendor_id")))


@_handle
def list_vendor_records(args: str) -> str:
    return _ok(ctx.procurement.vendor_list())


# ---------------------------------------------------------------------------
# Scheduled task
# ---------------------------------------------------------------------------


@_handle
def async_task(args: str = "{}") -> str:
    """Close RFPs whose bidding window has ended."""
    return _ok(ctx.procurement.sweep())
