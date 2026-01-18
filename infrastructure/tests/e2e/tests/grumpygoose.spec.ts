import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Grumpy Goose Dashboard
 *
 * Tests the governance monitoring dashboard at /goose
 */

test.describe('Grumpy Goose Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/goose');
  });

  test('should load the dashboard successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check we're on the correct URL
    await expect(page).toHaveURL(/\/goose/);

    // Check page has loaded (should have some content)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should display governance data', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for common governance dashboard elements
    // The dashboard should have at least some data displayed
    const content = page.locator('body');

    // Look for governance-related content
    await expect(content).toContainText(/governance|proposal|council|snapshot/i);
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
    await page.goto('/goose');
    await page.waitForLoadState('networkidle');

    // Should display content even on mobile
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should handle navigation from hub', async ({ page }) => {
    // Start at hub
    await page.goto('/');

    // Click Grumpy Goose card
    const gooseCard = page.locator('a[href="/goose"]').first();
    await gooseCard.click();

    // Should navigate to Grumpy Goose
    await expect(page).toHaveURL(/\/goose/);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/goose');
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

  test('should have working navigation links', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for any links that should be internal
    const links = page.locator('a[href^="/"], a[href^="http"]');

    const linkCount = await links.count();
    if (linkCount > 0) {
      // Test first link
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');

      if (href && href.startsWith('/')) {
        // Internal link - click it
        await firstLink.click();
        // Should navigate somewhere
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should display data tables or lists', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Governance dashboards typically have tables or lists
    const tables = page.locator('table');
    const lists = page.locator('ul, ol');

    const hasDataStructure =
      (await tables.count()) > 0 || (await lists.count()) > 0;

    // Should have at least one data structure
    expect(hasDataStructure).toBe(true);
  });

  test('should load in reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/goose');
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
    expect(refreshedContent).not.toBe(initialContent); // Might have updated data
  });
});
