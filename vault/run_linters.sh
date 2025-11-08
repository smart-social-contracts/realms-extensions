#!/usr/bin/env bash

# Vault Extension Linter Runner
# Delegates to the shared Realms linting framework
# Usage: ./run_linters.sh [--fix]

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Pass custom config if .flake8 exists
CONFIG_ARG=""
if [ -f "${SCRIPT_DIR}/.flake8" ]; then
    CONFIG_ARG="--config .flake8"
fi

# Run the shared linter script
bash "${SCRIPT_DIR}/../_shared/testing/scripts/run_linters.sh" $CONFIG_ARG "$@"
