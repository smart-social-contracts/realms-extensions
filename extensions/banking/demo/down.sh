#!/usr/bin/env bash
# Stops the demo that up.sh started: the connectors, the realm's local network, ERPNext and Odoo.
#   down.sh               stop; ERPNext and Odoo keep their data (the realm cannot: a local network keeps no state)
#   down.sh --wipe        also delete ERPNext's and Odoo's data and DEMO_HOME
#   down.sh --connectors  only the connectors
set -uo pipefail
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEMO_HOME=${DEMO_HOME:-$HOME/.realms-banking-demo}
PROJECT=${DEMO_PROJECT:-realms-banking-demo}
export REALMS_HOME=$DEMO_HOME/realms REALMS_LOCAL_HOME=$DEMO_HOME/realms/local OCA_DIR=$DEMO_HOME/odoo/oca ODOO_PORT=${ODOO_PORT:-8069}

for pid in "$DEMO_HOME"/connector-*.pid; do
  [ -f "$pid" ] || continue
  # the subshell that started it, and the connector it runs
  pkill -P "$(cat "$pid")" 2>/dev/null; kill "$(cat "$pid")" 2>/dev/null; rm -f "$pid"
done
[ "${1:-}" = --connectors ] && exit 0

if [ -n "${REALMS_GOS:-}" ]; then
  PYTHONPATH="$REALMS_GOS/cli" "${CLI_PYTHON:-python3}" -c "from realms.cli.main import app; app()" local stop
elif [ -f "$REALMS_LOCAL_HOME/icp.yaml" ]; then
  (cd "$REALMS_LOCAL_HOME" && icp network stop) 2>/dev/null
fi

WIPE=(); [ "${1:-}" = --wipe ] && WIPE=(-v)
[ -f "$DEMO_HOME/erpnext/pwd.yml" ] && docker compose -p "$PROJECT-erpnext" -f "$DEMO_HOME/erpnext/pwd.yml" down "${WIPE[@]}"
docker compose -p "$PROJECT-odoo" -f "$HERE/odoo/compose.yml" down "${WIPE[@]}"
[ "${1:-}" = --wipe ] && rm -rf "$DEMO_HOME"
exit 0
