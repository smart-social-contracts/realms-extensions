#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Get the realm_frontend canister ID and set as base URL for Playwright
echo "🔍 Getting realm_frontend canister ID..."
CANISTER_ID=$(dfx canister id realm_frontend 2>/dev/null)

if [ -z "$CANISTER_ID" ]; then
  echo "❌ Error: Could not get realm_frontend canister ID."
  echo "   Make sure you have deployed the realm first with 'realms deploy'"
  exit 1
fi

export PLAYWRIGHT_BASE_URL="http://${CANISTER_ID}.localhost:8000/"
echo "✅ Set PLAYWRIGHT_BASE_URL to: $PLAYWRIGHT_BASE_URL"
echo ""

# Ensure dependencies are installed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  cd "$SCRIPT_DIR"
  npm install
  echo ""
fi

# Ensure Playwright browsers are installed (pinned to same version as realm_frontend: 1.52.0)
# This handles cases where npm install updates Playwright or Docker image browsers are missing
PLAYWRIGHT_CACHE="${HOME}/.cache/ms-playwright"
if ! ls "${PLAYWRIGHT_CACHE}"/chromium* > /dev/null 2>&1; then
  echo "📥 Installing Playwright browsers..."
  cd "$SCRIPT_DIR"
  npx playwright install chromium --with-deps
  echo ""
else
  echo "✅ Playwright browsers already installed"
  echo ""
fi

# Warm up the vault page before running tests
echo "🔥 Warming up vault page..."
curl -s "${PLAYWRIGHT_BASE_URL}extensions/vault" > /dev/null || echo "⚠️  Warmup request failed (may still work)"
sleep 3
echo "✅ Warmup complete"
echo ""

echo "🎭 Running Vault extension E2E tests..."
echo ""

# Change to the script directory to run Playwright (where package.json and config are)
cd "$SCRIPT_DIR"
npx playwright test "$@"
