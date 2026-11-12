#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
cd frontend-rt && npm install --no-audit --no-fund --silent && npm test
