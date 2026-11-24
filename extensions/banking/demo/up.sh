#!/usr/bin/env bash
# A local realm with the Banking extension, ERPNext and Odoo, and the two connectors between them, ready to try.
#
#   REALMS_GOS=~/src/realms-gos extensions/banking/demo/up.sh      everything (first run: 30–60 min, mostly downloads)
#   extensions/banking/demo/up.sh realm|erpnext|odoo|connectors    one part (realm needs REALMS_GOS)
#   extensions/banking/demo/up.sh urls                             print the addresses again
#   extensions/banking/demo/down.sh [--wipe]                       stop it all
#
# Needs: docker with compose v2, node 22+ and npm, python3, git, curl; ~15 GB of disk for the images.
# The realm is built from a realms-gos checkout (REALMS_GOS) on branch cto/sandbox-vault-download, with its submodules:
# no release has yet what Banking needs (its operations, extension backends, and the sandbox's vault and download), and
# Banking's sandboxed screen builds against that checkout's bridge (packages/extension-bridge). It needs the checkout's
# build environment (its AGENTS.md: BUILD_PYTHON is a Python with basilisk) and the realms CLI's Python packages
# (pip install -e "$REALMS_GOS/cli"; CLI_PYTHON if not python3).
#
# Everything is local and made up: example IBANs, invented suppliers, demo passwords (admin / admin). The state is in
# DEMO_HOME (~/.realms-banking-demo); nothing is written in this repository but the extensions' build output.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BANKING=$(dirname "$HERE")
CONNECTORS=$BANKING/connectors
DEMO_HOME=${DEMO_HOME:-$HOME/.realms-banking-demo}
PROJECT=${DEMO_PROJECT:-realms-banking-demo}
REALM_PORT=${REALM_PORT:-8000}
ERPNEXT_PORT=${ERPNEXT_PORT:-8080}
ODOO_PORT=${ODOO_PORT:-8069}
export REALMS_HOME=$DEMO_HOME/realms REALMS_LOCAL_HOME=$DEMO_HOME/realms/local

# Pinned sources: frappe_docker's single-host compose file (ERPNext v16.60.0), and the OCA modules for Odoo 18.
FRAPPE_DOCKER=48b9479a9697d0049e795fd7b682eb6544923410
FRAPPE_PWD_SHA256=940af608ae22276ae660357e7bf33944c0fb16e87f505cf535658f415b3ff978
OCA=(bank-payment:24ba2409a0be5fc9338c2d800f04aa7846808745
     l10n-switzerland:f3f39f871611b08bbb837eff354ac338a956f8c1
     server-ux:c69ed17abb938c1a46e295118834a3e1b6319da3)

# The realm's test sign-in: Identities 1 and 2 hold the treasury's two seats.
IDENTITY_1=2eqns-rmzes-7npxw-dxpw2-qdy2s-mw6ix-svdo2-oya7o-a6ldc-sqgwh-bqe
IDENTITY_2=z32zf-ic72u-jhtqq-ojjqp-jblhx-dxxin-vqelt-ljmo4-ymwmh-gcnzo-hae
# The core extensions and those of the agora codex, published from realms-gos' extensions submodule; Banking from here.
CORE="access_manager admin_dashboard codex_viewer import_export journal member_dashboard mundus_explorer public_dashboard
      realm_settings role_manager task_monitor vault voting"
AGORA="department_docs justice_litigation land_registry managed_services member_manager metrics notifications
       package_manager procurement system_info zone_selector"

say() { printf '\n== %s\n' "$*"; }
die() { printf 'up.sh: %s\n' "$*" >&2; exit 1; }
mkdir -p "$DEMO_HOME/logs"

# ── the realm ─────────────────────────────────────────────────────────────────────────────────────────────────────

realms() {
  PYTHONPATH="$REALMS_GOS/cli${PYTHONPATH:+:$PYTHONPATH}" "${CLI_PYTHON:-python3}" -c \
    "from realms.cli.main import app; app()" "$@"
}

