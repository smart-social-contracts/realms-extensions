# Admin Dashboard Extension Tests

This directory contains tests for the Admin Dashboard extension using the shared Realms testing framework.

## Test Structure

```
tests/
├── README.md                          # This file
├── test_admin_dashboard.py           # Backend integration tests
├── test_registration_codes.py        # Registration code tests
└── e2e/                              # E2E browser tests
    ├── package.json
    ├── playwright.config.ts
    ├── run-e2e-tests.sh
    └── specs/
        └── admin_dashboard.spec.ts
```

## Running Tests

### All Tests (Backend + E2E + Linting)

```bash
cd admin_dashboard
./run_tests.sh
```

### Linting Only

```bash
./run_linters.sh

# Auto-fix issues
./run_linters.sh --fix
```

### Backend Tests Only

Configure in `test_config.json`:
```json
{
  "test_type": "backend_only"
}
```

### E2E Tests Only

Configure in `test_config.json`:
```json
{
  "test_type": "e2e_only"
}
```

Or run directly:
```bash
cd tests/e2e
./run-e2e-tests.sh
```

## Test Coverage

### Backend Tests

**test_admin_dashboard.py:**
- ✓ Extension availability check
- ✓ Data import functionality
- ✓ Entity query capabilities
- ✓ Sample data validation

**test_registration_codes.py:**
- ✓ Registration code generation
- ✓ Code validation
- ✓ Code listing
- ✓ Invalid code handling

### E2E Tests

**admin_dashboard.spec.ts:**
- ✓ Admin dashboard page loads
- ✓ Entity management sections visible
- ✓ Navigation elements present
- ✓ System statistics displayed

## Test Configuration

See `test_config.json` in the extension root for full configuration options.

Key settings:
- **Test Type**: `full` (backend + E2E + linting)
- **Realm Config**: 10 citizens, 3 organizations
- **Docker Port**: 8002 (to avoid conflicts)
- **Admin Path**: `/admin` (custom URL path)

## Adding New Tests

### Backend Test

Create a new file in `tests/`:

```python
"""
My New Test
Description of what this tests
"""

import sys
sys.path.append('/app/extension-root/_shared/testing/utils')

from test_utils import (
    call_realm_extension,
    print_ok,
    print_error,
    print_info
)

def async_task():
    """Entry point for realms run command"""
    print_info("Starting my test...")
    
    # Your test code here
    result = call_realm_extension("admin_dashboard", "some_method", {})
    
    if result.get("success"):
        print_ok("✓ Test passed")
    else:
        print_error("✗ Test failed")
    
    return {"success": True}
```

Add to `test_config.json`:
```json
{
  "backend_tests": {
    "test_files": [
      "tests/test_admin_dashboard.py",
      "tests/test_registration_codes.py",
      "tests/my_new_test.py"  // Add here
    ]
  }
}
```

### E2E Test

Create a new spec file in `tests/e2e/specs/`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My New Feature Tests', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/admin');
    // Your test code here
  });
});
```

## Troubleshooting

### Tests Failing?

1. **Check logs**: `test-logs/` directory after test run
2. **View E2E report**: `cd tests/e2e && npx playwright show-report`
3. **Debug mode**: `./run_tests.sh --debug`

### Common Issues

**Extension not found:**
- Ensure extension is installed: `cd ../../.. && ./scripts/install_extensions.sh`

**Port conflicts:**
- Change port in `test_config.json` → `docker.port_mapping.host_port`

**Browser installation fails:**
- E2E script automatically installs browsers in Docker
- For local: `cd tests/e2e && npx playwright install chromium --with-deps`

## CI/CD Integration

The GitHub Actions workflow automatically runs these tests when admin_dashboard files change.

See `.github/workflows/admin_dashboard-test.yml`

## Documentation

- **Framework Docs**: `../_shared/testing/README.md`
- **Migration Guide**: `../_shared/testing/MIGRATION_GUIDE.md`
- **Test Config Schema**: `../_shared/testing/config/test_config.schema.json`
