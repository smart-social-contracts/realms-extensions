"""Justice Litigation extension — courts, cases, verdicts, penalties, appeals.

Runs sandboxed. The authorization model, the case lifecycle and the encrypted
litigation storage are host-side in ``core.justice``, reached through
``ctx.justice.*``; this module parses arguments off the wire and shapes the JSON
that goes back.

Privacy model, enforced by the host: a litigation is visible to its **submitter**
and the **justice department** only — the defendant is recorded but never granted
read access. The title and description are encrypted client-side into an opaque
blob; this canister never sees the plaintext, the data-encryption key, or any
vetKey.

Cross-quarter cases live on the plaintiff's quarter, with the defendant's home
canister recorded in ``defendant_quarter_id``. Acting against a remote defendant
needs an inter-canister call and is not implemented.
"""

import json

from ggg_sdk import ctx

# Only keys the caller actually sent are forwarded on an edit; the host reads an
# absent key as "leave it alone".
LITIGATION_FIELDS = (
    "court_id",
    "defendant_principal",
    "defendant_kind",
    "defendant_department",
    "defendant_department_id",
    "defendant_quarter_id",
)


def _parse_args(args) -> dict:
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _ok(data: dict) -> str:
    """The frontend reads ``{"success": true, "data": {...}}``, so the host's
    payload goes under ``data`` unchanged."""
    return json.dumps({"success": True, "data": data})


def _err(message: str) -> str:
    return json.dumps({"success": False, "error": message})


def _handle(fn):
    """Turn a host refusal into ``{"success": false, "error": ...}``.

    A refused verb is a normal answer: a member who is not a judge opening the
    verdict form is a UI state, not a fault.
    """

    def wrapper(args: str = "") -> str:
        try:
            return fn(args)
        except Exception as e:
            return _err(str(e))

    wrapper.__name__ = fn.__name__
    return wrapper


def _text(params: dict, key: str) -> str:
    return str(params.get(key, "") or "").strip()


# ---------------------------------------------------------------------------
# Standing
# ---------------------------------------------------------------------------


@_handle
def get_my_roles(args: str = "") -> str:
    return _ok(ctx.justice.roles())


@_handle
def get_justice_audience(args: str = "") -> str:
    """Principals the client must IBE-wrap a litigation's key for."""
    return _ok(ctx.justice.audience())


# ---------------------------------------------------------------------------
# Structure
# ---------------------------------------------------------------------------


@_handle
def initialize(args: str = "") -> str:
    """Post-install hook: ensure a court exists so filing never dead-ends."""
    return _ok(ctx.justice.initialize())


@_handle
def get_justice_systems(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.justice_systems(_text(params, "system_type")))


@_handle
def get_courts(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.courts(
        justice_system_id=params.get("justice_system_id"),
        status=_text(params, "status"),
        level=_text(params, "level"),
    ))


@_handle
def create_court(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.create_court(
        name=_text(params, "name"),
        description=str(params.get("description", "") or ""),
        jurisdiction=str(params.get("jurisdiction", "") or ""),
        level=_text(params, "level"),
        justice_system_id=params.get("justice_system_id"),
        parent_court_id=params.get("parent_court_id"),
    ))


@_handle
def seed_default_courts(args: str = "") -> str:
    return _ok(ctx.justice.seed_courts())


@_handle
def get_judges(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.judges(
        court_id=params.get("court_id"),
        status=_text(params, "status"),
        specialization=_text(params, "specialization"),
    ))


# ---------------------------------------------------------------------------
# Cases
# ---------------------------------------------------------------------------


@_handle
def get_cases(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.cases(
        court_id=params.get("court_id"),
        status=_text(params, "status"),
        plaintiff_id=params.get("plaintiff_id"),
        defendant_id=params.get("defendant_id"),
        user_id=params.get("user_id"),
    ))


@_handle
def get_case(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.case(_text(params, "case_id")))


@_handle
def file_case(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.file_case(
        court_id=params.get("court_id"),
        defendant_id=params.get("defendant_id"),
        title=str(params.get("title", "") or ""),
        description=str(params.get("description", "") or ""),
    ))


@_handle
def assign_judge(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.assign_judge(
        _text(params, "case_id"), _text(params, "judge_id")
    ))


# ---------------------------------------------------------------------------
# Private litigations
# ---------------------------------------------------------------------------


@_handle
def get_litigations(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.litigations(
        from_id=params.get("from_id", 1),
        page_size=params.get("page_size", 25),
    ))


@_handle
def create_litigation(args: str = "") -> str:
    params = _parse_args(args)
    fields = {key: params[key] for key in LITIGATION_FIELDS if key in params}
    if "defendant_id" in params and "defendant_principal" not in fields:
        fields["defendant_principal"] = params["defendant_id"]
    return _ok(ctx.justice.create_litigation(**fields))


@_handle
def set_litigation_content(args: str = "") -> str:
    params = _parse_args(args)
    case_id = _text(params, "case_id") or _text(params, "id")
    return _ok(ctx.justice.set_litigation_content(
        case_id, str(params.get("ciphertext", "") or "")
    ))


# ---------------------------------------------------------------------------
# Verdicts
# ---------------------------------------------------------------------------


@_handle
def get_verdicts(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.verdicts(params.get("case_id")))


@_handle
def issue_verdict(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.issue_verdict(
        case_id=_text(params, "case_id"),
        decision=str(params.get("decision", "") or ""),
        reasoning=str(params.get("reasoning", "") or ""),
        penalties=params.get("penalties", []),
    ))


# ---------------------------------------------------------------------------
# Penalties
# ---------------------------------------------------------------------------


@_handle
def get_penalties(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.penalties(
        verdict_id=params.get("verdict_id"),
        target_user_id=params.get("target_user_id"),
        status=_text(params, "status"),
    ))


@_handle
def execute_penalty(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.execute_penalty(_text(params, "penalty_id")))


@_handle
def waive_penalty(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.waive_penalty(
        _text(params, "penalty_id"), reason=str(params.get("reason", "") or "")
    ))


# ---------------------------------------------------------------------------
# Appeals
# ---------------------------------------------------------------------------


@_handle
def get_appeals(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.appeals(
        case_id=params.get("case_id"),
        appellant_id=params.get("appellant_id"),
        status=_text(params, "status"),
        court_id=params.get("court_id"),
    ))


@_handle
def file_appeal(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.file_appeal(
        case_id=_text(params, "case_id"),
        grounds=str(params.get("grounds", "") or ""),
        appellate_court_id=params.get("appellate_court_id"),
    ))


@_handle
def decide_appeal(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.decide_appeal(
        appeal_id=_text(params, "appeal_id"),
        decision=str(params.get("decision", "") or ""),
        reasoning=str(params.get("reasoning", "") or ""),
    ))


@_handle
def withdraw_appeal(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.withdraw_appeal(_text(params, "appeal_id")))


@_handle
def transfer_case(args: str = "") -> str:
    """Mark the origin docket transferred. Dest is a metadata pointer only."""
    params = _parse_args(args)
    return _ok(ctx.justice.transfer_case(
        case_id=_text(params, "case_id"),
        dest=params.get("dest"),
    ))


@_handle
def begin_executing(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.begin_executing(_text(params, "case_id")))


@_handle
def close_case(args: str = "") -> str:
    params = _parse_args(args)
    return _ok(ctx.justice.close_case(_text(params, "case_id")))


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------


@_handle
def get_statistics(args: str = "") -> str:
    return _ok(ctx.justice.statistics())