# An operation as the realm's founder; stops the script if the realm refuses it.
call() {
  local out
  out=$(COLUMNS=100000 realms local call "$1" "$2" --json 2>&1) || die "$1: $out"
  python3 -c 'import json,sys
d = json.loads(sys.argv[2])
if isinstance(d, dict) and d.get("ok") is False: sys.exit(f"{sys.argv[1]}: {d}")
print(f"  {sys.argv[1]}: ok")' "$1" "$out" || die "the realm refused $1"
}

state() { python3 -c 'import json,sys; s=json.load(open(sys.argv[1])); print(eval(sys.argv[2], {}, {"s": s}))' \
  "$REALMS_LOCAL_HOME/state.json" "$1"; }

build_realm() {
  local cache=$REALMS_HOME/cache/realms-gos/main commit
  commit=$(git -C "$REALMS_GOS" rev-parse --short HEAD)
  if [ -z "${REBUILD:-}" ] && [ "$(cat "$cache/built-from" 2>/dev/null)" = "$commit" ]; then
    echo "  realm already built from realms-gos $commit"; return
  fi
  mkdir -p "$cache"
  local did=src/realm_backend/realm_backend.did did_clean=1
  git -C "$REALMS_GOS" diff --quiet -- "$did" || did_clean=0
  echo "  realm backend (test build) from realms-gos $commit"
  (cd "$REALMS_GOS" && PATH="$(dirname "${BUILD_PYTHON:-$(command -v python3)}"):$PATH" \
    "${BUILD_PYTHON:-python3}" scripts/pack_realm_backend.py --variant test --gzip --version "demo-$commit") \
    > "$DEMO_HOME/logs/build-realm.log" 2>&1 || die "the realm backend did not build: $DEMO_HOME/logs/build-realm.log"
  cp "$REALMS_GOS/.basilisk/realm_backend/realm_backend.wasm.gz" "$cache/realm-backend-main.wasm.gz"
  # the build rewrites the tracked candid file: put it back, unless it held changes of its own
  [ "$did_clean" = 1 ] && git -C "$REALMS_GOS" checkout -- "$did"
  echo "  realm shell (test build)"
  (cd "$REALMS_GOS" && { [ -d node_modules ] || npm install --no-audit --no-fund; } \
    && npm run build --workspace packages/extension-bridge \
    && cd src/realm_frontend && REALMS_BUILD_VARIANT=test npm run build) \
    >> "$DEMO_HOME/logs/build-realm.log" 2>&1 || die "the realm shell did not build: $DEMO_HOME/logs/build-realm.log"
  tar -czf "$cache/realm-frontend-main.tar.gz" -C "$REALMS_GOS/src/realm_frontend" dist
  (cd "$cache" && sha256sum realm-backend-main.wasm.gz realm-frontend-main.tar.gz > checksums-main.txt)
  echo "$commit" > "$cache/built-from"
}

build_extensions() {
  echo "  extension screens (built once; banking every time)"
  # the core and agora extensions from realms-gos' own extensions submodule: the versions its realm is built with, and
  # their sandboxed screens build against its packages
  (cd "$REALMS_GOS" && npm run build --workspace packages/extension-ui) > "$DEMO_HOME/logs/build-extension-ui.log" 2>&1 \
    || die "realms-gos packages/extension-ui did not build: $DEMO_HOME/logs/build-extension-ui.log"
  rm -rf "$BANKING/frontend-rt/dist"
  # Banking's screen finds the bridge one level above this repository, as when it is realms-gos' extensions submodule
  local bridge
  bridge="$(cd "$BANKING/../../.." && pwd)/packages/extension-bridge"
  [ -f "$bridge/package.json" ] || { mkdir -p "$(dirname "$bridge")" && ln -sfn "$REALMS_GOS/packages/extension-bridge" "$bridge"; }
  local todo=() e ui
  # built: a screen that is a page of its own (index.html at its root, as a sandboxed one is) once dist/index.html
  # exists; an in-page bundle once dist/index.js does. (Some repositories commit a placeholder dist/index.js.)
  built() { if [ -f "$1/index.html" ]; then [ -f "$1/dist/index.html" ]; else [ -f "$1/dist/index.js" ]; fi; }
  for e in $CORE $AGORA; do
    for ui in frontend-rt frontend; do
      [ -f "$EXT_SRC/$e/$ui/package.json" ] && ! built "$EXT_SRC/$e/$ui" && todo+=("$EXT_SRC/$e/$ui")
    done
  done
  todo+=("$BANKING/frontend-rt")
  export DEMO_HOME
  printf '%s\n' "${todo[@]}" | xargs -P 4 -I{} bash -c '
    log="$DEMO_HOME/logs/build-$(basename "$(dirname "{}")")-$(basename "{}").log"
    if (cd "{}" && npm install --no-audit --no-fund && npm run build) > "$log" 2>&1; then echo "    {}"
    else echo "    {} FAILED: $log"; exit 255; fi' \
    || die "an extension screen did not build"
}

