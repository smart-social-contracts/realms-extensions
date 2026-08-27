"""Poll submit must not ImportError when the host lacks freeze_action."""

import json
import os
import sys
import types

import pytest

_BACKEND = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

import dispatch_compat  # noqa: E402


def _install_dispatch(monkeypatch, module):
    core = types.ModuleType("core")
    core.proposal_dispatch = module
    monkeypatch.setitem(sys.modules, "core", core)
    monkeypatch.setitem(sys.modules, "core.proposal_dispatch", module)


def test_freeze_poll_swallows_leftover_getattr_importerror(monkeypatch):
    leftover = types.ModuleType("core.proposal_dispatch")

    def _raise(name):
        raise ImportError(
            "cannot import name 'freeze_action' from 'core.proposal_dispatch' "
            "(unknown location)"
        )

    leftover.__getattr__ = _raise
    _install_dispatch(monkeypatch, leftover)

    action, permissions, err = dispatch_compat.freeze_action("poll", {})
    assert err is None
    assert action == {}
    assert permissions == []


def test_freeze_poll_without_host_freeze_action_does_not_import_error(monkeypatch):
    leftover = types.ModuleType("core.proposal_dispatch")
    leftover.__file__ = None
    leftover.__loader__ = None
    _install_dispatch(monkeypatch, leftover)

    with pytest.raises(ImportError, match="freeze_action"):
        from core.proposal_dispatch import freeze_action  # noqa: F401

    action, permissions, err = dispatch_compat.freeze_action("poll", {})
    assert err is None
    assert action == {}
    assert permissions == []


def test_freeze_poll_uses_host_freeze_action_when_exported(monkeypatch):
    host = types.ModuleType("core.proposal_dispatch")

    def _host_freeze(proposal_type, raw_action, **kwargs):
        return {"from_host": True}, ["x"], None

    host.freeze_action = _host_freeze
    _install_dispatch(monkeypatch, host)

    action, permissions, err = dispatch_compat.freeze_action("poll", {})
    assert err is None
    assert action == {"from_host": True}
    assert permissions == ["x"]


def test_freeze_non_poll_without_host_returns_visible_error(monkeypatch):
    leftover = types.ModuleType("core.proposal_dispatch")
    _install_dispatch(monkeypatch, leftover)

    action, permissions, err = dispatch_compat.freeze_action("transaction", {})
    assert action == {}
    assert permissions == []
    assert err["error_code"] == "host_dispatch_unavailable"
    assert "freeze_action" in err["error"]


def test_submit_gate_poll_is_proposal_create_without_host(monkeypatch):
    leftover = types.ModuleType("core.proposal_dispatch")
    _install_dispatch(monkeypatch, leftover)
    assert dispatch_compat.submit_gate("poll", {}) == "proposal.create"


def test_entry_does_not_name_import_freeze_action():
    entry_path = os.path.join(_BACKEND, "entry.py")
    code_lines = []
    for line in open(entry_path, encoding="utf-8"):
        stripped = line.split("#", 1)[0].strip()
        if stripped:
            code_lines.append(stripped)
    code = "\n".join(code_lines)
    assert "from core.proposal_dispatch import freeze_action" not in code
    assert "import freeze_action" not in code


