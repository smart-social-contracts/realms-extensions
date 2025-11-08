#!/usr/bin/env bash

# Shared Test Entrypoint for Realms Extensions
# This script runs inside the Docker container and orchestrates all test steps
# based on the test_config.json configuration

set -e
set -x

# Configuration file
CONFIG_FILE="/app/extension-root/test_config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "[ERROR] test_config.json not found at $CONFIG_FILE"
    exit 1
fi

# Parse configuration
EXTENSION_ID=$(jq -r '.extension_id' "$CONFIG_FILE")
TEST_TYPE=$(jq -r '.test_type // "full"' "$CONFIG_FILE")

REALM_CITIZENS=$(jq -r '.realm_config.citizens // 5' "$CONFIG_FILE")
REALM_ORGS=$(jq -r '.realm_config.organizations // 2' "$CONFIG_FILE")
REALM_RANDOM=$(jq -r '.realm_config.random // false' "$CONFIG_FILE")

TEST_CANISTERS_ENABLED=$(jq -r '.test_canisters.enabled // false' "$CONFIG_FILE")
TEST_CANISTERS_DFX=$(jq -r '.test_canisters.dfx_json // "tests/dfx.json"' "$CONFIG_FILE")
TEST_CANISTERS_DEPLOY=$(jq -r '.test_canisters.deploy_script // ""' "$CONFIG_FILE")
TEST_CANISTERS_INIT=$(jq -r '.test_canisters.init_script // ""' "$CONFIG_FILE")

BACKEND_TESTS_ENABLED=$(jq -r '.backend_tests.enabled // true' "$CONFIG_FILE")
BACKEND_PRE_SETUP=$(jq -r '.backend_tests.pre_setup // ""' "$CONFIG_FILE")
BACKEND_TEST_FILES=$(jq -r '.backend_tests.test_files // [] | join(" ")' "$CONFIG_FILE")

E2E_TESTS_ENABLED=$(jq -r '.e2e_tests.enabled // false' "$CONFIG_FILE")
E2E_BASE_PATH=$(jq -r '.e2e_tests.base_path // ""' "$CONFIG_FILE")
E2E_WARMUP=$(jq -r '.e2e_tests.warmup // true' "$CONFIG_FILE")

