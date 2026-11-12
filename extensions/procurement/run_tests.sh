#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
(cd frontend-rt && npm install --no-audit --no-fund --silent && npm test)
# The unit tests do not compile the components: the build does, and the browser tests mount its bundle.
(cd frontend-rt && npm run build)
(cd tests/e2e && npm install --no-audit --no-fund --silent && npx playwright install --with-deps chromium && npx playwright test)