def test_submit_proposal_poll_persists_when_host_lacks_freeze_action(monkeypatch):
    leftover = types.ModuleType("core.proposal_dispatch")
    leftover.DispatchError = type("DispatchError", (Exception,), {})
    leftover.uses_timelock = lambda *a, **k: False
    leftover.baton_configured = lambda: False
    leftover.registry_canister_id = lambda: ""
    leftover.dispatch_proposal = lambda proposal: None
    _install_dispatch(monkeypatch, leftover)

    created = []

    class _User:
        def __init__(self, user_id):
            self.id = user_id

        @classmethod
        def __class_getitem__(cls, user_id):
            return cls(user_id)

        @staticmethod
        def count():
            return 1

        @staticmethod
        def load_some(from_id, count):
            return [_User("2eqns")]

        @staticmethod
        def instances():
            return []

    class _Proposal:
        @staticmethod
        def instances():
            return []

        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
            self._id = 1
            self._timestamp_created = 1_700_000_000_000
            created.append(self)

    class _Notification:
        def __init__(self, **kwargs):
            pass

    class _Realm:
        @classmethod
        def __class_getitem__(cls, _k):
            return None

    class _Ic:
        @staticmethod
        def caller():
            return types.SimpleNamespace(to_str=lambda: "2eqns")

        @staticmethod
        def time():
            return 1_700_000_000_000_000_000

    ggg = types.ModuleType("ggg")
    ggg.Notification = _Notification
    ggg.Proposal = _Proposal
    ggg.User = _User
    ggg.Vote = type("Vote", (), {"instances": staticmethod(lambda: [])})
    ggg.Codex = type("Codex", (), {"__class_getitem__": classmethod(lambda cls, k: None)})
    ggg.Realm = _Realm
    ggg.Department = type("Department", (), {"__class_getitem__": classmethod(lambda cls, k: None)})

    class _Async:
        def __class_getitem__(cls, _item):
            return cls

    basilisk = types.ModuleType("basilisk")
    basilisk.Async = _Async
    basilisk.ic = _Ic
    mgmt = types.ModuleType("basilisk.canisters")
    mgmt_can = types.ModuleType("basilisk.canisters.management")
    mgmt_can.management_canister = object()

    logging_mod = types.ModuleType("ic_python_logging")
    logging_mod.get_logger = lambda name: types.SimpleNamespace(
        info=lambda *a, **k: None,
        warning=lambda *a, **k: None,
        error=lambda *a, **k: None,
    )

    access = types.ModuleType("core.access")
    access._check_access = lambda principal, gate: True
    errors = types.ModuleType("core.extension_errors")
    errors.permission_denied_payload = lambda msg, op: {
        "success": False,
        "error": msg,
        "error_code": "permission_denied",
        "denied_operation": op,
    }
    hooks = types.ModuleType("core.codex_hooks")
    hooks.call_role_hook = lambda *a, **k: {}

    for name, mod in {
        "ggg": ggg,
        "basilisk": basilisk,
        "basilisk.canisters": mgmt,
        "basilisk.canisters.management": mgmt_can,
        "ic_python_logging": logging_mod,
        "core.access": access,
        "core.extension_errors": errors,
        "core.codex_hooks": hooks,
    }.items():
        monkeypatch.setitem(sys.modules, name, mod)

    core = sys.modules["core"]
    core.access = access
    core.extension_errors = errors
    core.codex_hooks = hooks

    pkg_name = "_runtime_ext_voting_test"
    package = types.ModuleType(pkg_name)
    package.__path__ = [_BACKEND]
    package.__package__ = pkg_name
    monkeypatch.setitem(sys.modules, pkg_name, package)

    compat_name = f"{pkg_name}.dispatch_compat"
    compat = types.ModuleType(compat_name)
    compat.__file__ = os.path.join(_BACKEND, "dispatch_compat.py")
    compat.__package__ = pkg_name
    exec(open(os.path.join(_BACKEND, "dispatch_compat.py"), encoding="utf-8").read(), compat.__dict__)
    monkeypatch.setitem(sys.modules, compat_name, compat)
    package.dispatch_compat = compat

    entry_name = f"{pkg_name}.entry"
    entry = types.ModuleType(entry_name)
    entry.__file__ = os.path.join(_BACKEND, "entry.py")
    entry.__package__ = pkg_name
    monkeypatch.setitem(sys.modules, entry_name, entry)
    exec(open(os.path.join(_BACKEND, "entry.py"), encoding="utf-8").read(), entry.__dict__)

    args = json.dumps({
        "title": "QA poll",
        "description": "Does poll submit persist?",
        "proposal_type": "poll",
        "action": {},
    })
    gen = entry.submit_proposal(args)
    try:
        next(gen)
        raise AssertionError("poll submit should not suspend")
    except StopIteration as done:
        result = json.loads(done.value)

    assert result.get("success") is True, result
    assert created, "Proposal was not persisted"
    assert created[0].title == "QA poll"
    assert created[0].status == "voting"
    meta = json.loads(created[0].metadata)
    assert meta["proposal_type"] == "poll"
    assert meta["action"] == {}
    assert result["data"]["title"] == "QA poll"
