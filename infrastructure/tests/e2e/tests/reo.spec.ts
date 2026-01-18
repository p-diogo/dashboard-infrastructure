import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Rewards Eligibility Oracle Dashboard
 *
 * Tests the indexer eligibility monitoring dashboard at /reo
 */

test.describe('Rewards Eligibility Oracle Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reo');
  });

  test('should load the dashboard successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check we're on the correct URL
    await expect(page).toHaveURL(/\/reo/);

    // Check page has loaded
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should display indexer data', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // The dashboard should show indexer-related content
    const content = page.locator('body');

    // Look for indexer/eligibility-related content
    await expect(content).toContainText(/indexer|eligibility|rewards|oracle/i, {
      timeout: 10000,
    });
  });

  test('should display indexer table or list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // REO dashboard typically shows a searchable/sortable table of indexers
    const tables = page.locator('table');
    const lists = page.locator('ul, ol');

    const hasDataStructure =
      (await tables.count()) > 0 || (await lists.count()) > 0;

    expect(hasDataStructure).toBe(true);
  });

  test('should have filtering or sorting capabilities', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for search/filter inputs or sortable columns
    const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
    const sortableHeaders = page.locator('th[onclick], th.sortable, th[data-sort]');

    const hasInteractivity =
      (await searchInputs.count()) > 0 || (await sortableHeaders.count()) > 0;

    // Dashboard should have some interactivity
    expect(hasInteractivity).toBe(true);
  });

  test('should display eligibility status badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for status indicators (eligible/grace/ineligible)
    const statusElements = page.locator(
      '[class*="eligible"], [class*="grace"], [class*="ineligible"], ' +
      '.badge, .status, span:has-text("Eligible"), span:has-text("Grace")'
    );

    // Should have some status indicators
    const count = await statusElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check that CSS has loaded
    const stylesApplied = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily !== 'default' || styles.color !== 'rgb(0, 0, 0)';
    });

    expect(stylesApplied).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reo');
    await page.waitForLoadState('networkidle');

    // Should display content even on mobile
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should handle navigation from hub', async ({ page }) => {
    // Start at hub
    await page.goto('/');

    // Click REO card
    const reoCard = page.locator('a[href="/reo"]').first();
    await reoCard.click();

    // Should navigate to REO
    await expect(page).toHaveURL(/\/reo/);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/reo');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);

    // Filter out common non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('404') &&
        !error.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should load in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/reo');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in less than 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have metadata and SEO', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should handle table interactions if present', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const tables = page.locator('table');

    if ((await tables.count()) > 0) {
      // Check if table has rows
      const rows = tables.first().locator('tbody tr');
      const rowCount = await rows.count();

      // Should have some data rows (excluding header)
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('should display last updated timestamp', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for timestamp information
    const timeElements = page.locator(
      '[datetime], .time, .timestamp, span:has-text("updated"), span:has-text("last")'
    );

    // Should have some time reference
    const count = await timeElements.count();
    if (count > 0) {
      // If timestamp exists, it should have content
      const firstTime = timeElements.first();
      await expect(firstTime).not.toBeEmpty();
    }
  });

  test('should handle refresh gracefully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Get initial content
    const initialContent = await page.content();

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still have content
    const refreshedContent = await page.content();
    expect(refreshedContent.length).toBeGreaterThan(0);
    // Content might have updated (new data)
  });

  test('should display ENS names if available', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for .eth domains or ENS names
    const ensElements = page.locator('span:has-text(".eth"), [data-ens]');

    // May or may not have ENS names depending on data
    const count = await ensElements.count();
    if (count > 0) {
      // Should display some ENS names
      await expect(ensElements.first()).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with a short timeout to see if it handles errors well
    try {
      await page.goto('/reo', { timeout: 5000 });
      // If it loads quickly, that's good
      const body = page.locator('body');
      await expect(body).not.toBeEmpty();
    } catch (error) {
      // If it times out, check if there's an error message
      const body = page.locator('body');
      const hasError = await body.textContent();
      // Should have some content, not just blank
      expect(hasError?.length).toBeGreaterThan(0);
    }
  });
});
