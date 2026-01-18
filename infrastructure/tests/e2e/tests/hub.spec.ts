import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard Hub Page
 *
 * Tests the main hub page at / which links to all dashboards
 */

test.describe('Dashboard Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the hub page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/The Graph Dashboard Hub/);

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('The Graph Dashboard Hub');
    await expect(heading).toBeVisible();
  });

  test('should display both dashboard cards', async ({ page }) => {
    // Check Grumpy Goose card
    const gooseCard = page.locator('a[href="/goose"]').filter({ hasText: 'Grumpy Goose' });
    await expect(gooseCard).toBeVisible();
    await expect(gooseCard).toContainText('Governance oversight');
    await expect(gooseCard.locator('.card-icon')).toContainText('🪿');

    // Check REO card
    const reoCard = page.locator('a[href="/reo"]').filter({ hasText: 'Rewards Eligibility Oracle' });
    await expect(reoCard).toBeVisible();
    await expect(reoCard).toContainText('Indexer eligibility');
    await expect(reoCard.locator('.card-icon')).toContainText('🍪');
  });

  test('should show status badges as Live', async ({ page }) => {
    const badges = page.locator('.status-badge');
    await expect(badges).toHaveCount(2);
    await expect(badges.first()).toContainText('Live');
    await expect(badges.nth(1)).toContainText('Live');
  });

  test('should display update times', async ({ page }) => {
    const updateTimes = page.locator('.update-time');
    await expect(updateTimes).toHaveCount(2);
    await expect(updateTimes.first()).toContainText('Updated every 5 minutes');
  });

  test('should navigate to Grumpy Goose when clicking the card', async ({ page }) => {
    const gooseCard = page.locator('a[href="/goose"]').first();

    // Click the card
    await gooseCard.click();

    // Should navigate to /goose
    await expect(page).toHaveURL(/\/goose/);
  });

  test('should navigate to REO when clicking the card', async ({ page }) => {
    const reoCard = page.locator('a[href="/reo"]').first();

    // Click the card
    await reoCard.click();

    // Should navigate to /reo
    await expect(page).toHaveURL(/\/reo/);
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Check background gradient
    const body = page.locator('body');
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
      };
    });
    expect(bodyStyles.background).toContain('gradient');

    // Check cards are displayed in a grid
    const grid = page.locator('.dashboard-grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('.card');
    await expect(cards).toHaveCount(2);

    // Check cards have hover effect
    const firstCard = cards.first();
    await firstCard.hover();
    // The hover should trigger a transform
    const cardStyles = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.transition;
    });
    expect(cardStyles).toContain('transform');
  });

  test('should display footer with attribution', async ({ page }) => {
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Created with ♥');
    await expect(footer).toContainText('The Graph Protocol');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check cards stack vertically on mobile
    const grid = page.locator('.dashboard-grid');
    const gridStyles = await grid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    });

    // On mobile, should be single column
    expect(gridStyles.gridTemplateColumns).toBe('none');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check all links have proper href
    const links = page.locator('a[href]');
    await expect(links).toHaveCount(4); // 2 dashboard cards + footer link

    // Check alt text for any images (if we add them later)
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt');
    }
  });

  test('should handle direct navigation to root path', async ({ page }) => {
    // Navigate directly to /
    await page.goto('/');

    // Should show hub page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('The Graph Dashboard Hub');
  });

  test('should show healthy state', async ({ page }) => {
    // Both status badges should be green
    const badges = page.locator('.status-badge');

    for (let i = 0; i < await badges.count(); i++) {
      const badge = badges.nth(i);
      const badgeStyles = await badge.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
        };
      });

      // Check badge is green-ish (success color)
      expect(badgeStyles.backgroundColor).toMatch(/rgb\(16, 185, 129\)/); // tailwind emerald-500
    }
  });

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load in less than 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await page.goto('/');

    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });
});
