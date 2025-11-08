#!/usr/bin/env bash

# Quick test script to verify canister ID replacement logic
set -e

echo "=== Testing Canister ID Replacement Logic ==="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configuration file (in vault root)
CONFIG_FILE="${SCRIPT_DIR}/test_config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: test_config.json not found at $CONFIG_FILE"
    exit 1
fi

echo "1. Reading configuration from $CONFIG_FILE..."
TEST_CANISTERS_ENABLED=$(jq -r '.test_canisters.enabled // false' "$CONFIG_FILE")
echo "   Test canisters enabled: $TEST_CANISTERS_ENABLED"
echo ""

if [ "$TEST_CANISTERS_ENABLED" != "true" ]; then
    echo "ERROR: test_canisters.enabled is not true"
    exit 1
fi

echo "2. Checking for canister_id_replacements configuration..."
if ! jq -e '.test_canisters.canister_id_replacements' "$CONFIG_FILE" > /dev/null 2>&1; then
    echo "ERROR: canister_id_replacements not found in config"
    exit 1
fi

REPLACEMENTS_COUNT=$(jq '.test_canisters.canister_id_replacements | length' "$CONFIG_FILE")
echo "   Found $REPLACEMENTS_COUNT replacement mappings"
echo ""

echo "3. Building sed replacement commands..."
SED_REPLACEMENTS=""

while IFS= read -r mapping; do
    CANISTER_NAME=$(echo "$mapping" | jq -r '.canister_name')
    PLACEHOLDER=$(echo "$mapping" | jq -r '.placeholder')
    
    echo "   - Checking canister: $CANISTER_NAME"
    
    # Get the actual canister ID
    CANISTER_ID=$(dfx canister id "$CANISTER_NAME" 2>/dev/null || echo "")
    
    if [ -n "$CANISTER_ID" ]; then
        echo "     ✓ Found: $CANISTER_ID"
        echo "     → Will replace: $PLACEHOLDER → $CANISTER_ID"
        SED_REPLACEMENTS="$SED_REPLACEMENTS -e s/$PLACEHOLDER/$CANISTER_ID/"
    else
        echo "     ✗ NOT FOUND (canister not deployed)"
    fi
    echo ""
done < <(jq -c '.test_canisters.canister_id_replacements[]' "$CONFIG_FILE")

if [ -z "$SED_REPLACEMENTS" ]; then
    echo "ERROR: No canister IDs captured. Make sure canisters are deployed."
    echo ""
    echo "Run: dfx canister id ckbtc_ledger"
    echo "Run: dfx canister id ckbtc_indexer"
    exit 1
fi

echo "4. Generated sed command:"
echo "   sed $SED_REPLACEMENTS"
echo ""

echo "5. Testing replacement on init script..."
INIT_SCRIPT="${SCRIPT_DIR}/tests/init_vault_canisters.py"

if [ ! -f "$INIT_SCRIPT" ]; then
    echo "ERROR: Init script not found: $INIT_SCRIPT"
    exit 1
fi

# Show original placeholders
echo "   Original placeholders in script:"
grep -n "PLACEHOLDER" "$INIT_SCRIPT" || echo "   (none found)"
echo ""

# Create temp file with replacements
TEMP_FILE="/tmp/test_sed_output.py"
eval "sed $SED_REPLACEMENTS '$INIT_SCRIPT' > '$TEMP_FILE'"

echo "   After replacement:"
grep -n "CKBTC_LEDGER_ID\|CKBTC_INDEXER_ID" "$TEMP_FILE" | head -5
echo ""

echo "6. Verification:"
# Check if actual placeholder values remain (not the validation strings)
if grep -E '^CKBTC_.*_ID = "PLACEHOLDER' "$TEMP_FILE" > /dev/null; then
    echo "   ✗ FAILED: Placeholder variable assignments still present"
    rm -f "$TEMP_FILE"
    exit 1
else
    echo "   ✓ SUCCESS: All placeholder variable assignments replaced with actual IDs"
    echo "   Note: Validation code checking for 'PLACEHOLDER' string is preserved (correct)"
fi

# Show the actual lines that were replaced
echo ""
echo "7. Replaced lines in detail:"
echo "   ---"
head -20 "$TEMP_FILE" | grep -A 1 "CKBTC_LEDGER_ID\|CKBTC_INDEXER_ID" || true
echo "   ---"

# Clean up
rm -f "$TEMP_FILE"

echo ""
echo "✅ Sed replacement logic verified successfully!"
echo ""
echo "The init script will receive actual canister IDs when run."
