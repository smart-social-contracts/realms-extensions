#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend-rt"
node --experimental-strip-types --test src/lib/helpers.test.ts