agora_codex() {
  if [ -f "$REALMS_GOS/codices/codices/agora/manifest.json" ]; then echo "$REALMS_GOS/codices/codices/agora"; return; fi
  local sha dir
  sha=$(git -C "$REALMS_GOS" ls-tree HEAD codices | awk '{print $3}')
  dir=$DEMO_HOME/realms-codices-$sha
  if [ ! -f "$dir/codices/agora/manifest.json" ]; then
    mkdir -p "$dir"
    curl -fsSL "https://codeload.github.com/smart-social-contracts/realms-codices/tar.gz/$sha" | tar -xz -C "$dir" --strip-components 1
  fi
  echo "$dir/codices/agora"
}

up_realm() {
  [ -n "${REALMS_GOS:-}" ] && [ -d "$REALMS_GOS/src/realm_backend" ] || die "set REALMS_GOS to a realms-gos checkout"
  EXT_SRC=$REALMS_GOS/extensions/extensions
  [ -f "$EXT_SRC/voting/manifest.json" ] \
    || die "realms-gos has no extensions submodule: git -C \"$REALMS_GOS\" submodule update --init extensions"
  say "realm: build"
  build_realm
  build_extensions
  (cd "$CONNECTORS" && npm install --no-audit --no-fund --silent)

  say "realm: start on port $REALM_PORT (a fresh one: a local realm keeps no state across restarts)"
  # On realms-gos main the start stops at its core-extensions step, after the realm is deployed; the core extensions
  # are published below instead.
  realms local start --version main --port "$REALM_PORT" --yes --fresh --no-core-ui > "$DEMO_HOME/logs/realm-start.log" 2>&1 || true
  [ "$(state 's.get("deployed")')" = True ] || die "the realm was not deployed: $DEMO_HOME/logs/realm-start.log"
  # Every opening of a sealed record derives a vetKey, for a fee in cycles: a local realm gets plenty
  (cd "$REALMS_LOCAL_HOME" && icp canister top-up realm_backend --amount 20t -e local --identity realms-local) > /dev/null

  say "realm: publish the extensions and the agora codex"
  local paths=() codex
  for e in $CORE $AGORA; do paths+=("$EXT_SRC/$e"); done
  codex=$(agora_codex)
  realms local publish "${paths[@]}" "$codex" > "$DEMO_HOME/logs/realm-publish.log" 2>&1 \
    || die "publishing failed: $DEMO_HOME/logs/realm-publish.log"
  python3 - "$REALMS_LOCAL_HOME/state.json" "$CORE" <<'EOF'
import json, sys
s = json.load(open(sys.argv[1])); s["core_extensions"] = sys.argv[2].split()
json.dump(s, open(sys.argv[1], "w"), indent=2)
EOF

  say "realm: test sign-in and members, then launch with agora"
  call realm_configure '{"test_mode": true, "test_flags": {"test_mode_ii_bypass": true}}'
  realms local add-admin "$IDENTITY_1" > /dev/null
  call user_add "{\"user\": \"$IDENTITY_2\"}"
  realms local setup --codex agora > "$DEMO_HOME/logs/realm-setup.log" 2>&1 || die "launch failed: $DEMO_HOME/logs/realm-setup.log"

  say "realm: install Banking; a Treasury department, its two seats, the bank"
  realms local publish "$BANKING" --install > "$DEMO_HOME/logs/realm-banking.log" 2>&1 \
    || die "installing Banking failed: $DEMO_HOME/logs/realm-banking.log"
  call profile_create '{"profile": "banking.treasurer", "description": "Treasury staff who pay through the bank (demo)",
    "allowed_to": ["treasury.view", "treasury.manage", "document.manage", "notification.send", "dispatch.confirm",
                   "external.report", "user.view"]}'
  call department_create '{"department": "Treasury", "description": "Pays and is paid through the realm bank account (demo)"}'
  call position_create '{"department": "Treasury", "position": "treasury.treasurer", "title": "treasurer", "headcount": 3,
    "profile": "banking.treasurer"}'
  call appoint "{\"position\": \"treasury.treasurer\", \"user\": \"$IDENTITY_1\"}"
  call appoint "{\"position\": \"treasury.treasurer\", \"user\": \"$IDENTITY_2\"}"
  call external_add '{"external": "bank", "name": "Example Bank (demo)", "kind": "bank", "channel": "manual"}'
  call department_set_policy '{"department": "Treasury", "m": 2, "n": 2}'

  say "realm: the connectors' member (its key: $DEMO_HOME/connector-identity.json)"
  local principal
  principal=$(cd "$CONNECTORS" && node --experimental-strip-types --disable-warning=ExperimentalWarning -e "
    import('./src/realm-client.ts').then((m) => console.log(m.identityAt('$DEMO_HOME/connector-identity.json').getPrincipal().toText()))")
  call user_add "{\"user\": \"$principal\", \"nickname\": \"ERP connector\"}"   # a member from now on
  call profile_create '{"profile": "erp.connector", "description": "Sends approved ERP payment files to the bank outbox (demo)",
    "allowed_to": ["notification.send"]}'
  call role_assign "{\"user\": \"$principal\", \"profile\": \"erp.connector\"}"
  {
    echo "REALM_HOST=http://127.0.0.1:$REALM_PORT"
    echo "REALM_CANISTER=$(state 's["canisters"]["realm_backend"]')"
    echo "REALM_IDENTITY=$DEMO_HOME/connector-identity.json"
    echo "REALM_TREASURY=Treasury"
  } > "$DEMO_HOME/realm.env"
}

