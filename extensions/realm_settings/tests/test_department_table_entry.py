"""Realm Settings wraps host apply/destroy (realms #358) — no new manifesto."""

import ast
import json
import unittest
from pathlib import Path


ENTRY = Path(__file__).resolve().parents[1] / "backend" / "entry.py"


def _source() -> str:
    return ENTRY.read_text()


class DepartmentTableEntryTests(unittest.TestCase):
    def test_registers_host_department_table_verbs(self):
        tree = ast.parse(_source())
        names = {
            node.name
            for node in ast.walk(tree)
            if isinstance(node, ast.FunctionDef)
        }
        self.assertIn("apply_department_table", names)
        self.assertIn("delete_department", names)
        self.assertIn("list_department_names", names)

    def test_gates_match_host_organization_permissions(self):
        src = _source()
        self.assertIn("ORGANIZATION_ADD", src)
        self.assertIn("ORGANIZATION_DELETE", src)
        self.assertIn("core.department_table", src)
        self.assertIn("core.department_admin", src)
        self.assertIn("document_has_destroy", src)

    def test_parse_json_args_accepts_object_and_rejects_junk(self):
        ns: dict = {"json": json}
        tree = ast.parse(_source())
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == "_parse_json_args":
                exec(
                    compile(ast.Module(body=[node], type_ignores=[]), str(ENTRY), "exec"),
                    ns,
                )
                break
        parse = ns["_parse_json_args"]
        args, err = parse('{"document": {"departments": []}}')
        self.assertIsNone(err)
        self.assertEqual(args["document"]["departments"], [])
        _, err = parse("{")
        self.assertEqual(err["error"], "invalid JSON")


if __name__ == "__main__":
    unittest.main()
