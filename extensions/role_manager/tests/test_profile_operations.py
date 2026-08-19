"""Lockout guard for profile operation edits.

Revoking operations must never leave the realm without a profile holding
``all``, or nobody can administer it again.
"""

import os
import sys

import pytest

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.normpath(os.path.join(_HERE, "..", "backend"))
_REALM_BACKEND = os.path.normpath(
    os.path.join(_HERE, "..", "..", "..", "..", "src", "realm_backend")
)

for _path in (_BACKEND, _REALM_BACKEND):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# Standalone checkouts of this repo have no realm_backend beside them, so the
# ggg package the entry point imports is simply unavailable there.
entry = pytest.importorskip("entry", reason="requires realm_backend on sys.path")


class _FakePermission:
    def __init__(self, name):
        self.name = name


class _FakeProfile:
    def __init__(self, name, allowed=(), permissions=()):
        self.name = name
        self.allowed_to = ",".join(allowed)
        self.permissions = [_FakePermission(p) for p in permissions]


def _with_profiles(monkeypatch, profiles):
    monkeypatch.setattr(
        entry.UserProfile, "instances", staticmethod(lambda: profiles)
    )


def test_effective_ops_unions_both_stores():
    profile = _FakeProfile(
        "member", allowed=["proposal.vote"], permissions=["document.manage"]
    )
    assert entry._profile_effective_ops(profile) == {
        "proposal.vote",
        "document.manage",
    }


def test_guard_allows_change_when_another_profile_keeps_all(monkeypatch):
    admin = _FakeProfile("admin", allowed=["all"])
    member = _FakeProfile("member", allowed=["proposal.vote"])
    _with_profiles(monkeypatch, [admin, member])

    assert entry._realm_would_have_admin_after(member, set())


def test_guard_blocks_stripping_the_last_all(monkeypatch):
    admin = _FakeProfile("admin", allowed=["all"])
    _with_profiles(monkeypatch, [admin])

    assert not entry._realm_would_have_admin_after(admin, {"realm.configure"})


def test_guard_counts_all_held_as_a_permission_entity(monkeypatch):
    """``_check_access`` honours Permission entities as well as ``allowed_to``,
    so a guard reading only ``allowed_to`` would refuse a legitimate edit."""
    admin = _FakeProfile("admin", permissions=["all"])
    member = _FakeProfile("member", allowed=["proposal.vote"])
    _with_profiles(monkeypatch, [admin, member])

    assert entry._realm_would_have_admin_after(member, set())


def test_guard_blocks_revoking_all_held_only_as_a_permission_entity(monkeypatch):
    admin = _FakeProfile("admin", permissions=["all"])
    _with_profiles(monkeypatch, [admin])

    assert not entry._realm_would_have_admin_after(admin, set())
