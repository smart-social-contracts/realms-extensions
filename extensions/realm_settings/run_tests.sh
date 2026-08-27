#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/frontend-rt"
node --experimental-strip-types --test src/languages.test.ts
