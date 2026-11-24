#!/usr/bin/env bash
# The Banking extension's checks: unit tests, the bundle build, the ERPNext connector's tests, and the sample files
# against the published schemas
# (needs Java and network access the first time, to download the pinned XSDs). The walk on a local realm,
# tests/e2e/walk.py, is run by hand: it needs a running test-mode realm.
set -euo pipefail
cd "$(dirname "$0")"
(cd frontend-rt && npm install --no-audit --no-fund --silent && npm test && npm run build)
(cd erpnext && npm install --no-audit --no-fund --silent && npm test)
bash tests/xsd/check.sh
