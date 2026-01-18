# E2E Tests for The Graph Dashboards

End-to-end tests using Playwright to verify the dashboard infrastructure works correctly.

## Test Coverage

- **Hub Page** (`hub.spec.ts`): Tests the main dashboard hub page
  - Page loads and displays correctly
  - Both dashboard cards are visible
  - Links navigate properly
  - Responsive design works
  - No console errors

- **Grumpy Goose** (`grumpygoose.spec.ts`): Tests the governance dashboard
  - Dashboard loads with data
  - Proper styling and layout
  - Responsive design
  - No console errors

- **REO** (`reo.spec.ts`): Tests the indexer eligibility dashboard
  - Dashboard loads with data
  - Table/list displays indexers
  - Filtering/sorting works
  - Status badges display correctly

- **Navigation** (`navigation.spec.ts`): Tests cross-dashboard navigation
  - Navigate between hub and dashboards
  - Browser back/forward buttons
  - Direct URL access
  - Concurrent navigation

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Dashboards deployed and running

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install:browsers
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

### Run tests with UI

```bash
npm run test:ui
```

### Debug tests

```bash
npm run test:debug
```

## Configuration

Tests use environment variables for configuration:

- `BASE_URL`: Base URL for tests (default: `http://localhost`)

Example:

```bash
BASE_URL=http://dashboards.thegraph.foundation npm test
```

## Before Running Tests

Ensure dashboards are deployed:

```bash
cd ../../
./deploy.sh
```

## CI/CD Integration

Tests run automatically in CI. They:
1. Start the Docker Compose services
2. Run all tests
3. Generate HTML report
4. Exit with appropriate code

## Troubleshooting

### Tests fail with "connection refused"

Ensure Docker Compose services are running:

```bash
docker compose ps
```

### Tests timeout

Check if dashboards are generating data:

```bash
docker compose logs -f grumpygoose-scheduler
docker compose logs -f reo-scheduler
```

### Browser doesn't launch

Reinstall Playwright browsers:

```bash
npm run install:browsers
```

## Adding New Tests

1. Create a new spec file in `tests/` directory
2. Name it with `.spec.ts` extension
3. Use the test structure from existing specs

Example:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My New Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run report
```

This opens an interactive report showing:
- Test results
- Screenshots of failures
- Videos of test runs
- Timing information
