"""
Voting Extension Backend Entry Point

Flow:
  submit_proposal (typed) → voting
  → cast_vote / finalize_proposal → accepted
  → host dispatcher (transaction / upgrade / poll / code_execution)
"""

import hashlib
import json
import traceback
from typing import Any, Dict, List

from ggg import Notification, Proposal, User, Vote, Codex
from basilisk import Async, ic
from basilisk.canisters.management import management_canister
from ic_python_logging import get_logger

logger = get_logger("extensions.voting")

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50

# Large metadata keys omitted from list responses.
_HEAVY_METADATA_KEYS = frozenset({"code_inline", "details"})

# Non-governance Proposal records created by other Agora codices.
_NON_VOTING_METADATA_TYPES = frozenset({
    "justice_case",
    "procurement_tender",
    "procurement",
    "violation_report",
    "defense_enlistment",
    "defense_mission",
    "registration",
    "warning",
})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_args(args):
    """Parse JSON string args to dict."""
    if isinstance(args, str) and args.strip():
        return json.loads(args)
    if isinstance(args, dict):
        return args
    return {}


def _proposal_created_at(proposal: Proposal):
    """Return created_at as epoch seconds without calling serialize()."""
    ts_ms = getattr(proposal, "_timestamp_created", 0) or 0
    if ts_ms:
        return ts_ms / 1000.0
    raw = getattr(proposal, "timestamp_created", "") or ""
    if raw and str(raw) not in ("None", ""):
        try:
            return float(raw)
        except (ValueError, TypeError):
            pass
    if hasattr(proposal, "serialize"):
        try:
            timestamps = proposal.serialize()
            raw_created = timestamps.get("timestamp_created", "")
            if raw_created and str(raw_created) not in ("None", ""):
                return float(raw_created)
        except Exception:
            pass
    return None


def _metadata_for_list(raw_metadata: str) -> str:
    """Strip heavy metadata fields for list responses."""
    if not raw_metadata:
        return "{}"
    try:
        meta = json.loads(raw_metadata)
    except Exception:
        return raw_metadata[:200] if len(raw_metadata) > 200 else raw_metadata
    if not isinstance(meta, dict):
        return raw_metadata
    summary = {k: v for k, v in meta.items() if k not in _HEAVY_METADATA_KEYS}
    if "codices" in meta and isinstance(meta["codices"], list):
        summary["codices"] = [
            {"name": c.get("name", ""), "url": c.get("url", "")}
            for c in meta["codices"]
            if isinstance(c, dict)
        ]
        summary["codices_count"] = len(meta["codices"])
    if "code_inline" in meta:
        summary["has_inline_code"] = True
    return json.dumps(summary)


def _is_voting_proposal(proposal: Proposal) -> bool:
    """True when the proposal belongs in the Voting extension UI."""
    if proposal.proposal_id:
        return True
    meta = _load_metadata(proposal)
    if meta.get("proposal_type"):
        return True
    meta_type = meta.get("type", "")
    if meta_type in _NON_VOTING_METADATA_TYPES:
        return False
    if meta_type:
        return True
    return False


def _proposal_to_dict(proposal: Proposal, *, summary: bool = False) -> Dict[str, Any]:
    """Convert Proposal entity to dictionary."""
    created_at = _proposal_created_at(proposal)
    deadline_str = proposal.voting_deadline or ""
    voting_deadline = None
    if deadline_str and str(deadline_str) not in ("None", ""):
        try:
            voting_deadline = float(deadline_str)
        except (ValueError, TypeError):
            voting_deadline = None
    proposal_key = proposal.proposal_id or str(getattr(proposal, "_id", "") or "")
    entity_id = int(getattr(proposal, "_id", 0) or 0)
    metadata = (
        _metadata_for_list(proposal.metadata or "{}")
        if summary
        else (proposal.metadata or "{}")
    )
    return {
        "id": proposal_key,
        "entity_id": entity_id,
        "title": proposal.title,
        "description": proposal.description,
        "code_url": proposal.code_url,
        "code_checksum": proposal.code_checksum,
        "proposer": proposal.proposer.id if proposal.proposer else "unknown",
        "status": proposal.status,
        "org_scope": _proposal_org_scope(proposal),
        "created_at": created_at,
        "voting_deadline": voting_deadline,
        "votes": {
            "yes": int(proposal.votes_yes or 0),
            "no": int(proposal.votes_no or 0),
            "abstain": int(proposal.votes_abstain or 0),
        },
        "total_voters": int(proposal.total_voters or 0),
        "required_threshold": proposal.required_threshold,
        "proposal_type": (_load_metadata(proposal).get("proposal_type") or ""),
        "metadata": metadata,
    }


def _find_proposal(proposal_id: str):
    """Find a Proposal by proposal_id alias."""
    return Proposal[proposal_id]


def _find_user(user_id: str):
    """Find a User by id alias."""
    return User[user_id]


def _check_threshold(proposal: Proposal) -> bool:
    """Check if yes votes meet the required threshold.

    Threshold is computed over decisive votes (yes + no), ignoring abstains.
    Returns True if the proposal should be auto-approved.
    """
    yes = int(proposal.votes_yes or 0)
    no = int(proposal.votes_no or 0)
    decisive = yes + no
    if decisive == 0:
        return False
    threshold = proposal.required_threshold or 0.6
    return (yes / decisive) >= threshold


