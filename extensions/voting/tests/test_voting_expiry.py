"""Unit tests for voting deadline enforcement and expired-ballot sweep."""

from __future__ import annotations

import importlib.util
import json
import sys
import types
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from ic_python_db import Database

VOTING_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = VOTING_ROOT.parents[2] / "src" / "realm_backend"
ENTRY_PATH = VOTING_ROOT / "backend" / "entry.py"

NOW_S = 1_700_000_000
PAST_DEADLINE = str(NOW_S - 3600)
FUTURE_DEADLINE = str(NOW_S + 3600)


class MockStorage:
    def __init__(self):
        self.data = {}

    def get(self, key):
        return self.data.get(key)

    def insert(self, key, value):
        self.data[key] = value

    def remove(self, key):
        self.data.pop(key, None)

    def items(self):
        return self.data.items()

    def keys(self):
        return list(self.data.keys())

    def __len__(self):
        return len(self.data)


@pytest.fixture(scope="module")
def voting_entry():
    if str(BACKEND_ROOT) not in sys.path:
        sys.path.insert(0, str(BACKEND_ROOT))

    mock_ic = MagicMock()
    mock_ic.time.return_value = NOW_S * 1_000_000_000
    mock_ic.set_timer.return_value = None

    from typing import Generic, TypeVar

    _T = TypeVar("_T")

    class _Async(Generic[_T]):
        pass

    mock_basilisk = types.ModuleType("basilisk")
    mock_basilisk.ic = mock_ic
    mock_basilisk.Async = _Async
    sys.modules["basilisk"] = mock_basilisk
    mock_mgmt = types.ModuleType("basilisk.canisters.management")
    mock_mgmt.management_canister = MagicMock()
    sys.modules["basilisk.canisters.management"] = mock_mgmt

    mock_cdk = types.ModuleType("_cdk")
    mock_cdk.ic = mock_ic
    mock_cdk.Async = _Async
    sys.modules["_cdk"] = mock_cdk

    if Database._instance is None:
        Database.init(db_storage=MockStorage(), audit_enabled=False)

    import ggg  # noqa: F401

    spec = importlib.util.spec_from_file_location("voting_entry_under_test", ENTRY_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    module._mock_ic = mock_ic
    return module


@pytest.fixture(autouse=True)
def clean_db(voting_entry):
    Database.get_instance().clear()
    voting_entry._mock_ic.time.return_value = NOW_S * 1_000_000_000
    voting_entry._mock_ic.set_timer.reset_mock()
    yield


@pytest.fixture
def alice(voting_entry):
    from ggg import User

    user = User(id="alice", nickname="Alice")
    return user


@pytest.fixture
def mock_vote_context(voting_entry, alice, monkeypatch):
    ctx = SimpleNamespace(
        actor="alice",
        subject="alice",
        subject_user=alice,
        delegation_id=None,
        is_delegated=False,
    )

    def _resolve(_args, _operation):
        return ctx

    monkeypatch.setattr(voting_entry, "resolve_acting_context", None, raising=False)
    import core.delegation as delegation

    monkeypatch.setattr(delegation, "resolve_acting_context", _resolve)
    if not hasattr(delegation, "AccessDenied"):
        delegation.AccessDenied = type("AccessDenied", (Exception,), {})
    return ctx


def _cast(voting_entry, proposal_id: str, vote: str = "yes"):
    return json.loads(
        voting_entry.cast_vote(
            json.dumps({"proposal_id": proposal_id, "vote": vote})
        )
    )


def _sweep(voting_entry):
    return json.loads(voting_entry.sweep_expired_proposals("{}"))


def test_cast_vote_rejected_after_deadline(voting_entry, alice, mock_vote_context):
    from ggg import Proposal

    proposal = Proposal(
        proposal_id="prop_expired",
        title="Expired",
        status="voting",
        voting_deadline=PAST_DEADLINE,
        votes_yes=0.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=0.0,
    )

    result = _cast(voting_entry, "prop_expired")
    assert result["success"] is False
    assert "closed" in result["error"].lower()
    assert proposal.votes_yes == 0.0
    assert proposal.total_voters == 0.0


def test_cast_vote_before_deadline_unchanged(voting_entry, alice, mock_vote_context):
    from ggg import Proposal

    proposal = Proposal(
        proposal_id="prop_open",
        title="Open",
        status="voting",
        voting_deadline=FUTURE_DEADLINE,
        votes_yes=0.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=0.0,
        required_threshold=0.6,
    )

    result = _cast(voting_entry, "prop_open")
    assert result["success"] is True
    assert proposal.votes_yes == 1.0
    assert proposal.total_voters == 1.0


def test_sweep_no_quorum_on_expired_org_ballot(voting_entry):
    from core.membership import add_department_member
    from ggg import Department, Proposal, User, Vote

    dept = Department(
        name="SyncDept",
        policy_threshold_m=1,
        policy_threshold_n=1,
        policy_quorum_percent=100,
    )
    alice = User(id="alice", nickname="Alice")
    bob = User(id="bob", nickname="Bob")
    add_department_member(dept, alice)
    add_department_member(dept, bob)

    proposal = Proposal(
        proposal_id="prop_no_quorum",
        title="Sync",
        status="voting",
        voting_deadline=PAST_DEADLINE,
        org_scope="SyncDept",
        votes_yes=1.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=1.0,
    )
    Vote(proposal=proposal, voter=alice, vote_choice="yes")

    result = _sweep(voting_entry)
    assert result["success"] is True
    assert result["data"]["settled_count"] == 1
    assert result["data"]["settled"][0]["outcome"] == "no_quorum"
    assert proposal.status == "no_quorum"


def test_sweep_leaves_future_deadline_untouched(voting_entry):
    from ggg import Proposal

    proposal = Proposal(
        proposal_id="prop_future",
        title="Still open",
        status="voting",
        voting_deadline=FUTURE_DEADLINE,
        org_scope="SyncDept",
    )

    result = _sweep(voting_entry)
    assert result["success"] is True
    assert result["data"]["settled_count"] == 0
    assert "prop_future" in result["data"]["skipped"]
    assert proposal.status == "voting"


def test_sweep_accepts_expired_ballot_that_satisfies_policy(voting_entry):
    from core.membership import add_department_member
    from ggg import Department, Proposal, User, Vote

    dept = Department(
        name="ApproveDept",
        policy_threshold_m=1,
        policy_threshold_n=1,
        policy_quorum_percent=0,
    )
    alice = User(id="alice", nickname="Alice")
    add_department_member(dept, alice)

    proposal = Proposal(
        proposal_id="prop_pass",
        title="Passes on sweep",
        status="voting",
        voting_deadline=PAST_DEADLINE,
        org_scope="ApproveDept",
        votes_yes=1.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=1.0,
    )
    Vote(proposal=proposal, voter=alice, vote_choice="yes")

    result = _sweep(voting_entry)
    assert result["success"] is True
    assert result["data"]["settled"][0]["outcome"] == "accepted"
    assert proposal.status == "accepted"
    voting_entry._mock_ic.set_timer.assert_called_once()


def test_sweep_continues_after_one_malformed_proposal(voting_entry, monkeypatch):
    from core.membership import add_department_member
    from ggg import Department, Proposal, User

    dept = Department(
        name="QuorumDept",
        policy_threshold_m=1,
        policy_threshold_n=1,
        policy_quorum_percent=100,
    )
    alice = User(id="alice", nickname="Alice")
    bob = User(id="bob", nickname="Bob")
    add_department_member(dept, alice)
    add_department_member(dept, bob)

    bad = Proposal(
        proposal_id="prop_bad",
        title="Bad",
        status="voting",
        voting_deadline=PAST_DEADLINE,
        org_scope="QuorumDept",
    )
    good = Proposal(
        proposal_id="prop_good",
        title="Good",
        status="voting",
        voting_deadline=PAST_DEADLINE,
        org_scope="QuorumDept",
        votes_yes=1.0,
        votes_no=0.0,
        votes_abstain=0.0,
        total_voters=1.0,
    )
    from ggg import Vote

    Vote(proposal=good, voter=alice, vote_choice="yes")

    original = voting_entry._settle_open_proposal

    def _settle(proposal):
        if proposal.proposal_id == "prop_bad":
            raise RuntimeError("simulated malformed proposal")
        return original(proposal)

    monkeypatch.setattr(voting_entry, "_settle_open_proposal", _settle)

    result = _sweep(voting_entry)
    assert result["success"] is True
    assert len(result["data"]["errors"]) == 1
    assert result["data"]["errors"][0]["proposal_id"] == "prop_bad"
    assert good.status == "no_quorum"
    assert bad.status == "voting"