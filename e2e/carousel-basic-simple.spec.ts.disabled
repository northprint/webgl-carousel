import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Simple Test', () => {
  test('should load demo page', async ({ page }) => {
    // Navigate to demo page
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle(/WebGL Carousel/i);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/demo-page.png' });
    
    // Check if script loaded
    const scriptLoaded = await page.evaluate(() => {
      return typeof WebGLCarousel !== 'undefined';
    });
    
    console.log('WebGLCarousel loaded:', scriptLoaded);
    expect(scriptLoaded).toBeTruthy();
    
    // Check if carousel element exists
    const carouselElement = await page.locator('#carousel');
    await expect(carouselElement).toBeVisible();
  });
});