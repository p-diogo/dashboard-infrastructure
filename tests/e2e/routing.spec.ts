import { test, expect } from '@playwright/test';

// Test against the actual deployed environment
const BASE_URL = process.env.BASE_URL || 'http://localhost';

test.describe('Dashboard Hub Routing', () => {
  test('Hub page loads at root path', async ({ page }) => {
    await page.goto(BASE_URL + '/');

    // Check title
    await expect(page).toHaveTitle(/Dashboard Hub/);

    // Check for dashboard cards
    const gooseCard = page.locator('a[href*="goose"]').first();
    const reoCard = page.locator('a[href*="reo"]').first();

    await expect(gooseCard).toBeVisible();
    await expect(reoCard).toBeVisible();

    // Verify card text content
    await expect(page.locator('text=GOOSE')).toBeVisible();
    await expect(page.locator('text=Governance Oversight')).toBeVisible();
    await expect(page.locator('text=REO')).toBeVisible();
    await expect(page.locator('text=Rewards Eligibility')).toBeVisible();
  });

  test('Hub navigation links work', async ({ page }) => {
    await page.goto(BASE_URL + '/');

    // Click GOOSE card
    const gooseLink = page.locator('a[href*="goose"]').first();
    await gooseLink.click();

    // Should navigate to /goose or /goose/
    await expect(page).toHaveURL(/\/goose\/?$/);
    await expect(page).toHaveTitle(/GOOSE/);
  });

  test('Goose dashboard accessible at /goose', async ({ page }) => {
    await page.goto(BASE_URL + '/goose/');

    // Check title
    await expect(page).toHaveTitle(/GOOSE/);

    // Check for key dashboard elements
    await expect(page.locator('text=Governance Oversight')).toBeVisible();
    await expect(page.locator('text=Operational Speed Evaluator')).toBeVisible();

    // Check for vote data (should have some content)
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/proposal|transaction|vote/i);
  });

  test('Goose redirects to /goose/ without trailing slash', async ({ page }) => {
    await page.goto(BASE_URL + '/goose');

    // Should redirect to /goose/
    await expect(page).toHaveURL(/\/goose\/$/);
  });

  test('REO dashboard accessible at /reo', async ({ page }) => {
    await page.goto(BASE_URL + '/reo/');

    // Check title - may have errors if API key invalid, but page should load
    const title = await page.title();
    expect(title).toMatch(/Rewards Eligibility|Eligibility Dashboard/);

    // Check for some content even if API fails
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/indexer|eligibility|dashboard/i);
  });

  test('REO redirects to /reo/ without trailing slash', async ({ page }) => {
    await page.goto(BASE_URL + '/reo');

    // Should redirect to /reo/
    await expect(page).toHaveURL(/\/reo\/$/);
  });

  test('All dashboards return 200 status', async ({ page }) => {
    const paths = ['/', '/goose/', '/reo/'];

    for (const path of paths) {
      const response = await page.request.get(BASE_URL + path);
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('Health Checks', () => {
  test('Health endpoint responds', async ({ page }) => {
    const response = await page.request.get(BASE_URL + '/health');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('healthy');
  });
});
