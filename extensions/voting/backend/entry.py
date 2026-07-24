"""
Voting Extension Backend Entry Point
Governance voting system using GGG entities

Flow:
  submit_proposal → start_voting → cast_vote (auto-approve on threshold)
  → auto-execute: download codex, verify checksum, exec() the code

Multi-codex proposals store a codices array in metadata and use the
basilisk TaskManager to execute each download/install as a separate step,
avoiding IC instruction limits.
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
        from ggg import Codex

        _HOOK_NAMES = ("role_management_hook", "governance_policy_hook")
        for codex in Codex.instances():
            if codex.name in _HOOK_NAMES and codex.code:
                import ggg as _ggg
                ns = {"ic": ic, "ggg": _ggg, "__builtins__": __builtins__}
                exec(compile(codex.code, f"{codex.name}.py", "exec"), ns)
                if "get_governance_params" in ns:
                    result = ns["get_governance_params"](proposal_type, requested_permissions)
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


def _format_voting_deadline(deadline_raw: str) -> str:
    """Best-effort human date from epoch seconds or ISO string."""
    if not deadline_raw:
        return "the deadline"
    text = str(deadline_raw).strip()
    if text.isdigit():
        try:
            from datetime import datetime, timezone

            return datetime.fromtimestamp(int(text), tz=timezone.utc).strftime("%Y-%m-%d")
        except (ValueError, OSError, OverflowError):
            pass
    return text[:10] if len(text) >= 10 else text


def _notify_voting_opened(proposal: Proposal) -> None:
    """Create inbox messages for users who must cast a vote."""
    title = (proposal.title or "New proposal").strip()
    deadline_label = _format_voting_deadline(proposal.voting_deadline or "")
    scope_dept = _org_scoped_department(proposal)

    if scope_dept is not None:
        from core.membership import department_member_principals

        recipient_ids = department_member_principals(scope_dept, include_head=False)
        audience_hint = f"members of {scope_dept.name}"
    else:
        recipient_ids = [user.id for user in User.instances()]
        audience_hint = "all members"

    message = (
        f'Voting is open on "{title}". Cast your vote before {deadline_label}.'
    )
    metadata = json.dumps({"proposal_id": proposal.proposal_id})

    notified = 0
    for principal_id in recipient_ids:
        user = User[principal_id]
        if not user:
            continue
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
        notified += 1

    logger.info(
        f"Voting notifications sent for {proposal.proposal_id} "
        f"to {notified} {audience_hint}"
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

    active_members = len(list(User.instances()))
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
    """Schedule async proposal execution via a one-shot timer."""
    def _exec_callback():
        return _do_execute_proposal(proposal_id)
    ic.set_timer(0, _exec_callback)
    logger.info(f"Scheduled execution for proposal {proposal_id}")


# ---------------------------------------------------------------------------
# Multi-codex TaskManager helpers
# ---------------------------------------------------------------------------

def _build_download_step_code(entry: dict, proposal_id: str) -> str:
    """Build a self-contained Python code string that downloads one codex,
    verifies its checksum, and creates/updates the Codex entity.

    The generated code defines ``async_task()`` which yields an HTTP outcall
    (compatible with basilisk TaskManager async steps).
    """
    url = entry["url"]
    name = entry["name"]
    checksum = entry.get("checksum", "")
    # Use repr() so strings are safely quoted inside the generated code
    return (
        "import hashlib, json\n"
        "from ggg import Codex, Proposal\n"
        "from basilisk.canisters.management import management_canister\n"
        "from _cdk import ic\n"
        "\n"
        f"_URL = {repr(url)}\n"
        f"_CODEX_NAME = {repr(name)}\n"
        f"_CHECKSUM = {repr(checksum)}\n"
        f"_PROPOSAL_ID = {repr(proposal_id)}\n"
        "\n"
        "def async_task():\n"
        "    resp = yield management_canister.http_request({\n"
        "        'url': _URL,\n"
        "        'max_response_bytes': 2_000_000,\n"
        "        'method': {'get': None},\n"
        "        'headers': [\n"
        "            {'name': 'User-Agent', 'value': 'Basilisk/1.0'},\n"
        "            {'name': 'Accept-Encoding', 'value': 'identity'},\n"
        "        ],\n"
        "        'body': None,\n"
        "        'transform': {\n"
        "            'function': (ic.id(), 'http_transform'),\n"
        "            'context': bytes(),\n"
        "        },\n"
        "    }).with_cycles(30_000_000_000)\n"
        "\n"
        "    if 'Ok' not in resp:\n"
        "        raise RuntimeError(f'HTTP download failed for {_CODEX_NAME}: {resp}')\n"
        "    body = resp['Ok']['body']\n"
        "    code = body.decode('utf-8') if isinstance(body, bytes) else body\n"
        "\n"
        "    if _CHECKSUM:\n"
        "        actual = 'sha256:' + hashlib.sha256(code.encode('utf-8')).hexdigest()\n"
        "        if _CHECKSUM != actual:\n"
        "            raise RuntimeError(\n"
        "                f'Checksum mismatch for {_CODEX_NAME}: '"
        "                f'expected {_CHECKSUM}, got {actual}')\n"
        "        logger.info(f'Checksum verified for {_CODEX_NAME}: {actual}')\n"
        "\n"
        "    existing = Codex[_CODEX_NAME]\n"
        "    if existing:\n"
        "        existing.code = code\n"
        "        existing.description = (\n"
        "            f'Updated by proposal {_PROPOSAL_ID}')\n"
        "        action = 'updated'\n"
        "    else:\n"
        "        Codex(name=_CODEX_NAME,\n"
        "              description=f'Created by proposal {_PROPOSAL_ID}',\n"
        "              code=code)\n"
        "        action = 'created'\n"
        "    logger.info(f'Codex {_CODEX_NAME} {action}')\n"
        "\n"
        "    # Track progress in proposal metadata\n"
        "    proposal = Proposal[_PROPOSAL_ID]\n"
        "    if proposal:\n"
        "        meta = json.loads(proposal.metadata) if proposal.metadata else {}\n"
        "        actions = meta.get('codex_actions', [])\n"
        "        actions.append(f'{_CODEX_NAME}: {action}')\n"
        "        meta['codex_actions'] = actions\n"
        "        proposal.metadata = json.dumps(meta)\n"
        "    return f'{_CODEX_NAME}: {action}'\n"
    )


def _build_finalize_step_code(proposal_id: str) -> str:
    """Build code for the final step: refresh entity method overrides
    and mark the proposal as executed."""
    return (
        "import json\n"
        "from ggg import Proposal\n"
        "\n"
        f"_PROPOSAL_ID = {repr(proposal_id)}\n"
        "\n"
        "try:\n"
        "    from main import reload_entity_method_overrides\n"
        "    reload_entity_method_overrides()\n"
        "    logger.info('Entity method overrides refreshed')\n"
        "except Exception as e:\n"
        "    logger.warning(f'Could not refresh entity method overrides: {e}')\n"
        "\n"
        "proposal = Proposal[_PROPOSAL_ID]\n"
        "if proposal:\n"
        "    proposal.status = 'executed'\n"
        "    logger.info(f'Proposal {_PROPOSAL_ID} marked as executed')\n"
    )


def _schedule_multi_codex_execution(proposal_id: str, codices_list: List[dict]):
    """Create a basilisk Task with one step per codex + a finalize step,
    then kick off the first step immediately via ic.set_timer."""
    from basilisk.os.entities import (
        Call as OSCall,
        Codex as OSCodex,
        Task as OSTask,
        TaskStep as OSTaskStep,
        TaskSchedule as OSTaskSchedule,
    )
    from basilisk.os.task_manager import _create_timer_callback
    from basilisk.os.status import TaskStatus

    task_name = f"proposal_{proposal_id}_exec"
    logger.info(f"Creating multi-codex task '{task_name}' with {len(codices_list)} codex(es)")

    task = OSTask(name=task_name, status=TaskStatus.PENDING, step_to_execute=0)

    # One async step per codex download
    for i, entry in enumerate(codices_list):
        step_code = _build_download_step_code(entry, proposal_id)
        codex = OSCodex(
            name=f"_proposal_{proposal_id}_step_{i}",
            code=step_code,
        )
        call = OSCall(is_async=True, codex=codex)
        OSTaskStep(call=call, task=task, status=TaskStatus.PENDING, run_next_after=0)

    # Final sync step: refresh overrides + mark executed
    finalize_code = _build_finalize_step_code(proposal_id)
    fin_codex = OSCodex(
        name=f"_proposal_{proposal_id}_finalize",
        code=finalize_code,
    )
    fin_call = OSCall(is_async=False, codex=fin_codex)
    OSTaskStep(call=fin_call, task=task, status=TaskStatus.PENDING, run_next_after=0)

    # Schedule for immediate execution
    OSTaskSchedule(
        name=f"{task_name}_schedule",
        task=task,
        run_at=0,
        repeat_every=0,
        disabled=False,
    )

    # Kick off the first step now
    steps = list(task.steps)
    if steps:
        first_step = steps[0]
        callback = _create_timer_callback(first_step, task)
        first_step.status = TaskStatus.RUNNING
        task.status = TaskStatus.RUNNING
        task.step_to_execute = 1
        ic.set_timer(0, callback)
        logger.info(f"Multi-codex task '{task_name}' started ({len(steps)} steps)")


# ---------------------------------------------------------------------------
# Single-codex execution (original path, unchanged)
# ---------------------------------------------------------------------------

def _do_execute_proposal(proposal_id: str):
    """Internal generator: download codex(es), verify checksum, exec() the code.

    For single-codex proposals this runs as an async generator driven by
    Rust's drive_generator.  For multi-codex proposals (codices array in
    metadata) it delegates to the TaskManager for step-by-step execution.
    """
    proposal = _find_proposal(proposal_id)
    if not proposal:
        logger.error(f"Execute: proposal {proposal_id} not found")
        return

    if proposal.status not in ("accepted",):
        logger.error(f"Execute: proposal {proposal_id} status is {proposal.status}, expected accepted")
        return

    metadata = _load_metadata(proposal)
    code_inline = metadata.get("code_inline")
    codices_list = metadata.get("codices")

    # --- Inline code path: no download needed ---
    if code_inline:
        proposal.status = "executing"
        codex_name = metadata.get("codex_name", f"proposal_{proposal_id}_inline")
        logger.info(f"Executing inline-code proposal {proposal_id}")

        existing_codex = Codex[codex_name]
        if existing_codex:
            existing_codex.code = code_inline
            existing_codex.description = f"Updated by proposal {proposal_id}: {proposal.title}"
            action = "updated"
        else:
            existing_codex = Codex(
                name=codex_name,
                description=f"Created by proposal {proposal_id}: {proposal.title}",
                code=code_inline,
            )
            action = "created"

        try:
            from main import reload_entity_method_overrides
            reload_entity_method_overrides()
        except Exception:
            pass

        try:
            from ggg import Transfer, Treasury, User, Budget, Fund, LedgerEntry, Realm
            extra_globals = {
                "Transfer": Transfer, "Treasury": Treasury, "User": User,
                "Budget": Budget, "Fund": Fund, "LedgerEntry": LedgerEntry,
                "Realm": Realm, "Proposal": Proposal, "Vote": Vote,
            }
        except ImportError:
            extra_globals = {}
        exec_globals = {"ic": ic, "logger": logger, "Codex": Codex, "json": json, **extra_globals}

        try:
            exec(code_inline, exec_globals)
            main_fn = exec_globals.get("main")
            if main_fn and callable(main_fn):
                result = main_fn()
                if hasattr(result, '__next__'):
                    yield from result
            logger.info(f"Inline code executed successfully for proposal {proposal_id}")
        except Exception as e:
            proposal.status = "failed"
            proposal.metadata = json.dumps({**metadata, "error": f"Code execution failed: {e}"})
            logger.error(f"Execute: inline code exec failed for {proposal_id}: {e}\n{traceback.format_exc()}")
            return

        proposal.status = "executed"
        proposal.metadata = json.dumps({**metadata, "codex_name": codex_name, "codex_action": action})
        logger.info(f"Proposal {proposal_id} fully executed (inline code)")
        return

    # --- Multi-codex path: delegate to TaskManager ---
    if codices_list and len(codices_list) > 1:
        proposal.status = "executing"
        logger.info(f"Executing multi-codex proposal {proposal_id}: {len(codices_list)} codex(es)")
        _schedule_multi_codex_execution(proposal_id, codices_list)
        return

    # --- Single-codex path (original behaviour) ---
    # If codices array has exactly one entry, extract it
    if codices_list and len(codices_list) == 1:
        entry = codices_list[0]
        code_url = entry.get("url", "")
        codex_name = entry.get("name", f"proposal_{proposal_id}_codex")
        expected_checksum = entry.get("checksum", "")
    else:
        code_url = proposal.code_url
        codex_name = metadata.get("codex_name", f"proposal_{proposal_id}_codex")
        expected_checksum = proposal.code_checksum

    if not code_url:
        proposal.status = "failed"
        proposal.metadata = json.dumps({**metadata, "error": "No code URL"})
        logger.error(f"Execute: proposal {proposal_id} has no code URL")
        return

    proposal.status = "executing"
    logger.info(f"Executing proposal {proposal_id}: downloading {code_url}")

    try:
        code_content = yield from _http_download(code_url)
    except Exception as e:
        proposal.status = "failed"
        proposal.metadata = json.dumps({**metadata,
                                         "error": f"Download failed: {e}"})
        logger.error(f"Execute: download failed for {proposal_id}: {e}")
        return

    # Verify checksum if provided
    if expected_checksum:
        actual_hash = hashlib.sha256(code_content.encode("utf-8")).hexdigest()
        actual_checksum = f"sha256:{actual_hash}"
        if expected_checksum != actual_checksum:
            proposal.status = "failed"
            proposal.metadata = json.dumps({
                **metadata,
                "error": f"Checksum mismatch: expected {expected_checksum}, got {actual_checksum}"
            })
            logger.error(f"Execute: checksum mismatch for {proposal_id}")
            return
        logger.info(f"Checksum verified for {proposal_id}: {actual_checksum}")
    else:
        logger.warning(f"No checksum provided for {proposal_id}, skipping verification")

    # Create or update the Codex entity
    existing_codex = Codex[codex_name]
    if existing_codex:
        existing_codex.code = code_content
        existing_codex.description = f"Updated by proposal {proposal_id}: {proposal.title}"
        action = "updated"
    else:
        existing_codex = Codex(
            name=codex_name,
            description=f"Created by proposal {proposal_id}: {proposal.title}",
            code=code_content,
        )
        action = "created"

    logger.info(f"Codex '{codex_name}' {action} for proposal {proposal_id}")

    # Refresh entity method overrides that may reference this codex
    try:
        from main import reload_entity_method_overrides
        reload_entity_method_overrides()
        logger.info(f"Entity method overrides refreshed after codex '{codex_name}' update")
    except Exception as e:
        logger.warning(f"Could not refresh entity method overrides: {e}")

    # Execute the codex code
    try:
        from ggg import Transfer, Treasury, User, Budget, Fund, LedgerEntry, Realm
        extra_globals = {
            "Transfer": Transfer, "Treasury": Treasury, "User": User,
            "Budget": Budget, "Fund": Fund, "LedgerEntry": LedgerEntry,
            "Realm": Realm, "Proposal": Proposal, "Vote": Vote,
        }
    except ImportError:
        extra_globals = {}
    exec_globals = {"ic": ic, "logger": logger, "Codex": Codex, "json": json, **extra_globals}

    try:
        exec(code_content, exec_globals)

        # If the code defines a main() generator, drive it for async operations
        main_fn = exec_globals.get("main")
        if main_fn and callable(main_fn):
            result = main_fn()
            if hasattr(result, '__next__'):
                logger.info(f"Driving async main() for proposal {proposal_id}")
                yield from result
            else:
                logger.info(f"main() returned (sync) for proposal {proposal_id}")

        logger.info(f"Codex code executed successfully for proposal {proposal_id}")
    except Exception as e:
        proposal.status = "failed"
        proposal.metadata = json.dumps({
            **metadata,
            "error": f"Code execution failed: {e}",
            "codex_name": codex_name,
            "codex_action": action,
        })
        logger.error(f"Execute: code exec failed for {proposal_id}: {e}\n{traceback.format_exc()}")
        return

    proposal.status = "executed"
    proposal.metadata = json.dumps({
        **metadata,
        "codex_name": codex_name,
        "codex_action": action,
    })
    logger.info(f"Proposal {proposal_id} fully executed: codex '{codex_name}' {action} and code ran")


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


def submit_proposal(args: str) -> str:
    """Submit a new proposal.

    Required: title, description
    Required (one of): code_url (single codex) OR codices (multi-codex array) OR code_inline (inline Python)
    Optional: code_checksum (sha256:<hex>), codex_name, required_threshold, auto_start_voting (bool)

    Multi-codex format:
      codices: [{"name": "...", "url": "...", "checksum": "..."}, ...]
    """
    try:
        args_dict = _parse_args(args)

        for field in ("title", "description"):
            if field not in args_dict:
                return json.dumps({"success": False, "error": f"{field} is required"})

        # Validate that we have at least one codex source
        codices = args_dict.get("codices", [])
        code_url = args_dict.get("code_url", "")
        code_inline = args_dict.get("code_inline", "")
        if not codices and not code_url and not code_inline:
            return json.dumps({"success": False, "error": "code_url, codices array, or code_inline is required"})

        # Validate codices entries
        if codices:
            for i, entry in enumerate(codices):
                if not entry.get("url"):
                    return json.dumps({"success": False, "error": f"codices[{i}] missing url"})
                if not entry.get("name"):
                    return json.dumps({"success": False, "error": f"codices[{i}] missing name"})

        # Security: always use ic.caller() as the proposer identity
        proposer_id = ic.caller().to_str()
        proposer = _find_user(proposer_id)
        if not proposer:
            return json.dumps({"success": False, "error": f"User {proposer_id} not found"})

        # Generate proposal ID
        existing = Proposal.instances()
        proposal_num = len(existing) + 1
        proposal_id = f"prop_{proposal_num:03d}"

        # Build metadata
        metadata = {}
        if code_inline:
            metadata["code_inline"] = code_inline
            display_url = ""
            codex_name = args_dict.get("codex_name", f"proposal_{proposal_id}_inline")
            metadata["codex_name"] = codex_name
        elif codices:
            metadata["codices"] = codices
            display_url = codices[0]["url"]
        else:
            display_url = code_url
            if args_dict.get("codex_name"):
                metadata["codex_name"] = args_dict["codex_name"]

        # Apply minimum threshold floor from governance policy
        requested_threshold = args_dict.get("required_threshold", 0.6)

        proposal = Proposal(
            proposal_id=proposal_id,
            title=args_dict["title"],
            description=args_dict["description"],
            code_url=display_url,
            code_checksum=args_dict.get("code_checksum", ""),
            proposer=proposer,
            status="pending_review",
            voting_deadline="",
            votes_yes=0.0,
            votes_no=0.0,
            votes_abstain=0.0,
            total_voters=0.0,
            required_threshold=requested_threshold,
            metadata=json.dumps(metadata),
        )

        # Enforce minimum threshold floor (codex-defined)
        min_threshold = _get_min_threshold(proposal)
        if proposal.required_threshold < min_threshold:
            proposal.required_threshold = min_threshold
            logger.info(
                f"Proposal {proposal_id}: threshold raised from {requested_threshold} "
                f"to minimum {min_threshold} (governance policy)"
            )

        codex_count = len(codices) if codices else 1
        logger.info(f"Proposal {proposal_id} submitted by {proposer_id} ({codex_count} codex(es), inline={'yes' if code_inline else 'no'})")

        # Auto-start voting if requested
        if args_dict.get("auto_start_voting"):
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
            now_ns = ic.time()
            now_s = now_ns // 1_000_000_000
            deadline_s = now_s + voting_window
            proposal.status = "voting"
            proposal.voting_deadline = str(deadline_s)
            logger.info(f"Auto-started voting for {proposal_id}, deadline in {voting_window}s")
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


def approve_proposal(args: str) -> str:
    """Manually approve a proposal and schedule execution."""
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        if proposal.status in ("accepted", "executing", "executed"):
            return json.dumps({"success": False, "error": f"Proposal already {proposal.status}"})

        proposal.status = "accepted"
        logger.info(f"Proposal {proposal_id} manually approved")

        _schedule_execution(proposal_id)

        return json.dumps({
            "success": True,
            "data": {
                "message": "Proposal approved, execution scheduled",
                "proposal": _proposal_to_dict(proposal),
            }
        })
    except Exception as e:
        logger.error(f"approve_proposal error: {e}\n{traceback.format_exc()}")
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

        if proposal.status not in ("accepted",):
            return json.dumps({
                "success": False,
                "error": f"Proposal must be accepted before execution. Current: {proposal.status}"
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
    """Fetch and preview proposal code when content is already on-canister (read-only).

    Accepts proposal_id (loads from proposal) or code_url (checksum helper).

    Returns ``needs_remote: true`` when the code must be downloaded via HTTP;
    call ``fetch_proposal_code_remote`` for those cases.
    """
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        code_url = args_dict.get("code_url")

        if proposal_id:
            proposal = _find_proposal(proposal_id)
            if not proposal:
                return json.dumps({"success": False, "error": "Proposal not found"})

            metadata = _load_metadata(proposal)
            code_inline = metadata.get("code_inline")
            codices_list = metadata.get("codices") or []

            if codices_list:
                files = []
                for entry in codices_list:
                    name = entry.get("name", "")
                    if not name:
                        return json.dumps({"success": False, "error": "codices entry missing name"})
                    entry_inline = entry.get("code_inline", "")
                    entry_url = entry.get("url", "")
                    if entry_inline:
                        proposed = entry_inline
                    elif entry_url:
                        return json.dumps({"success": False, "needs_remote": True})
                    else:
                        return json.dumps({
                            "success": False,
                            "error": f"codices entry '{name}' has no url or code_inline",
                        })
                    files.append(_build_file_preview(
                        name,
                        proposed,
                        code_url=entry_url,
                        stored_checksum=entry.get("checksum", ""),
                    ))
                primary = files[0]
                return json.dumps({
                    "success": True,
                    "data": {
                        "mode": "multi",
                        "files": files,
                        "code": primary["code"],
                        "original": primary.get("original"),
                        "is_amendment": primary["is_amendment"],
                        "codex_name": primary["name"],
                        "checksum": primary["checksum"],
                    },
                })

            if code_inline:
                codex_name = metadata.get("codex_name", "")
                file_preview = _build_file_preview(codex_name or "inline", code_inline)
                return json.dumps({
                    "success": True,
                    "data": {
                        "mode": "single",
                        "inline": True,
                        "codex_name": codex_name or None,
                        **file_preview,
                        "code_url": None,
                        "checksum_match": True,
                    },
                })

            if not proposal.code_url:
                return json.dumps({"success": False, "error": "Proposal has no code attached"})

            return json.dumps({"success": False, "needs_remote": True})

        if not code_url:
            return json.dumps({"success": False, "error": "proposal_id or code_url is required"})

        return json.dumps({"success": False, "needs_remote": True})
    except Exception as e:
        logger.error(f"fetch_proposal_code error: {e}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def fetch_proposal_code_remote(args: str) -> Async[str]:
    """Fetch proposal code that requires an HTTP outcall (read-only)."""
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        code_url = args_dict.get("code_url")

        if proposal_id:
            proposal = _find_proposal(proposal_id)
            if not proposal:
                return json.dumps({"success": False, "error": "Proposal not found"})

            metadata = _load_metadata(proposal)
            codices_list = metadata.get("codices") or []

            if codices_list:
                files = []
                for entry in codices_list:
                    name = entry.get("name", "")
                    if not name:
                        return json.dumps({"success": False, "error": "codices entry missing name"})
                    entry_inline = entry.get("code_inline", "")
                    entry_url = entry.get("url", "")
                    if entry_inline:
                        proposed = entry_inline
                    elif entry_url:
                        logger.info(f"Fetching codex preview for {name}: {entry_url}")
                        proposed = yield from _http_download(entry_url)
                    else:
                        return json.dumps({
                            "success": False,
                            "error": f"codices entry '{name}' has no url or code_inline",
                        })
                    files.append(_build_file_preview(
                        name,
                        proposed,
                        code_url=entry_url,
                        stored_checksum=entry.get("checksum", ""),
                    ))
                primary = files[0]
                return json.dumps({
                    "success": True,
                    "data": {
                        "mode": "multi",
                        "files": files,
                        "code": primary["code"],
                        "original": primary.get("original"),
                        "is_amendment": primary["is_amendment"],
                        "codex_name": primary["name"],
                        "checksum": primary["checksum"],
                    },
                })

            code_url = proposal.code_url
            if not code_url:
                return json.dumps({"success": False, "error": "Proposal has no remote code URL"})

            logger.info(f"Fetching code preview from: {code_url}")
            code_content = yield from _http_download(code_url)
            codex_name = metadata.get("codex_name", "")
            file_preview = _build_file_preview(
                codex_name or "proposal",
                code_content,
                code_url=code_url,
                stored_checksum=proposal.code_checksum or "",
            )
            return json.dumps({
                "success": True,
                "data": {
                    "mode": "single",
                    "codex_name": codex_name or None,
                    **file_preview,
                },
            })

        if not code_url:
            return json.dumps({"success": False, "error": "proposal_id or code_url is required"})

        logger.info(f"Fetching code preview from: {code_url}")
        code_content = yield from _http_download(code_url)
        actual_checksum = _checksum_for(code_content)
        return json.dumps({
            "success": True,
            "data": {
                "mode": "single",
                "code": code_content,
                "code_url": code_url,
                "checksum": actual_checksum,
                "is_amendment": False,
                "original": None,
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


def demo_approve_and_execute(args: str) -> Async[str]:
    """Demo-only: Force-approve and execute a proposal regardless of current status.

    Resets the proposal to 'accepted', then runs the full execution pipeline
    (download codex, verify checksum, exec).  Available only for demonstration
    purposes so that testers can re-run execution on any proposal.
    """
    try:
        args_dict = _parse_args(args)
        proposal_id = args_dict.get("proposal_id")
        if not proposal_id:
            return json.dumps({"success": False, "error": "proposal_id is required"})

        proposal = _find_proposal(proposal_id)
        if not proposal:
            return json.dumps({"success": False, "error": "Proposal not found"})

        old_status = proposal.status
        proposal.status = "accepted"
        logger.info(f"[DEMO] Proposal {proposal_id} force-approved (was {old_status})")

        yield from _do_execute_proposal(proposal_id)

        proposal = _find_proposal(proposal_id)
        return json.dumps({
            "success": proposal.status == "executed",
            "data": {
                "message": f"Demo: proposal force-approved and executed (was {old_status})",
                "proposal": _proposal_to_dict(proposal),
            }
        })
    except Exception as e:
        logger.error(f"demo_approve_and_execute error: {e}\n{traceback.format_exc()}")
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
    "get_proposals": get_proposals,
    "get_proposal": get_proposal,
    "submit_proposal": submit_proposal,
    "start_voting": start_voting,
    "cast_vote": cast_vote,
    "approve_proposal": approve_proposal,
    "execute_proposal": execute_proposal,
    "fetch_proposal_code": fetch_proposal_code,
    "fetch_proposal_code_remote": fetch_proposal_code_remote,
    "get_user_vote": get_user_vote,
    "demo_approve_and_execute": demo_approve_and_execute,
}
