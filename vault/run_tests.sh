#!/usr/bin/env bash

# Vault Extension Test Runner
# Delegates to the shared Realms testing framework
# Configuration is read from test_config.json

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the shared test runner
bash "${SCRIPT_DIR}/../_shared/testing/scripts/run_tests.sh" "$@"