echo "[INFO] Extension: $EXTENSION_ID"
echo "[INFO] Test Type: $TEST_TYPE"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Determine paths based on environment
if [ -f /.dockerenv ]; then
    cd /app
    # In Docker, create a temp directory with proper structure
    mkdir -p /tmp/extensions/$EXTENSION_ID
    cp -r extension-root/* /tmp/extensions/$EXTENSION_ID/
    # Don't copy the .realms directory if it exists (causes conflicts)
    rm -rf /tmp/extensions/$EXTENSION_ID/.realms
    EXTENSION_SOURCE_DIR="/tmp/extensions"
else
    # Clone realms repo if not already present
    if [ ! -d ".realms" ]; then
        echo '[INFO] Cloning realms repository...'
        git clone https://github.com/smart-social-contracts/realms.git .realms
    fi
    cd .realms
    # Create a temp directory with proper structure for local dev
    mkdir -p /tmp/extensions/$EXTENSION_ID
    cp -r ../* /tmp/extensions/$EXTENSION_ID/ 2>/dev/null || true
    rm -rf /tmp/extensions/$EXTENSION_ID/.realms  # Don't copy the .realms directory itself
    EXTENSION_SOURCE_DIR="/tmp/extensions"
fi

# Install realms cli
echo '[INFO] Installing realms cli...'
pip install -e cli/ --force

rm -rf extensions

# Download test artifacts if script exists
if [ -f /.dockerenv ]; then
    DOWNLOAD_SCRIPT="/app/extension-root/tests/download_test_artifacts.sh"
else
    DOWNLOAD_SCRIPT="../tests/download_test_artifacts.sh"
fi

if [ -f "$DOWNLOAD_SCRIPT" ]; then
    echo '[INFO] Downloading test artifacts...'
    bash "$DOWNLOAD_SCRIPT"
fi

# Install the extension BEFORE creating the realm
if [ -f /.dockerenv ]; then
    INSTALL_SCRIPT="/app/extension-root/install_extension.sh"
else
    INSTALL_SCRIPT="../install_extension.sh"
fi

if [ -f "$INSTALL_SCRIPT" ]; then
    echo '[INFO] Installing extension using custom script...'
    bash "$INSTALL_SCRIPT" "$EXTENSION_ID" "$EXTENSION_SOURCE_DIR/$EXTENSION_ID"
else
    echo '[INFO] Installing extension using CLI...'
    realms extension install --extension-id "$EXTENSION_ID" --source-dir "$EXTENSION_SOURCE_DIR/$EXTENSION_ID"
fi

# Create realm
echo "[INFO] Creating test realm..."
REALM_CMD="realms create"
if [ "$REALM_RANDOM" = "true" ]; then
    REALM_CMD="$REALM_CMD --random"
fi
eval "$REALM_CMD"

# Stop previous dfx instances and clean up
echo '[INFO] Stopping previous dfx instances...'
if [ -f /.dockerenv ]; then
    CLEAN_SCRIPT="/app/extension-root/_shared/testing/scripts/clean_dfx.sh"
    if [ ! -f "$CLEAN_SCRIPT" ]; then
        CLEAN_SCRIPT="/app/extension-root/clean_dfx.sh"
    fi
else
    CLEAN_SCRIPT="../_shared/testing/scripts/clean_dfx.sh"
    if [ ! -f "$CLEAN_SCRIPT" ]; then
        CLEAN_SCRIPT="../clean_dfx.sh"
    fi
fi

if [ -f "$CLEAN_SCRIPT" ]; then
    bash "$CLEAN_SCRIPT" || true
fi

# Merge test canisters into dfx.json if enabled
if [ "$TEST_CANISTERS_ENABLED" = "true" ]; then
    echo '[INFO] Merging test canisters into dfx.json...'
    
    if [ -f /.dockerenv ]; then
        TEST_DFX_PATH="/app/extension-root/$TEST_CANISTERS_DFX"
        MERGE_SCRIPT="/app/extension-root/_shared/testing/utils/merge_dfx_json.py"
        if [ ! -f "$MERGE_SCRIPT" ]; then
            MERGE_SCRIPT="/app/extension-root/tests/merge_dfx_json.py"
        fi
    else
        TEST_DFX_PATH="../$TEST_CANISTERS_DFX"
        MERGE_SCRIPT="../_shared/testing/utils/merge_dfx_json.py"
        if [ ! -f "$MERGE_SCRIPT" ]; then
            MERGE_SCRIPT="../tests/merge_dfx_json.py"
        fi
    fi
    
    if [ -f "$MERGE_SCRIPT" ] && [ -f "$TEST_DFX_PATH" ]; then
        python3 "$MERGE_SCRIPT" "$TEST_DFX_PATH" dfx.json
    else
        echo "[WARNING] Merge script or test dfx.json not found, skipping merge"
    fi
fi

# Deploy realm
echo '[INFO] Deploying realm...'
realms deploy --folder ".realm"

# Deploy test canisters if enabled
if [ "$TEST_CANISTERS_ENABLED" = "true" ] && [ -n "$TEST_CANISTERS_DEPLOY" ]; then
    echo '[INFO] Deploying test canisters...'
    
    if [ -f /.dockerenv ]; then
        DEPLOY_SCRIPT="/app/extension-root/$TEST_CANISTERS_DEPLOY"
    else
        DEPLOY_SCRIPT="../$TEST_CANISTERS_DEPLOY"
    fi
    
    if [ -f "$DEPLOY_SCRIPT" ]; then
        python3 "$DEPLOY_SCRIPT"
    else
        echo "[WARNING] Test canisters deploy script not found: $DEPLOY_SCRIPT"
    fi
fi

# Run initialization script if provided
if [ -n "$TEST_CANISTERS_INIT" ]; then
    echo '[INFO] Running test initialization script...'
    
    if [ -f /.dockerenv ]; then
        INIT_SCRIPT="/app/extension-root/$TEST_CANISTERS_INIT"
    else
        INIT_SCRIPT="../$TEST_CANISTERS_INIT"
    fi
    
    if [ -f "$INIT_SCRIPT" ]; then
        realms run --file "$INIT_SCRIPT"
    else
        echo "[WARNING] Initialization script not found: $INIT_SCRIPT"
    fi
fi

# Run backend tests if enabled
if [ "$BACKEND_TESTS_ENABLED" = "true" ] && [ "$TEST_TYPE" != "e2e_only" ]; then
    echo '[INFO] Running backend tests...'
    
    # Run pre-setup if provided
    if [ -n "$BACKEND_PRE_SETUP" ]; then
        if [ -f /.dockerenv ]; then
            PRE_SETUP="/app/extension-root/$BACKEND_PRE_SETUP"
        else
            PRE_SETUP="../$BACKEND_PRE_SETUP"
        fi
        
        if [ -f "$PRE_SETUP" ]; then
            echo '[INFO] Running pre-setup script...'
            realms run --file "$PRE_SETUP"
        fi
    fi
    
    # Run test files
    if [ -n "$BACKEND_TEST_FILES" ]; then
        for TEST_FILE in $BACKEND_TEST_FILES; do
            if [ -f /.dockerenv ]; then
                TEST_PATH="/app/extension-root/$TEST_FILE"
            else
                TEST_PATH="../$TEST_FILE"
            fi
            
            if [ -f "$TEST_PATH" ]; then
                echo "[INFO] Running test: $TEST_FILE"
                realms run --file "$TEST_PATH" --wait
            else
                echo "[WARNING] Test file not found: $TEST_PATH"
            fi
        done
    fi
fi

# Run E2E tests if enabled
if [ "$E2E_TESTS_ENABLED" = "true" ] && [ "$TEST_TYPE" != "backend_only" ]; then
    echo '[INFO] Running E2E tests...'
    
    if [ -f /.dockerenv ]; then
        E2E_SCRIPT="/app/extension-root/tests/e2e/run-e2e-tests.sh"
    else
        E2E_SCRIPT="../tests/e2e/run-e2e-tests.sh"
    fi
    
    if [ -f "$E2E_SCRIPT" ]; then
        bash "$E2E_SCRIPT"
    else
        echo "[WARNING] E2E test script not found: $E2E_SCRIPT"
    fi
fi

echo '[SUCCESS] All tests completed successfully!'
