#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
(cd frontend-rt && npm test)
python3 -m pip install -q pytest
python3 -m pytest tests/test_dispatch_compat.py tests/test_voting.py -q