def _get_governance_params(proposal: Proposal) -> dict:
    """Get governance parameters (quorum, threshold, notice) from codex policy.

    The codex hook `get_governance_params` receives the proposal_type and
    requested_permissions from the proposal metadata and returns realm-specific
    governance rigor requirements.

    Returns: {"quorum": <percent>, "threshold": <0-1>, "notice_hours": <int>}
    """
    defaults = {"quorum": 20, "threshold": 0.6, "notice_hours": 48}

    metadata = _load_metadata(proposal)
    proposal_type = metadata.get("proposal_type", "code_execution")
    requested_permissions = metadata.get("requested_permissions", [])

    try:
        from core.codex_hooks import call_role_hook

        result = call_role_hook(
            "get_governance_params",
            {
                "proposal_type": proposal_type,
                "requested_permissions": requested_permissions,
                "action": metadata.get("action") or {},
            },
            fail_closed=False,
        )
        if isinstance(result, dict):
            return {**defaults, **result}
    except Exception as e:
        logger.warning(f"Could not load governance params from codex: {e}")

    return defaults


def _proposal_org_scope(proposal: Proposal) -> str:
    """Governing org name for this proposal, or "" for realm-wide ballots.

    Prefers the first-class ``org_scope`` field (Proposal v2, indexed);
    falls back to metadata for rows written by pre-v2 extensions that have
    not been migrated yet.
    """
    scope = (getattr(proposal, "org_scope", None) or "").strip()
    if scope:
        return scope
    metadata = _load_metadata(proposal)
    return (metadata.get("org_scope") or "").strip()


def _org_scoped_department(proposal: Proposal):
    """Department governing this proposal, or None for realm-wide ballots.

    Org-scoped proposals (e.g. position changes, issue #241) are voted only
    by that department's members and tallied against its M/N/quorum/veto
    policy instead of realm-wide thresholds.
    """
    dept_name = _proposal_org_scope(proposal)
    if not dept_name:
        return None
    try:
        from ggg import Department

        return Department[dept_name]
    except Exception:
        return None


