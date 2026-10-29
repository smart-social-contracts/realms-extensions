"""Test an extension against the realm's own operations, in-process.

Loads the unit-test kit of a realms-gos checkout (``REALMS_GOS``, by default the
``realms-gos`` directory next to this repository): a fresh realm per test, the
operations as the canister runs them, Cedar authorization, and backends run the
way ``extension_call`` runs them. Import it from an extension's ``tests/conftest.py``:

    sys.path.insert(0, <this directory>)
    from realm_harness import fresh, install  # noqa: F401

then ``install(<extension dir>)`` and call operations with ``ok`` / ``call`` from ``kit``.
"""

import base64
import importlib.util
import json
import os

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
REALMS_GOS = os.environ.get("REALMS_GOS", os.path.join(HERE, "..", "..", "realms-gos"))
_spec = importlib.util.spec_from_file_location(
    "realm_conftest", os.path.join(REALMS_GOS, "tests", "ggg", "conftest.py")
)
realm_conftest = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(realm_conftest)
fresh = realm_conftest.fresh

import fake_chain  # noqa: E402  (on the path once the realm's conftest is loaded)
import world  # noqa: E402
from ggg import Realm  # noqa: E402
from kit import ok  # noqa: E402


@pytest.fixture
def install(monkeypatch):
    """``install(ext_dir)``: build the example realm of ``world`` and install the extension in
    ``ext_dir`` as its controller ``ctl``, from a stand-in file registry serving its manifest and
    backend. Returns the ``extension_install`` reply."""

    def install(ext_dir):
        with open(os.path.join(ext_dir, "manifest.json")) as f:
            manifest = json.load(f)
        files = {"manifest.json": json.dumps(manifest)}
        if manifest.get("backend"):
            with open(os.path.join(ext_dir, "backend", "entry.py")) as f:
                files["backend/entry.py"] = f.read()

        def call_text(cid, method, arg=None):
            if method == "get_namespace_approval_icc":
                return json.dumps({"approved": True, "approver": "market"})
            content = files[json.loads(arg)["path"]].encode()
            return json.dumps({"content_b64": base64.b64encode(content).decode()})
            yield

        monkeypatch.setattr(fake_chain, "call_text", call_text)
        world.build()
        realm = Realm["1"]
        realm.file_registry_canister_id, realm.marketplace_canister_id = "registry", "market"
        return ok("extension_install", "ctl", extension=manifest["name"], version=manifest["version"])

    return install