# ── ERPNext ───────────────────────────────────────────────────────────────────────────────────────────────────────

erpnext_compose() { docker compose -p "$PROJECT-erpnext" -f "$DEMO_HOME/erpnext/pwd.yml" "$@"; }
erpnext_bench() { erpnext_compose exec -T backend bench --site frontend execute "$@" 2>/dev/null | tail -1; }
erpnext_url=http://127.0.0.1:$ERPNEXT_PORT

up_erpnext() {
  say "ERPNext v16 on port $ERPNEXT_PORT"
  mkdir -p "$DEMO_HOME/erpnext"
  local pwd=$DEMO_HOME/erpnext/pwd.yml
  if [ ! -f "$pwd" ]; then
    curl -fsSL -o "$pwd.orig" "https://raw.githubusercontent.com/frappe/frappe_docker/$FRAPPE_DOCKER/pwd.yml"
    echo "$FRAPPE_PWD_SHA256  $pwd.orig" | sha256sum -c --quiet || die "frappe_docker's pwd.yml is not the pinned one"
    sed "s/      - \"8080:8080\"/      - \"127.0.0.1:$ERPNEXT_PORT:8080\"/" "$pwd.orig" > "$pwd"
  fi
  erpnext_compose up -d > "$DEMO_HOME/logs/erpnext-up.log" 2>&1 || die "ERPNext did not start: $DEMO_HOME/logs/erpnext-up.log"
  echo "  waiting for the site (its first start creates it and installs ERPNext: 5–15 minutes)"
  # frappe_docker's create-site job runs once; the site takes logins before ERPNext is installed in it, so wait for the
  # job itself to finish
  for _ in $(seq 1 180); do
    [ "$(erpnext_compose ps -a --format '{{.State}} {{.ExitCode}}' create-site 2>/dev/null)" = "exited 0" ] && break
    erpnext_compose ps -a --format '{{.State}} {{.ExitCode}}' create-site 2>/dev/null | grep -q '^exited [1-9]' \
      && die "ERPNext's site creation failed: docker compose -p $PROJECT-erpnext logs create-site"
    sleep 10
  done
  for _ in $(seq 1 60); do
    curl -s --max-time 5 -X POST "$erpnext_url/api/method/login" -H 'Content-Type: application/json' \
      -d '{"usr": "Administrator", "pwd": "admin"}' | grep -q '"Logged In"' && break
    sleep 5
  done
  # API keys for the connector. The site's encryption key is made first; the web workers read the site config once,
  # so they are restarted to see it (and nginx with them, which keeps the backend's address).
  erpnext_bench frappe.utils.password.get_encryption_key > /dev/null
  erpnext_compose restart backend frontend > /dev/null 2>&1
  for _ in $(seq 1 60); do curl -s --max-time 5 "$erpnext_url/api/method/ping" | grep -q pong && break; sleep 3; done
  local secret key
  secret=$(erpnext_bench frappe.core.doctype.user.user.generate_keys --args "['Administrator']" \
    | python3 -c 'import ast,json,sys; t=sys.stdin.read().strip(); d=json.loads(t) if t.startswith("{\"") else ast.literal_eval(t); print(d["api_secret"])')
  key=$(erpnext_bench frappe.client.get_value --kwargs "{'doctype': 'User', 'filters': 'Administrator', 'fieldname': 'api_key'}" \
    | python3 -c 'import ast,json,sys; t=sys.stdin.read().strip(); d=json.loads(t) if t.startswith("{\"") else ast.literal_eval(t); print(d["api_key"])')
  curl -s -H "Authorization: token $key:$secret" "$erpnext_url/api/method/frappe.auth.get_logged_user" | grep -q Administrator \
    || die "ERPNext does not take the connector's API key"
  printf 'ERPNEXT_URL=%s\nERPNEXT_KEY=%s\nERPNEXT_SECRET=%s\n' "$erpnext_url" "$key" "$secret" > "$DEMO_HOME/erpnext.env"
  echo "  the company, the two doctypes, three suppliers, their invoices and a draft payment run"
  (cd "$CONNECTORS" && npm install --no-audit --no-fund --silent && set -a && . "$DEMO_HOME/erpnext.env" && set +a \
    && npm run --silent setup-erpnext) > "$DEMO_HOME/logs/erpnext-setup.log" 2>&1 \
    || die "the ERPNext setup failed: $DEMO_HOME/logs/erpnext-setup.log"
}

