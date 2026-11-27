#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend-rt"
npm install --no-audit --no-fund --silent
# Runs before the build, so in CI it checks the committed dist/index.js: the file a publish without
# `realms files build` ships (realms-gos#831).
npm test
# The unit tests do not compile the component: the build does.
npm run build
