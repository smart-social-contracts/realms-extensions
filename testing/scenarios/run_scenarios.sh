#!/usr/bin/env bash
# Run all cross-extension scenario tests against a deployed realm.
#
# Each scenario is a self-contained, self-provisioning Python script named
# *_scenario.py that talks to the realm over `dfx` (no Docker, no local replica)
# and exits with the number of failed assertions (0 == success).
#
# Usage:
#   bash run_scenarios.sh                 # run all scenarios
#   bash run_scenarios.sh citizen_onboarding governance_execution  # subset
#
# Environment:
#   REALM_CANISTER_ID  realm backend canister id (default: Dominion test realm)
#   DFX_NETWORK        dfx network (default: ic — the realm lives on icp0.io)

set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export REALM_CANISTER_ID="${REALM_CANISTER_ID:-ku6cv-2iaaa-aaaab-agrpa-cai}"
export DFX_NETWORK="${DFX_NETWORK:-ic}"
export DFX_WARNING="-mainnet_plaintext_identity"

GREEN='\033[0;32m'; RED='\033[0;31m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'

# Resolve which scenarios to run
declare -a SCENARIOS
if [ "$#" -gt 0 ]; then
    for name in "$@"; do
        # accept either "citizen_onboarding" or "citizen_onboarding_scenario.py"
        file="$SCRIPT_DIR/${name%_scenario.py}_scenario.py"
        [ -f "$file" ] || file="$SCRIPT_DIR/$name"
        SCENARIOS+=("$file")
    done
else
    for f in "$SCRIPT_DIR"/*_scenario.py; do
        SCENARIOS+=("$f")
    done
fi

echo -e "${BLUE}╭──────────────────────────────────────────────╮${NC}"
echo -e "${BLUE}│ Realm scenario tests                          │${NC}"
echo -e "${BLUE}╰──────────────────────────────────────────────╯${NC}"
echo -e "  Realm:   ${YELLOW}${REALM_CANISTER_ID}${NC}"
echo -e "  Network: ${YELLOW}${DFX_NETWORK}${NC}"
echo ""

TOTAL=0
FAILED=0
declare -a FAILED_NAMES

for scenario in "${SCENARIOS[@]}"; do
    name="$(basename "$scenario")"
    if [ ! -f "$scenario" ]; then
        echo -e "${RED}Scenario not found: $name${NC}"
        FAILED=$((FAILED + 1)); FAILED_NAMES+=("$name (missing)"); continue
    fi
    TOTAL=$((TOTAL + 1))
    echo -e "${BLUE}━━━ $name ━━━${NC}"
    # Run from the scenario directory so `import realm_client` resolves.
    if ( cd "$SCRIPT_DIR" && python3 "$scenario" ); then
        echo -e "${GREEN}✓ $name passed${NC}\n"
    else
        echo -e "${RED}✗ $name failed${NC}\n"
        FAILED=$((FAILED + 1)); FAILED_NAMES+=("$name")
    fi
done

echo -e "${BLUE}──────────────────────────────────────────────${NC}"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ All $TOTAL scenario(s) passed${NC}"
else
    echo -e "${RED}❌ ${FAILED}/${TOTAL} scenario(s) failed:${NC}"
    for n in "${FAILED_NAMES[@]}"; do echo -e "  ${RED}- $n${NC}"; done
fi

exit "$FAILED"