def _civil_from_epoch(seconds: int) -> str:
    """UTC calendar date for epoch *seconds*, computed arithmetically.

    The canister stdlib ``time`` module has neither ``strftime`` nor
    ``gmtime``, so the date is derived from the day count directly
    (Howard Hinnant's civil-from-days algorithm).
    """
    z = seconds // 86400 + 719468
    era = z // 146097
    doe = z - era * 146097
    yoe = (doe - doe // 1460 + doe // 36524 - doe // 146096) // 365
    year = yoe + era * 400
    doy = doe - (365 * yoe + yoe // 4 - yoe // 100)
    mp = (5 * doy + 2) // 153
    day = doy - (153 * mp + 2) // 5 + 1
    month = mp + 3 if mp < 10 else mp - 9
    if month <= 2:
        year += 1
    return "%04d-%02d-%02d" % (year, month, day)


def _format_voting_deadline(deadline_raw: str) -> str:
    """Best-effort human date from epoch seconds or ISO string."""
    if not deadline_raw:
        return "the deadline"
    text = str(deadline_raw).strip()
    if text.isdigit():
        try:
            return _civil_from_epoch(int(text))
        except (ValueError, OverflowError):
            pass
    return text[:10] if len(text) >= 10 else text


# Per-user inbox fan-out costs O(audience) entity writes inside a single
# update call — at realm scale (10k+ members) start_voting exceeded the 40B
# per-message instruction limit (found at the 10k calibration rung). Cap the
# synchronous fan-out; the proposal stays discoverable via the voting UI for
# members beyond the cap.
NOTIFY_FANOUT_LIMIT = 1000


def _notify_voting_opened(proposal: Proposal) -> None:
    """Create inbox messages for users who must cast a vote (capped fan-out)."""
    title = (proposal.title or "New proposal").strip()
    deadline_label = _format_voting_deadline(proposal.voting_deadline or "")
    scope_dept = _org_scoped_department(proposal)

    message = (
        f'Voting is open on "{title}". Cast your vote before {deadline_label}.'
    )
    metadata = json.dumps({"proposal_id": proposal.proposal_id})

    def _notify(user) -> None:
        Notification(
            topic="governance",
            title=f"Vote required: {title}",
            message=message,
            user=user,
            read=False,
            icon="vote",
            href="/extensions/voting",
            color="blue",
            metadata=metadata,
        )

    notified = 0
    capped = False
    if scope_dept is not None:
        from core.membership import department_member_principals

        recipient_ids = department_member_principals(scope_dept, include_head=False)
        audience_hint = f"members of {scope_dept.name}"
        capped = len(recipient_ids) > NOTIFY_FANOUT_LIMIT
        for principal_id in recipient_ids[:NOTIFY_FANOUT_LIMIT]:
            user = User[principal_id]
            if not user:
                continue
            _notify(user)
            notified += 1
    else:
        audience_hint = "all members"
        # Single bounded pass over the first page of users — no full
        # User.instances() materialization and no per-principal re-lookup.
        capped = User.count() > NOTIFY_FANOUT_LIMIT
        for user in User.load_some(1, NOTIFY_FANOUT_LIMIT):
            _notify(user)
            notified += 1

    logger.info(
        f"Voting notifications sent for {proposal.proposal_id} "
        f"to {notified} {audience_hint}" + (" (fan-out capped)" if capped else "")
    )


def _check_org_policy(proposal: Proposal, dept) -> tuple:
    """Tally an org-scoped proposal against the department policy.

    Returns ``(approved, vetoed, reason)``.
    """
    from core.org_policy import parse_veto_principals, policy_satisfied

    yes_voters, no_voters = set(), set()
    for v in Vote.instances():
        if not (v.proposal and v.voter):
            continue
        if v.proposal.proposal_id != proposal.proposal_id:
            continue
        if v.vote_choice == "yes":
            yes_voters.add(v.voter.id)
        elif v.vote_choice == "no":
            no_voters.add(v.voter.id)

    from core.membership import department_member_principals

    eligible = set(department_member_principals(dept, include_head=False))
    veto_principals = parse_veto_principals(getattr(dept, "policy_veto_principals", ""))

    ok, reason = policy_satisfied(
        approvals=yes_voters,
        vetoes=no_voters,
        eligible=eligible,
        threshold_m=int(getattr(dept, "policy_threshold_m", 1) or 1),
        threshold_n=int(getattr(dept, "policy_threshold_n", 1) or 1),
        quorum_percent=int(getattr(dept, "policy_quorum_percent", 0) or 0),
        veto_principals=veto_principals,
    )
    vetoed = (not ok) and reason.startswith("vetoed")
    return ok, vetoed, reason


def _check_threshold_and_quorum(proposal: Proposal) -> bool:
    """Check if both threshold and quorum are met for auto-approval.

    Unlike _check_threshold alone, this enforces that enough members
    have participated before auto-approving a proposal.
    """
    if not _check_threshold(proposal):
        return False

    # Quorum enforcement: ensure enough members voted
    governance = _get_governance_params(proposal)
    quorum_percent = governance.get("quorum", 20)

    # O(1) counter read — User.instances() loads every entity (O(max_id)),
    # which at realm scale blows the per-message instruction limit on every
    # vote tally check.
    active_members = User.count()
    if active_members <= 0:
        return False

    total_voters = int(proposal.total_voters or 0)
    actual_participation = (total_voters / active_members) * 100

    if actual_participation < quorum_percent:
        logger.info(
            f"Proposal {proposal.proposal_id}: threshold met but quorum not met "
            f"({actual_participation:.1f}% < {quorum_percent}% required, "
            f"{total_voters}/{active_members} members voted)"
        )
        return False

    return True


def _get_min_threshold(proposal: Proposal) -> float:
    """Get the minimum threshold floor from codex governance policy.

    Prevents proposers from setting arbitrarily low thresholds.
    """
    governance = _get_governance_params(proposal)
    return governance.get("threshold", 0.6)


def _http_download(url: str, max_bytes: int = 2_000_000, cycles: int = 30_000_000_000):
    """Generator: download a URL via IC HTTP outcall. Yields a _ServiceCall.

    Returns the response body as a string on success, raises on failure.
    """
    resp = yield management_canister.http_request({
        "url": url,
        "max_response_bytes": max_bytes,
        "method": {"get": None},
        "headers": [
            {"name": "User-Agent", "value": "Basilisk/1.0"},
            {"name": "Accept-Encoding", "value": "identity"},
        ],
        "body": None,
        "transform": {
            "function": (ic.id(), "http_transform"),
            "context": bytes(),
        },
    }).with_cycles(cycles)

    if "Ok" in resp:
        body = resp["Ok"]["body"]
        if isinstance(body, bytes):
            return body.decode("utf-8")
        return body
    else:
        raise RuntimeError(f"HTTP download failed: {resp}")


def _schedule_execution(proposal_id: str):
    """Compare-and-set accepted → executing, then timer-drive the dispatcher."""
    from core.proposal_dispatch import uses_timelock

    proposal = _find_proposal(proposal_id)
    if not proposal:
        return
    if proposal.status != "accepted":
        logger.info(
            f"Skip schedule for {proposal_id}: status is {proposal.status}"
        )
        return
    metadata = _load_metadata(proposal)
    if metadata.get("defer_execution"):
        logger.info(
            f"Skipping execution timer for proposal {proposal_id} "
            f"(defer_execution — federal driver will execute)"
        )
        return

    ptype = metadata.get("proposal_type") or ""
    action = metadata.get("action") if isinstance(metadata.get("action"), dict) else {}
    if ptype == "poll":
        proposal.status = "executed"
        logger.info(f"Poll {proposal_id} closed as executed")
        return

    proposal.status = "executing"
    delay = 0
    if uses_timelock(ptype, action):
        hours = int(_get_governance_params(proposal).get("notice_hours") or 0)
        delay = max(0, hours * 3600)
        now_s = ic.time() // 1_000_000_000
        metadata["execute_after"] = now_s + delay
        proposal.metadata = json.dumps(metadata)

    def _exec_callback():
        return _do_execute_proposal(proposal_id)

    ic.set_timer(delay, _exec_callback)
    logger.info(f"Scheduled execution for {proposal_id} in {delay}s")


def _do_execute_proposal(proposal_id: str):
    """Host dispatcher. Timer callbacks that return this generator are driven."""
    from core.proposal_dispatch import dispatch_proposal, DispatchError

    proposal = _find_proposal(proposal_id)
    if not proposal:
        logger.error(f"Execute: proposal {proposal_id} not found")
        return
    if proposal.status != "executing":
        logger.error(
            f"Execute: proposal {proposal_id} status is {proposal.status}, "
            "expected executing"
        )
        return
    try:
        yield from dispatch_proposal(proposal)
    except DispatchError as e:
        metadata = _load_metadata(proposal)
        proposal.status = "failed"
        proposal.metadata = json.dumps({
            **metadata,
            "error": e.error,
            "error_code": e.error_code,
        })
        logger.error(f"Execute: dispatch refused {proposal_id}: {e.error}")
    except Exception as e:
        metadata = _load_metadata(proposal)
        proposal.status = "failed"
        proposal.metadata = json.dumps({
            **metadata,
            "error": str(e),
            "error_code": "dispatch_failed",
        })
        logger.error(
            f"Execute: {proposal_id} failed: {e}\n{traceback.format_exc()}"
        )


def _load_metadata(proposal: Proposal) -> dict:
    """Safely load proposal.metadata as a dict."""
    try:
        return json.loads(proposal.metadata) if proposal.metadata else {}
    except Exception:
        return {}


def _get_codex_baseline(codex_name: str) -> str:
    """Return current codex source from the realm canister, if installed."""
    if not codex_name:
        return ""
    try:
        codex = Codex[codex_name]
        if codex and getattr(codex, "code", None):
            return codex.code or ""
    except Exception:
        pass
    return ""


def _checksum_for(content: str) -> str:
    actual_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    return f"sha256:{actual_hash}"


def _build_file_preview(
    name: str,
    proposed: str,
    code_url: str = "",
    stored_checksum: str = "",
) -> Dict[str, Any]:
    """Build a single-file preview payload with optional diff against realm codex."""
    original = _get_codex_baseline(name)
    is_amendment = bool(original)
    actual_checksum = _checksum_for(proposed)
    checksum_match = None
    if stored_checksum:
        checksum_match = stored_checksum == actual_checksum
    return {
        "name": name,
        "code": proposed,
        "original": original if is_amendment else None,
        "is_amendment": is_amendment,
        "code_url": code_url or None,
        "checksum": actual_checksum,
        "checksum_match": checksum_match,
    }


# ---------------------------------------------------------------------------
# Extension API functions
# ---------------------------------------------------------------------------

def _org_index_ready() -> bool:
    """True once main.py's post-upgrade backfill has completed the
    Proposal field indexes (ic-python-db#11); before that, index lookups
    would silently miss pre-existing rows."""
    try:
        from ic_python_db import Database

        return bool(Database.get_instance().load("_system", "fi_backfill:Proposal:v2"))
    except Exception:
        return False


def get_proposals(args: str) -> str:
    """Get proposals with optional status/org filtering and pagination.

    ``org_scope`` filters to one department's ballots. Once the field-index
    backfill has run, matching rows come from the persistent index
    (``Proposal.find_by``) — cost proportional to matches; until then the
    filter falls back to the scan path. The scan uses ``Proposal.load_some``
    so large realms (demo data, justice cases, procurement tenders sharing
    the Proposal entity) stay under the IC per-message instruction limit.
    """
    try:
        args_dict = _parse_args(args)
        status_filter = args_dict.get("status")
        type_filter = (args_dict.get("proposal_type") or "").strip()
        org_filter = (args_dict.get("org_scope") or "").strip()
        include_non_voting = bool(args_dict.get("include_non_voting", False))
        from_id = max(1, int(args_dict.get("from_id", 1)))
        page_size = min(
            max(1, int(args_dict.get("page_size", DEFAULT_PAGE_SIZE))),
            MAX_PAGE_SIZE,
        )

        max_id = Proposal.max_id()
        proposals: List[Dict[str, Any]] = []
        current_from = from_id
        next_from_id = from_id
        attempts = 0

        if org_filter and _org_index_ready():
            # Indexed path: walk only the org's matches, in ascending ID order.
            has_more = False
            while len(proposals) < page_size and attempts < 20:
                attempts += 1
                batch, next_cursor = Proposal.find_by(
                    "org_scope", org_filter, from_id=current_from, count=page_size
                )
                if not batch:
                    break
                page_filled = False
                for proposal in batch:
                    if len(proposals) >= page_size:
                        page_filled = True
                        break
                    entity_id = int(getattr(proposal, "_id", 0) or 0)
                    next_from_id = entity_id + 1 if entity_id else next_from_id + 1
                    if not include_non_voting and not _is_voting_proposal(proposal):
                        continue
                    if status_filter and proposal.status != status_filter:
                        continue
                    if type_filter and (_load_metadata(proposal).get("proposal_type") or "") != type_filter:
                        continue
                    proposals.append(_proposal_to_dict(proposal, summary=True))
                if page_filled:
                    has_more = True
                    break
                if next_cursor is None:
                    break
                current_from = next_cursor

            return json.dumps({
                "success": True,
                "data": {
                    "proposals": proposals,
                    "total": len(proposals),
                    "from_id": from_id,
                    "next_from_id": next_from_id if has_more else None,
                    "has_more": has_more,
                }
            })

        while len(proposals) < page_size and current_from <= max_id and attempts < 20:
            try:
                batch = Proposal.load_some(from_id=current_from, count=page_size)
            except Exception as batch_err:
                logger.warning(
                    f"get_proposals: batch load failed at from_id={current_from}: {batch_err}"
                )
                batch = []
                for eid in range(current_from, min(current_from + page_size, max_id + 1)):
                    try:
                        entity = Proposal.load(str(eid))
                        if entity:
                            batch.append(entity)
                    except Exception:
                        pass

            if not batch:
                break

            for proposal in batch:
                entity_id = int(getattr(proposal, "_id", 0) or 0)
                if entity_id:
                    next_from_id = entity_id + 1
                    current_from = next_from_id
                else:
                    current_from += 1

                if not include_non_voting and not _is_voting_proposal(proposal):
                    continue
                if status_filter and proposal.status != status_filter:
                    continue
                if type_filter and (_load_metadata(proposal).get("proposal_type") or "") != type_filter:
                    continue
                if org_filter and _proposal_org_scope(proposal) != org_filter:
                    continue

                proposals.append(_proposal_to_dict(proposal, summary=True))
                if len(proposals) >= page_size:
                    break

            attempts += 1
            if len(batch) < page_size:
                break

        has_more = next_from_id <= max_id

        return json.dumps({
            "success": True,
            "data": {
                "proposals": proposals,
                "total": len(proposals),
                "from_id": from_id,
                "next_from_id": next_from_id if has_more else None,
                "has_more": has_more,
            }
        })
    except Exception as e:
        logger.error(f"get_proposals error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_org_scopes(args: str) -> str:
    """Department names for the proposal-list department filter dropdown.

    Names only (no members/policy/budget — that is access_manager's
    list_departments, which is permission-gated). Sorted, root org first.
    """
    try:
        from ggg import Department

        names = []
        root_names = []
        for dept in Department.instances():
            name = (dept.name or "").strip()
            if not name:
                continue
            if getattr(dept, "is_root", False):
                root_names.append(name)
            else:
                names.append(name)
        return json.dumps({
            "success": True,
            "data": {"org_scopes": sorted(root_names) + sorted(names)},
        })
    except Exception as e:
        logger.error(f"get_org_scopes error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_proposal(args: str) -> str:
    """Get a specific proposal by ID."""
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        return json.dumps({"success": True, "data": _proposal_to_dict(proposal)})
    except Exception as e:
        logger.error(f"get_proposal error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def submit_proposal(args: str) -> Async[str]:
    """Submit a typed proposal and open voting immediately."""
    try:
        from core.access import _check_access
        from core.extension_errors import permission_denied_payload
        from core.proposal_dispatch import (
            freeze_action,
            persist_code_execution_source,
            reject_forbidden_submit_keys,
            submit_gate,
        )

        args_dict = _parse_args(args)
        forbidden = reject_forbidden_submit_keys(args_dict)
        if forbidden:
            return json.dumps({"success": False, **forbidden})

        for field in ("title", "description", "proposal_type"):
            if not str(args_dict.get(field) or "").strip():
                return json.dumps({
                    "success": False,
                    "error": f"{field} is required",
                    "error_code": "validation_error",
                })

        proposal_type = str(args_dict["proposal_type"]).strip()
        raw_action = args_dict.get("action") if isinstance(args_dict.get("action"), dict) else {}

        proposer_id = ic.caller().to_str()
        proposer = _find_user(proposer_id)
        if not proposer:
            return json.dumps({
                "success": False,
                "error": f"User {proposer_id} not found",
                "error_code": "unauthenticated",
            })

        gate = submit_gate(proposal_type, raw_action)
        if not _check_access(proposer_id, gate):
            return json.dumps(permission_denied_payload(
                f"Submitting a {proposal_type} proposal requires '{gate}'",
                gate,
            ))

        org_scope = str(args_dict.get("org_scope") or "").strip()

        existing = Proposal.instances()
        proposal_id = f"prop_{len(existing) + 1:03d}"

        source = args_dict.get("source") or ""
        source_url = str(args_dict.get("source_url") or "").strip()
        if proposal_type == "code_execution" and not str(source).strip() and source_url:
            source = yield from _http_download(source_url)

        action, permissions, err = freeze_action(
            proposal_type,
            raw_action,
            source=source,
            source_url=source_url,
            requested_permissions=args_dict.get("requested_permissions"),
            proposal_id=proposal_id,
        )
        if err:
            return json.dumps({"success": False, **err})

        code_url = ""
        code_checksum = ""
        if proposal_type == "code_execution":
            if not str(source).strip():
                return json.dumps({
                    "success": False,
                    "error": "source or source_url is required",
                    "error_code": "missing_source",
                })
            persist_code_execution_source(proposal_id, source, source_url)
            from core.proposal_execution import compute_code_checksum
            code_checksum = compute_code_checksum(source)
            code_url = source_url

        metadata = {
            "proposal_type": proposal_type,
            "action": action,
        }
        if permissions:
            metadata["requested_permissions"] = permissions
        if org_scope:
            metadata["org_scope"] = org_scope

        requested_threshold = args_dict.get("required_threshold", 0.6)
        voting_window = 604_800
        try:
            from ggg import Realm
            realm = Realm[1]
            if realm and realm.calendar:
                cal_window = realm.calendar.voting_window
                if cal_window:
                    voting_window = int(cal_window)
        except Exception:
            pass
        now_s = ic.time() // 1_000_000_000

        proposal = Proposal(
            proposal_id=proposal_id,
            title=str(args_dict["title"]).strip(),
            description=str(args_dict["description"]).strip(),
            code_url=code_url,
            code_checksum=code_checksum,
            proposer=proposer,
            status="voting",
            voting_deadline=str(now_s + voting_window),
            votes_yes=0.0,
            votes_no=0.0,
            votes_abstain=0.0,
            total_voters=0.0,
            required_threshold=requested_threshold,
            org_scope=org_scope,
            metadata=json.dumps(metadata),
        )

        min_threshold = _get_min_threshold(proposal)
        if proposal.required_threshold < min_threshold:
            proposal.required_threshold = min_threshold

        logger.info(
            f"Proposal {proposal_id} submitted by {proposer_id} type={proposal_type}"
        )
        _notify_voting_opened(proposal)
        return json.dumps({"success": True, "data": _proposal_to_dict(proposal)})
    except Exception as e:
        logger.error(f"submit_proposal error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def start_voting(args: str) -> str:
    """Open a proposal for voting.

    Sets status to 'voting' and computes voting_deadline from Calendar.voting_window.
    """
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        if proposal.status != "pending_review":
            return json.dumps({
                "success": False,
                "error": f"Can only start voting on pending_review proposals. Current: {proposal.status}"
            })

        # Get voting window from Calendar (default 7 days = 604800s)
        voting_window = 604_800
        try:
            from ggg import Realm
            realm = Realm[1]
            if realm and realm.calendar:
                cal_window = realm.calendar.voting_window
                if cal_window:
                    voting_window = int(cal_window)
        except Exception as e:
            logger.warning(f"Could not load Calendar voting_window, using default: {e}")

        now_ns = ic.time()
        now_s = now_ns // 1_000_000_000
        deadline_s = now_s + voting_window

        proposal.status = "voting"
        proposal.voting_deadline = str(deadline_s)

        logger.info(f"Voting started for {proposal_id}, deadline in {voting_window}s (epoch {deadline_s})")
        _notify_voting_opened(proposal)
        return json.dumps({"success": True, "data": _proposal_to_dict(proposal)})
    except Exception as e:
        logger.error(f"start_voting error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def finalize_proposal(args: str) -> str:
    """Tally a proposal whose voting deadline has passed.

    Voting has no background timer sweeping expired ballots; anyone may call
    this after the deadline to settle the outcome deterministically:

      - org-scoped ballots: the department policy decides (veto → rejected,
        satisfied → accepted + execution, quorum unmet → no_quorum,
        otherwise → failed);
      - realm-wide ballots: required threshold + governance quorum.

    ``force: true`` skips the deadline check — allowed only when the realm
    runs in test mode (so E2E suites don't have to wait out real windows).
    """
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        if proposal.status not in ("voting", "pending_vote"):
            return json.dumps({
                "success": False,
                "error": f"Proposal is not open for voting. Status: {proposal.status}",
            })

        force = bool(args_dict.get("force", False))
        if force:
            try:
                from core.runtime_flags import is_test_mode

                if not is_test_mode():
                    return json.dumps({
                        "success": False,
                        "error": "force finalization is only allowed in test mode",
                    })
            except ImportError:
                return json.dumps({
                    "success": False,
                    "error": "force finalization is only allowed in test mode",
                })

        now_s = ic.time() // 1_000_000_000
        deadline_str = str(proposal.voting_deadline or "")
        deadline_s = None
        if deadline_str and deadline_str not in ("None", ""):
            try:
                deadline_s = float(deadline_str)
            except (TypeError, ValueError):
                deadline_s = None

        if not force:
            if deadline_s is None:
                return json.dumps({
                    "success": False,
                    "error": "Proposal has no voting deadline; cannot finalize",
                })
            if now_s < deadline_s:
                return json.dumps({
                    "success": False,
                    "error": f"Voting is still open ({int(deadline_s - now_s)}s remaining)",
                })
        elif deadline_s is None or now_s < deadline_s:
            # Make the stored deadline consistent with the forced outcome.
            proposal.voting_deadline = str(now_s)

        scope_dept = _org_scoped_department(proposal)
        if scope_dept is not None:
            approved, vetoed, reason = _check_org_policy(proposal, scope_dept)
            if vetoed:
                proposal.status = "rejected"
            elif approved:
                proposal.status = "accepted"
                _schedule_execution(proposal_id)
            elif "quorum" in reason.lower():
                proposal.status = "no_quorum"
            else:
                proposal.status = "failed"
            outcome_reason = reason
        else:
            if not _check_threshold(proposal):
                proposal.status = "failed"
                outcome_reason = "required threshold not met"
            elif not _check_threshold_and_quorum(proposal):
                proposal.status = "no_quorum"
                outcome_reason = "participation quorum not met"
            else:
                proposal.status = "accepted"
                outcome_reason = "threshold and quorum met"
                _schedule_execution(proposal_id)

        logger.info(
            f"Proposal {proposal_id} finalized{' (forced)' if force else ''}: "
            f"{proposal.status} — {outcome_reason}"
        )
        return json.dumps({
            "success": True,
            "data": {
                "outcome": proposal.status,
                "reason": outcome_reason,
                "forced": force,
                "proposal": _proposal_to_dict(proposal),
            },
        })
    except Exception as e:
        logger.error(f"finalize_proposal error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def cast_vote(args: str) -> str:
    """Cast a vote on a proposal. Auto-approves and schedules execution if threshold met."""
    try:
        args_dict = _parse_args(args)

        proposal_id = args_dict.get("proposal_id")
        vote_choice = args_dict.get("vote")

        if not all([proposal_id, vote_choice]):
            return json.dumps({"success": False, "error": "proposal_id and vote are required"})

        if vote_choice not in ("yes", "no", "abstain"):
            return json.dumps({"success": False, "error": "vote must be 'yes', 'no', or 'abstain'"})

        try:
            from core.delegation import AccessDenied, resolve_acting_context
            from ggg.system.user_profile import Operations

            ctx = resolve_acting_context(args_dict, Operations.PROPOSAL_VOTE)
            voter = ctx.subject_user
            voter_id = voter.id
            vote_meta = {}
            if ctx.is_delegated:
                vote_meta = {
                    "delegated_by": ctx.actor,
                    "delegation_id": ctx.delegation_id,
                }
        except AccessDenied as e:
            return json.dumps({"success": False, "error": str(e)})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        if proposal.status not in ("voting", "pending_vote"):
            return json.dumps({
                "success": False,
                "error": f"Proposal is not open for voting. Status: {proposal.status}"
            })

        if not voter:
            return json.dumps({"success": False, "error": f"User {voter_id} not found"})

        # Department-scoped ballots (issue #241): only that department's members vote.
        scope_dept = _org_scoped_department(proposal)
        if scope_dept is not None:
            try:
                from core.membership import user_in_department

                is_member = user_in_department(voter, scope_dept)
            except Exception:
                is_member = False
            if not is_member:
                return json.dumps({
                    "success": False,
                    "error": f"Only members of '{scope_dept.name}' can vote on this proposal",
                })

        # Check for existing vote by this user on this proposal
        existing_vote = None
        for v in Vote.instances():
            if (v.proposal and v.voter
                    and v.proposal.proposal_id == proposal.proposal_id
                    and v.voter.id == voter.id):
                existing_vote = v
                break

        if existing_vote:
            # Undo previous vote count
            old_choice = existing_vote.vote_choice
            if old_choice == "yes":
                proposal.votes_yes = (proposal.votes_yes or 0.0) - 1.0
            elif old_choice == "no":
                proposal.votes_no = (proposal.votes_no or 0.0) - 1.0
            elif old_choice == "abstain":
                proposal.votes_abstain = (proposal.votes_abstain or 0.0) - 1.0
            existing_vote.vote_choice = vote_choice
            if vote_meta:
                existing_vote.metadata = json.dumps(vote_meta)
        else:
            Vote(
                proposal=proposal,
                voter=voter,
                vote_choice=vote_choice,
                metadata=json.dumps(vote_meta) if vote_meta else "{}",
            )
            proposal.total_voters = (proposal.total_voters or 0.0) + 1.0

        # Update counts for the new vote
        if vote_choice == "yes":
            proposal.votes_yes = (proposal.votes_yes or 0.0) + 1.0
        elif vote_choice == "no":
            proposal.votes_no = (proposal.votes_no or 0.0) + 1.0
        elif vote_choice == "abstain":
            proposal.votes_abstain = (proposal.votes_abstain or 0.0) + 1.0

        # Check for auto-approval: org policy for scoped ballots,
        # realm-wide threshold + quorum otherwise.
        auto_approved = False
        if scope_dept is not None:
            approved, vetoed, reason = _check_org_policy(proposal, scope_dept)
            if vetoed:
                proposal.status = "rejected"
                logger.info(f"Proposal {proposal_id} rejected: {reason}")
            elif approved:
                proposal.status = "accepted"
                auto_approved = True
                logger.info(
                    f"Proposal {proposal_id} auto-approved "
                    f"(org policy of '{scope_dept.name}' satisfied)"
                )
                _schedule_execution(proposal_id)
        elif _check_threshold_and_quorum(proposal):
            proposal.status = "accepted"
            auto_approved = True
            logger.info(f"Proposal {proposal_id} auto-approved (threshold and quorum met)")
            _schedule_execution(proposal_id)

        return json.dumps({
            "success": True,
            "data": {
                "message": "Vote cast successfully",
                "auto_approved": auto_approved,
                "proposal": _proposal_to_dict(proposal),
            }
        })
    except Exception as e:
        logger.error(f"cast_vote error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def execute_proposal(args: str) -> Async[str]:
    """Manually trigger proposal execution (download, verify checksum, exec).

    Normally called automatically after approval, but available for manual use.
    """
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        if proposal.status != "executing":
            return json.dumps({
                "success": False,
                "error": f"Proposal must be executing. Current: {proposal.status}",
                "error_code": "not_executing",
            })

        yield from _do_execute_proposal(proposal_id)

        # Re-load to get updated status
        proposal = _find_proposal(proposal_id)
        return json.dumps({
            "success": proposal.status == "executed",
            "data": _proposal_to_dict(proposal),
        })
    except Exception as e:
        logger.error(f"execute_proposal error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def fetch_proposal_code(args: str) -> str:
    """Read stored code-execution source from its reserved Codex row."""
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        metadata = _load_metadata(proposal)
        if metadata.get("proposal_type") != "code_execution":
            return json.dumps({
                "success": False,
                "error": "proposal has no stored code",
                "error_code": "not_code_execution",
            })
        action = metadata.get("action") if isinstance(metadata.get("action"), dict) else {}
        name = action.get("codex_name") or ""
        row = Codex[name] if name else None
        code = getattr(row, "code", None) if row else None
        if not code:
            return json.dumps({"success": False, "error": "stored code is missing"})
        from core.proposal_execution import compute_code_checksum
        return json.dumps({
            "success": True,
            "data": {
                "mode": "single",
                "code": code,
                "codex_name": name,
                "checksum": compute_code_checksum(code),
                "code_url": action.get("source_url") or proposal.code_url or None,
                "is_amendment": False,
                "original": None,
            },
        })
    except Exception as e:
        logger.error(f"fetch_proposal_code error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def fetch_proposal_code_remote(args: str) -> Async[str]:
    """Download a URL at submit time so the proposer can preview and checksum."""
    try:
        args_dict = _parse_args(args)
        code_url = str(args_dict.get("code_url") or "").strip()
        if not code_url:
            return json.dumps({"success": False, "error": "code_url is required"})
        code_content = yield from _http_download(code_url)
        from core.proposal_execution import compute_code_checksum
        return json.dumps({
            "success": True,
            "data": {
                "code": code_content,
                "code_url": code_url,
                "checksum": compute_code_checksum(code_content),
            },
        })
    except Exception as e:
        logger.error(f"fetch_proposal_code_remote error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_user_vote(args: str) -> str:
    """Get the current user's vote on a proposal."""
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        # Security: always use ic.caller() as the voter identity
        voter_id = ic.caller().to_str()

        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        # Find user's vote on this proposal
        user_vote = None
        for v in Vote.instances():
            if (v.proposal and v.voter
                    and v.proposal.proposal_id == proposal.proposal_id
                    and v.voter.id == voter_id):
                user_vote = v
                break

        if user_vote:
            return json.dumps({
                "success": True,
                "data": {"has_voted": True, "vote_choice": user_vote.vote_choice}
            })
        else:
            return json.dumps({
                "success": True,
                "data": {"has_voted": False, "vote_choice": None}
            })
    except Exception as e:
        logger.error(f"get_user_vote error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_bridge_verbs(args: str) -> str:
    """Bridge verbs the Code Execution form may request."""
    try:
        from core.codex_bridge import known_verbs
        return json.dumps({"success": True, "data": {"verbs": known_verbs()}})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def get_submit_context(args: str) -> str:
    """UI flags for the typed submit form."""
    try:
        from core.proposal_dispatch import baton_configured, registry_canister_id
        return json.dumps({
            "success": True,
            "data": {
                "baton_configured": baton_configured(),
                "registry_canister_id": registry_canister_id(),
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


def get_voting_settings(args: str) -> str:
    """Return realm calendar voting-window settings for the Voting UI."""
    try:
        from ggg import Realm

        window_s = 604_800
        realm = Realm[1]
        if realm and realm.calendar and realm.calendar.voting_window:
            window_s = max(1, int(realm.calendar.voting_window))
        return json.dumps({
            "success": True,
            "data": {
                "voting_window_seconds": window_s,
                "voting_window_days": window_s / 86400.0,
            },
        })
    except Exception as e:
        logger.error(f"get_voting_settings error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


# ---------------------------------------------------------------------------
# Extension API registry
# ---------------------------------------------------------------------------

EXTENSION_FUNCTIONS = {
    "get_voting_settings": get_voting_settings,
    "get_submit_context": get_submit_context,
    "get_bridge_verbs": get_bridge_verbs,
    "get_proposals": get_proposals,
    "get_proposal": get_proposal,
    "get_org_scopes": get_org_scopes,
    "submit_proposal": submit_proposal,
    "start_voting": start_voting,
    "cast_vote": cast_vote,
    "finalize_proposal": finalize_proposal,
    "execute_proposal": execute_proposal,
    "fetch_proposal_code": fetch_proposal_code,
    "fetch_proposal_code_remote": fetch_proposal_code_remote,
    "get_user_vote": get_user_vote,
}
