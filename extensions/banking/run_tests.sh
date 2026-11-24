#!/usr/bin/env bash
# The Banking extension's checks: the backend's and the screen's unit tests, the screen's build, the ERPNext
# connector's tests, and the sample files
# against the published schemas
# (needs Java and network access the first time, to download the pinned XSDs). The walk on a local realm,
# tests/e2e/walk.py, is run by hand: it needs a running test-mode realm.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m unittest discover -s tests -p 'test_backend.py'
# The screen builds against realms-gos' bridge (packages/extension-bridge), where frontend-rt/package.json looks for it:
# one level above this repository, as when it is realms-gos' extensions submodule. Elsewhere, REALMS_GOS names a
# realms-gos checkout with the sandbox capabilities (branch cto/sandbox-vault-download or later), linked there.
BRIDGE="$(cd ../../.. && pwd)/packages/extension-bridge"
if [ ! -f "$BRIDGE/package.json" ]; then
  [ -n "${REALMS_GOS:-}" ] || { echo "run_tests.sh: set REALMS_GOS to a realms-gos checkout (for packages/extension-bridge)" >&2; exit 1; }
  mkdir -p "$(dirname "$BRIDGE")" && ln -sfn "$REALMS_GOS/packages/extension-bridge" "$BRIDGE"
fi
[ -f "$BRIDGE/dist/index.js" ] || (cd "$BRIDGE" && npm install --no-audit --no-fund --silent && npm run build)
(cd frontend-rt && npm install --no-audit --no-fund --silent && npm test && npm run build)
(cd erpnext && npm install --no-audit --no-fund --silent && npm test)
bash tests/xsd/check.sh
