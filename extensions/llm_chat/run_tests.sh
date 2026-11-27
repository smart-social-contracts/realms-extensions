#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend-rt"
npm ci --no-audit --no-fund --silent
npm test
# The unit tests do not compile the component: the build does.
npm run build
# dist/index.js is committed, and a publish without `realms files build` ships that file as it is:
# staging's llm_chat 1.0.22 was the September copy, byte for byte. So the committed bundle must be this build.
if ! git diff --quiet -- dist/index.js; then
  echo "::error file=extensions/llm_chat/frontend-rt/dist/index.js::the committed bundle is not the build of this source; run extensions/llm_chat/run_tests.sh and commit frontend-rt/dist/index.js"
  exit 1
fi
