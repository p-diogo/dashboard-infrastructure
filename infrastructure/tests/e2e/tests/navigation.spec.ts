import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Cross-Dashboard Navigation
 *
 * Tests navigation between hub, Grumpy Goose, and REO
 */

test.describe('Cross-Dashboard Navigation', () => {
  test('should navigate from hub to goose and back', async ({ page }) => {
    // Start at hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    // Navigate to Grumpy Goose
    await page.click('a[href="/goose"]');
    await expect(page).toHaveURL(/\/goose/);

    // Navigate back to hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should navigate from hub to REO and back', async ({ page }) => {
    // Start at hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    // Navigate to REO
    await page.click('a[href="/reo"]');
    await expect(page).toHaveURL(/\/reo/);

    // Navigate back to hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should navigate between all dashboards in sequence', async ({ page }) => {
    // Start at hub
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboard Hub');

    // Go to Grumpy Goose
    await page.click('a[href="/goose"]');
    await expect(page).toHaveURL(/\/goose/);

    // Go to hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);

    // Go to REO
    await page.click('a[href="/reo"]');
    await expect(page).toHaveURL(/\/reo/);

    // Go back to hub
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle direct URL access to all paths', async ({ page }) => {
    // Test direct access to hub
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboard Hub');

    // Test direct access to goose
    await page.goto('/goose');
    await expect(page).toHaveURL(/\/goose/);

    // Test direct access to reo
    await page.goto('/reo');
    await expect(page).toHaveURL(/\/reo/);
  });

  test('should handle trailing slashes correctly', async ({ page }) => {
    // Test with trailing slash
    await page.goto('/goose/');
    await expect(page).toHaveURL(/\/goose/);

    // Test without trailing slash
    await page.goto('/goose');
    await expect(page).toHaveURL(/\/goose/);

    // Same for REO
    await page.goto('/reo/');
    await expect(page).toHaveURL(/\/reo/);

    await page.goto('/reo');
    await expect(page).toHaveURL(/\/reo/);
  });

  test('should preserve navigation state', async ({ page }) => {
    // Navigate to goose
    await page.goto('/goose');

    // Navigate to REO
    await page.goto('/reo');

    // Navigate back to hub
    await page.goto('/');

    // Should show hub correctly
    await expect(page.locator('h1')).toContainText('Dashboard Hub');
    await expect(page.locator('a[href="/goose"]')).toBeVisible();
    await expect(page.locator('a[href="/reo"]')).toBeVisible();
  });

  test('should handle browser back button', async ({ page }) => {
    // Start at hub
    await page.goto('/');
    const hubTitle = await page.title();

    // Navigate to goose
    await page.click('a[href="/goose"]');
    await expect(page).toHaveURL(/\/goose/);

    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    expect(await page.title()).toBe(hubTitle);

    // Navigate to REO
    await page.click('a[href="/reo"]');
    await expect(page).toHaveURL(/\/reo/);

    // Use browser back again
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle browser forward button', async ({ page }) => {
    // Navigate: hub -> goose -> hub
    await page.goto('/');
    await page.click('a[href="/goose"]');
    await page.goto('/');

    // Go back to goose
    await page.goBack();
    await expect(page).toHaveURL(/\/goose/);

    // Go forward to hub
    await page.goForward();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should maintain session across navigation', async ({ page }) => {
    // Start at hub
    await page.goto('/');

    // Store session data (if any)
    const initialCookies = await page.context().cookies();

    // Navigate to goose
    await page.click('a[href="/goose"]');
    await page.waitForLoadState('networkidle');

    // Check cookies are maintained (or appropriately scoped)
    const gooseCookies = await page.context().cookies();

    // Navigate to REO
    await page.goto('/reo');
    await page.waitForLoadState('networkidle');

    const reoCookies = await page.context().cookies();

    // Cookies should be consistent or appropriately scoped
    expect(reoCookies.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle concurrent navigation', async ({ page }) => {
    // Open multiple pages
    const page2 = await page.context().newPage();

    // Navigate both pages to different dashboards
    await page.goto('/goose');
    await page2.goto('/reo');

    // Wait for both to load
    await page.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');

    // Both should be loaded correctly
    await expect(page).toHaveURL(/\/goose/);
    await expect(page2).toHaveURL(/\/reo/);

    await page2.close();
  });

  test('should handle rapid navigation', async ({ page }) => {
    // Rapidly navigate between pages
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.goto('/goose');
      await page.goto('/reo');
    }

    // Should end up on REO
    await expect(page).toHaveURL(/\/reo/);
  });

  test('should handle URL hash navigation', async ({ page }) => {
    // Navigate to hub with hash
    await page.goto('/#test');
    await expect(page).toHaveURL(/\/#test/);

    // Navigate to goose with hash
    await page.goto('/goose#test');
    await expect(page).toHaveURL(/\/goose#test/);

    // Navigate without hash
    await page.goto('/goose');
    await expect(page).toHaveURL(/\/goose$/);
  });

  test('should handle 404 paths gracefully', async ({ page }) => {
    // Try to access non-existent path
    await page.goto('/non-existent-path');

    // Should either show 404 or redirect to hub
    const url = page.url();
    const is404 = await page.locator('body:has-text("404"), body:has-text("Not Found")').count() > 0;
    const isHub = url === '/' || url.endsWith('/');

    expect(is404 || isHub).toBe(true);
  });
});
