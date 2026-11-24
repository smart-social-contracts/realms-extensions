"""Banking's backend (backend/entry.py), on a stand-in for the realm's ``rpc``: what each function asks the realm, and
what it refuses. The realm runs the same source in its sandbox, as the member, with only the declared operations.

    python3 -m unittest discover -s extensions/banking/tests -p 'test_backend.py'
"""

import json
import pathlib
import unittest

SOURCE = (pathlib.Path(__file__).parent.parent / "backend" / "entry.py").read_text()
MANIFEST = json.loads((pathlib.Path(__file__).parent.parent / "manifest.json").read_text())
SHA = "a" * 64


class Realm:
    """The operations a backend reaches with ``rpc``, refusing what the manifest does not declare."""

    def __init__(self, fail=()):
        self.calls = []
        self.fail = set(fail)
        self.dispatches = []
        self.vote = "voting"
        self.stored = {}

    def rpc(self, action, **args):  # as the realm's sandbox gives it: rpc(action, **kw)
        if action not in MANIFEST["operations"]:
            raise PermissionError(action + " is not declared")
        self.calls.append((action, args))
        if action in self.fail:
            return {"ok": False, "error": action + " refused"}
        if action == "document_store":
            return {"ok": True, "document": args.get("document", "DOC-1")}
        if action == "notification_send":
            self.dispatches.append({"id": "DSP-1", "topic": args["topic"], "title": args["title"]})
            return {"ok": True, "dispatch": "DSP-1"}
        if action == "dispatch_list":
            return {"ok": True, "dispatches": self.dispatches, "next": None}
        if action == "proposal_create":
            return {"ok": True, "proposal": "P-1"}
        if action == "proposal_get":
            return {"ok": True, "proposal": {"id": args.get("proposal"), "status": self.vote}}
        if action == "document_get":
            return {"ok": True, "document": self.stored}
        return {"ok": True}


def backend(realm):
    scope = {"rpc": realm.rpc}
    exec(compile(SOURCE, "entry.py", "exec"), scope)
    return scope


def order(**facts):
    return {"department": "Treasury", "kind": "banking.order", "title": "Payment order M1", "languages": ["en"],
            "ref": "inline:enc", "hash": "h", "keys": {"p": "k"},
            "facts": {"message_id": "M1", "file_sha256": SHA, **facts}}


class CommitOrder(unittest.TestCase):
    def test_stores_the_order_then_names_its_hash_to_the_bank(self):
        realm = Realm()
        out = backend(realm)["commit_order"](**order())
        self.assertEqual(out, {"ok": True, "document": "DOC-1", "dispatch": "DSP-1"})
        self.assertEqual([c[0] for c in realm.calls], ["document_store", "notification_send"])
        sent = realm.calls[1][1]
        self.assertEqual((sent["recipient"], sent["topic"], sent["body"]), ("External:bank", "banking.order", "DOC-1"))
        self.assertEqual(sent["title"], "Payment order M1 sha256:" + SHA)

    def test_a_collection_is_named_as_one(self):
        realm = Realm()
        backend(realm)["commit_order"](**order(kind="collection"))
        self.assertTrue(realm.calls[1][1]["title"].startswith("Direct debit collection M1 "))

    def test_fails_when_the_dispatch_is_refused_so_the_realm_undoes_the_stored_order(self):
        realm = Realm(fail={"notification_send"})
        with self.assertRaises(RuntimeError):
            backend(realm)["commit_order"](**order())

    def test_refuses_an_order_without_a_hash_or_not_sealed(self):
        fns = backend(Realm())
        for bad in (order(file_sha256="nope"), {**order(), "ref": "https://example.org/file"}, {**order(), "keys": {}},
                    {**order(), "kind": "banking.register"}):
            with self.assertRaises(ValueError):
                fns["commit_order"](**bad)

    def test_passes_only_the_fields_of_a_document(self):
        realm = Realm()
        backend(realm)["commit_order"](**order(), recipient="External:someone-else")
        self.assertNotIn("recipient", realm.calls[0][1])


