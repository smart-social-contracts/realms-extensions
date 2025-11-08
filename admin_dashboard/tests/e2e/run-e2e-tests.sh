#!/usr/bin/env bash

# Admin Dashboard E2E Test Runner
# Based on shared testing framework

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Default environment variables
export PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL:-"http://localhost:8000"}

echo -e "${BLUE}🎭 Admin Dashboard E2E Test Runner${NC}"
echo ""
echo "Base URL: $PLAYWRIGHT_BASE_URL"
echo ""

# Get the realm_frontend canister ID
echo "🔍 Getting realm_frontend canister ID..."
CANISTER_ID=$(dfx canister id realm_frontend 2>/dev/null || echo "")

if [ -n "$CANISTER_ID" ]; then
  export PLAYWRIGHT_BASE_URL="http://${CANISTER_ID}.localhost:8000/"
  echo "✅ Set PLAYWRIGHT_BASE_URL to: $PLAYWRIGHT_BASE_URL"
else
  echo "⚠️  Using default base URL (canister ID not found)"
fi
echo ""

# Ensure dependencies are installed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo -e "${BLUE}📦 Installing npm dependencies...${NC}"
  cd "$SCRIPT_DIR"
  npm install
  echo ""
fi

# Ensure Playwright browsers are installed (correct version for this Playwright installation)
echo "📥 Ensuring Playwright browsers are installed..."
cd "$SCRIPT_DIR"

# In Docker environments, always ensure browsers are installed
if [ -f /.dockerenv ]; then
  echo "🐳 Docker environment detected - installing browsers..."
  npx playwright install chromium --with-deps || npx playwright install chromium
  echo "✅ Playwright browsers ready"
else
  # For local development, always run install (it skips if correct version exists)
  # This handles version mismatches automatically
  echo "📥 Installing/verifying Playwright browsers for version $(npx playwright --version)..."
  npx playwright install chromium --no-shell 2>&1 | grep -v "is already installed" || true
  echo "✅ Playwright browsers ready"
fi
echo ""

# Warm up the admin dashboard page
echo "🔥 Warming up admin dashboard page..."
curl -s "${PLAYWRIGHT_BASE_URL}admin" > /dev/null || echo "⚠️  Warmup request failed (may still work)"
sleep 3
echo "✅ Warmup complete"
echo ""

echo -e "${BLUE}🎭 Running Admin Dashboard E2E tests...${NC}"
echo ""

cd "$SCRIPT_DIR"

# Run Playwright with all passed arguments
npx playwright test "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ E2E tests passed!${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️  E2E tests failed${NC}"
  echo -e "${BLUE}💡 View the HTML report:${NC} npx playwright show-report"
fi

exit $EXIT_CODE