# ── Odoo ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export ODOO_PORT OCA_DIR=$DEMO_HOME/odoo/oca
odoo_compose() { docker compose -p "$PROJECT-odoo" -f "$HERE/odoo/compose.yml" "$@"; }
ODOO_ARGS="--addons-path=/usr/lib/python3/dist-packages/odoo/addons,/mnt/oca/bank-payment,/mnt/oca/l10n-switzerland,/mnt/oca/server-ux
  --db_host db --db_user odoo --db_password odoo -d realms --without-demo=all"

up_odoo() {
  say "Odoo 18 with the OCA payment modules on port $ODOO_PORT"
  for repo in "${OCA[@]}"; do
    local name=${repo%%:*} sha=${repo#*:} dir=$OCA_DIR/${repo%%:*}
    if [ "$(git -C "$dir" rev-parse HEAD 2>/dev/null)" != "$sha" ]; then
      echo "  OCA/$name at ${sha:0:10}"
      rm -rf "$dir" && mkdir -p "$dir"
      git -C "$dir" init -q && git -C "$dir" fetch -q --depth 1 "https://github.com/OCA/$name.git" "$sha" && git -C "$dir" checkout -q FETCH_HEAD
    fi
  done
  odoo_compose build -q > "$DEMO_HOME/logs/odoo-build.log" 2>&1 || die "the Odoo image did not build: $DEMO_HOME/logs/odoo-build.log"
  odoo_compose up -d db > /dev/null 2>&1
  for _ in $(seq 1 30); do odoo_compose exec -T db pg_isready -U odoo > /dev/null 2>&1 && break; sleep 2; done
  if ! odoo_compose exec -T db psql -U odoo -lqt 2>/dev/null | cut -d'|' -f1 | grep -qw realms; then
    echo "  the database: base, a Swiss company, then the modules (10–20 min)"
    # shellcheck disable=SC2086
    {
      odoo_compose run --rm odoo odoo $ODOO_ARGS -i base --stop-after-init
      odoo_compose run --rm -T odoo odoo shell $ODOO_ARGS --no-http < "$HERE/odoo/company.py"
      odoo_compose run --rm odoo odoo $ODOO_ARGS --stop-after-init -i \
        l10n_ch,account_payment_order,account_banking_sepa_credit_transfer,l10n_ch_pain_credit_transfer,account_payment_order_tier_validation
      echo "  the payment mode, the connector's user and review, three suppliers, their bills and a payment order"
      odoo_compose run --rm -T odoo odoo shell $ODOO_ARGS --no-http < "$CONNECTORS/odoo-setup.py"
    } > "$DEMO_HOME/logs/odoo-init.log" 2>&1 || die "the Odoo setup failed: $DEMO_HOME/logs/odoo-init.log"
  fi
  odoo_compose up -d > /dev/null 2>&1
  for _ in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$ODOO_PORT/web/login" | grep -q 200 && break; sleep 3; done
  printf 'ODOO_URL=http://127.0.0.1:%s\nODOO_DB=realms\nODOO_LOGIN=realm-connector\nODOO_PASSWORD=realm-connector-demo\n' \
    "$ODOO_PORT" > "$DEMO_HOME/odoo.env"
}

# ── the connectors ────────────────────────────────────────────────────────────────────────────────────────────────

up_connectors() {
  say "the connectors"
  "$HERE/down.sh" --connectors
  (cd "$CONNECTORS" && npm install --no-audit --no-fund --silent)
  for erp in erpnext odoo; do
    [ -f "$DEMO_HOME/$erp.env" ] && [ -f "$DEMO_HOME/realm.env" ] || { echo "  $erp: not set up, skipped"; continue; }
    (cd "$CONNECTORS" && set -a && . "$DEMO_HOME/realm.env" && . "$DEMO_HOME/$erp.env" && set +a \
      && exec nohup node --experimental-strip-types --disable-warning=ExperimentalWarning src/main.ts "$erp" \
      >> "$DEMO_HOME/logs/connector-$erp.log" 2>&1) &
    echo $! > "$DEMO_HOME/connector-$erp.pid"
    echo "  $erp connector running (log: $DEMO_HOME/logs/connector-$erp.log)"
  done
}

urls() {
  local realm
  realm="http://$(state 's["canisters"]["realm_frontend"]' 2>/dev/null || echo '<not started>').localhost:$REALM_PORT"
  cat <<EOF

Ready. Every address below is on this machine only.

  Realm      $realm/join?ti=0&test_mode=1&skip_ii=1   "Continue as Identity 1"
             Banking: $realm/extensions/banking?ti=0&test_mode=1&skip_ii=1
             votes:   $realm/extensions/voting?ti=0&test_mode=1&skip_ii=1
             Identity 2, in a private window: the same addresses with ti=1
  ERPNext    $erpnext_url/app/realm-payment-run/RPR-00001   Administrator / admin
  Odoo       http://127.0.0.1:$ODOO_PORT/odoo/account.payment.order/1   admin / admin

The treasury approves 2 of 2: vote with both identities. Stop: $HERE/down.sh
EOF
}

case "${1:-all}" in
  all) up_realm; up_erpnext; up_odoo; up_connectors; urls ;;
  realm) up_realm; urls ;;
  erpnext) up_erpnext ;;
  odoo) up_odoo ;;
  connectors) up_connectors ;;
  urls) urls ;;
  *) sed -n '2,8p' "$0"; exit 2 ;;
esac