class DownloadAllowed(unittest.TestCase):
    def test_allows_a_file_only_once_an_order_names_its_hash(self):
        realm = Realm()
        fns = backend(realm)
        self.assertFalse(fns["download_allowed"]("M1.xml", SHA, 10)["allowed"])
        fns["commit_order"](**order())
        self.assertEqual(fns["download_allowed"]("M1.xml", SHA, 10), {"ok": True, "allowed": True})
        self.assertFalse(fns["download_allowed"]("M1.xml", "b" * 64, 10)["allowed"])

    def test_a_dispatch_of_another_topic_does_not_count(self):
        realm = Realm()
        realm.dispatches.append({"id": "DSP-9", "topic": "banking.status", "title": "x sha256:" + SHA})
        self.assertFalse(backend(realm)["download_allowed"]("M1.xml", SHA, 10)["allowed"])


class FileFromTheErp(unittest.TestCase):
    MOTION = {"title": "Approve payment file M1", "description": "Its sha256 is " + SHA + ".", "kind": "payment file"}

    def test_files_the_motion_then_stores_the_file_naming_it(self):
        realm = Realm()
        out = backend(realm)["propose_file"](order(), self.MOTION)
        self.assertEqual(out, {"ok": True, "document": "DOC-1", "proposal": "P-1"})
        self.assertEqual([c[0] for c in realm.calls], ["proposal_create", "document_store"])
        self.assertEqual(realm.calls[1][1]["facts"]["proposal"], "P-1")

    def test_a_motion_must_name_the_files_hash(self):
        with self.assertRaises(ValueError):
            backend(Realm())["propose_file"](order(), {**self.MOTION, "description": "approve it"})

    def test_commits_only_once_the_realm_says_the_vote_approved(self):
        realm = Realm()
        realm.stored = {"kind": "banking.order", "facts": {"proposal": "P-1", "message_id": "M1", "file_sha256": SHA}}
        fns = backend(realm)
        with self.assertRaises(ValueError):
            fns["commit_approved"]("DOC-1")
        self.assertNotIn("notification_send", [c[0] for c in realm.calls])
        realm.vote = "accepted"
        self.assertEqual(fns["commit_approved"]("DOC-1"), {"ok": True, "dispatch": "DSP-1"})
        self.assertEqual(realm.calls[-1][1]["title"], "Payment file M1 approved by P-1 sha256:" + SHA)
        self.assertTrue(fns["download_allowed"]("M1.xml", SHA, 10)["allowed"])


class OtherWrites(unittest.TestCase):
    def test_each_store_takes_its_own_kind_only(self):
        fns = backend(Realm())
        with self.assertRaises(ValueError):
            fns["save_register"](**order())
        with self.assertRaises(ValueError):
            fns["import_statement"](order(), [])

    def test_a_statement_is_stored_then_reported(self):
        realm = Realm()
        statement = {**order(), "kind": "banking.statement", "facts": {"reports": [{"statement": "S1"}]}}
        out = backend(realm)["import_statement"](statement, [{"statement": "S1"}])
        self.assertEqual(out, {"ok": True, "document": "DOC-1"})
        self.assertEqual([c[0] for c in realm.calls], ["document_store", "external_report"])
        self.assertEqual(realm.calls[1][1]["evidence_ref"], "DOC-1")

    def test_calls_only_declared_operations(self):
        realm = Realm()
        fns = backend(realm)
        for name in ("me", "department_chart", "document_list", "document_get", "dispatch_list", "external_list",
                     "proposal_get"):
            fns[name]()
        fns["register_bank"]("Example Bank")
        fns["dispatch_confirm"]("DSP-1", {"Confirmed": {"receipt": "R"}})
        self.assertTrue(all(c[0] in MANIFEST["operations"] for c in realm.calls))


if __name__ == "__main__":
    unittest.main()
