#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend-rt"
npm install --no-audit --no-fund --silent
npm test
# The unit tests do not compile the components: the build does.
npm run build
