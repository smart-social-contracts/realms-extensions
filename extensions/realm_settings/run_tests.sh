#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend-rt"
node --experimental-strip-types --test src/languages.test.ts src/departmentTable.test.ts
python3 "$ROOT/tests/test_department_table_entry.py"
