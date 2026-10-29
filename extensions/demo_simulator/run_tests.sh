#!/usr/bin/env bash
# The backend against the realm's own operations (testing/realm_harness.py): needs a
# realms-gos checkout (REALMS_GOS, default ../realms-gos next to this repository) and its
# test requirements (pytest, cedarpy, ic-python-db).
set -euo pipefail
cd "$(dirname "$0")"
PYTHONDONTWRITEBYTECODE=1 python3 -m pytest tests -q -p no:cacheprovider "$@"
