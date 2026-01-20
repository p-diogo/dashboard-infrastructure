# 🧪 Testing Rules & Requirements

## MANDATORY E2E Testing Policy

**RULE: ALL changes must be verified with end-to-end Playwright tests before being marked complete.**

### When to Use E2E Tests

**ALWAYS use Playwright E2E tests for:**
- ✅ Routing changes (paths, redirects, nginx config)
- ✅ UI changes (dashboard updates, new components)
- ✅ API integrations (Notion, Safe, Graph subgraphs)
- ✅ Deployment verification (after deployment)
- ✅ Bug fixes (verify fix actually works in production)

**NEVER skip E2E tests for:**
- ❌ "Quick" routing fixes
- ❌ "Simple" config changes
- ❌ "Minor" UI tweaks
- ❌ Bug fixes without verification
- ❌ Deployments without validation

### Why This Rule Exists

From previous debugging sessions:
- **Without E2E tests:** Issues found only after user reports (embarrassing, unprofessional)
- **With E2E tests:** Issues caught during development (fast, reliable)

**Real example:** Routing issue where Goose was served at `/` instead of `/goose` was only caught after manual verification. E2E test would have caught this immediately.

### E2E Test Requirements

Every E2E test must:
1. **Test actual user flows** - not just component rendering
2. **Run against deployed environment** - not localhost development
3. **Verify critical functionality** - data loading, routing, interactions
4. **Be automated** - no manual steps required
5. **Be fast** - complete in under 60 seconds

### Test Structure

```typescript
// tests/e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Routing', () => {
  test('Hub page at root path', async ({ page }) => {
    await page.goto('http://localhost/');
    await expect(page).toHaveTitle(/Dashboard Hub/);
    await expect(page.locator('text=GOOSE')).toBeVisible();
    await expect(page.locator('text=REO')).toBeVisible();
  });

  test('Goose dashboard at /goose path', async ({ page }) => {
    await page.goto('http://localhost/goose/');
    await expect(page).toHaveTitle(/GOOSE/);
    await expect(page.locator('text=Governance Oversight')).toBeVisible();
  });

  test('REO dashboard at /reo path', async ({ page }) => {
    await page.goto('http://localhost/reo/');
    await expect(page).toHaveTitle(/Rewards Eligibility/);
    await expect(page.locator('text=Eligibility Dashboard')).toBeVisible();
  });
});
```

### Running Tests

```bash
# Install Playwright (first time only)
npm init -y
npm install @playwright/test
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/routing.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with UI
npx playwright test --ui
```

### Test Coverage Requirements

**Minimum Coverage:**
- ✅ All main routes (/, /goose, /reo)
- ✅ Navigation between dashboards
- ✅ Data loading (votes, eligibility)
- ✅ Error states (404, API failures)
- ✅ Deployment verification

**Before Marking Task Complete:**
1. All E2E tests pass ✅
2. Manual verification matches test results ✅
3. Tests are committed to repository ✅
4. Tests can be run by CI/CD ✅

### Common Pitfalls

**❌ DON'T:**
- Skip tests because "it's a simple change"
- Test against localhost when production uses different domain
- Only test happy path (no error cases)
- Rely on manual testing instead of automated
- Commit without running tests

**✅ DO:**
- Test against deployed environment (production/staging)
- Test both success and failure cases
- Run tests before committing
- Keep tests fast and reliable
- Update tests when functionality changes

### Quick Reference

| Task | E2E Test Required? | Example Test |
|------|-------------------|--------------|
| Fix routing bug | ✅ YES | `/` shows hub, not goose |
| Add new dashboard card | ✅ YES | Card visible, link works |
| Update API integration | ✅ YES | Data loads correctly |
| Change CSS styling | ⚠️ Optional | Visual regression |
| Add environment variable | ✅ YES | Feature works with new var |
| Fix database query | ✅ YES | Data displays correctly |

### Emergency Exception Process

**ONLY skip E2E tests if:**
1. Production is down (P0 incident)
2. Test environment is broken
3. Change is documented technical debt

**If you skip:**
- Create GitHub issue for adding tests
- Set due date within 1 week
- Get explicit approval from team lead

**Remember:** "I'll test it manually" is not a valid exception.

---

**This rule is MANDATORY. Violations will be flagged in code review.**

*Last updated: 2025-01-20*
