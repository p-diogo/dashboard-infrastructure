import { test, expect } from '@playwright/test';

test.describe('Compare Donut Chart - Production vs Staging', () => {
  const productionUrl = 'https://hub.thegraph.foundation/';
  const stagingUrl = 'https://staging.hub.thegraph.foundation/';

  test('capture screenshots and compare', async ({ page }) => {
    // Visit production and capture screenshot
    await page.goto(productionUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'production.png', fullPage: true });

    // Check if donut elements exist
    const productionDonuts = await page.locator('.donut-svg').count();
    console.log(`Production donut count: ${productionDonuts}`);

    // Check if donut is visible
    const firstDonut = page.locator('.donut-svg').first();
    const isVisible = await firstDonut.isVisible();
    console.log(`First donut visible: ${isVisible}`);

    // Get computed styles for donut
    const donutContainer = page.locator('.donut-container').first();
    const containerStyles = await donutContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height
      };
    });
    console.log('Production donut container styles:', containerStyles);

    // Get computed styles for SVG
    const svgElement = page.locator('.donut-svg').first();
    const svgStyles = await svgElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        transform: computed.transform,
        width: computed.width,
        height: computed.height
      };
    });
    console.log('Production SVG styles:', svgStyles);

    // Now do the same for staging
    await page.goto(stagingUrl);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'staging.png', fullPage: true });

    const stagingDonuts = await page.locator('.donut-svg').count();
    console.log(`Staging donut count: ${stagingDonuts}`);

    const stagingFirstDonut = page.locator('.donut-svg').first();
    const stagingIsVisible = await stagingFirstDonut.isVisible();
    console.log(`Staging first donut visible: ${stagingIsVisible}`);

    const stagingDonutContainer = page.locator('.donut-container').first();
    const stagingContainerStyles = await stagingDonutContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        position: computed.position,
        width: computed.width,
        height: computed.height
      };
    });
    console.log('Staging donut container styles:', stagingContainerStyles);
  });

  test('check if variants.css is loaded', async ({ page }) => {
    // Check production
    await page.goto(productionUrl);
    await page.waitForLoadState('networkidle');

    const productionStylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(ss => ({
        href: ss.href,
        rules: ss.cssRules ? ss.cssRules.length : 'not accessible'
      }));
    });
    console.log('Production stylesheets:', productionStylesheets.filter(s => s.href?.includes('variants')));

    // Check if donut styles are applied
    const donutFill = page.locator('.donut-circle-fill').first();
    const strokeWidth = await donutFill.evaluate(el => {
      return window.getComputedStyle(el).strokeWidth;
    });
    console.log('Production donut stroke width:', strokeWidth);

    // Check staging
    await page.goto(stagingUrl);
    await page.waitForLoadState('networkidle');

    const stagingStylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(ss => ({
        href: ss.href,
        rules: ss.cssRules ? ss.cssRules.length : 'not accessible'
      }));
    });
    console.log('Staging stylesheets:', stagingStylesheets.filter(s => s.href?.includes('variants')));

    const stagingDonutFill = page.locator('.donut-circle-fill').first();
    const stagingStrokeWidth = await stagingDonutFill.evaluate(el => {
      return window.getComputedStyle(el).strokeWidth;
    });
    console.log('Staging donut stroke width:', stagingStrokeWidth);
  });
});
