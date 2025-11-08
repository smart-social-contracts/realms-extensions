#!/usr/bin/env bash

# Local Development Test Runner
# Runs tests directly on your machine without Docker
# Configuration is read from test_config.json

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the shared test entrypoint directly (no Docker)
bash "${SCRIPT_DIR}/../_shared/testing/scripts/test_entrypoint.sh" "$@"
