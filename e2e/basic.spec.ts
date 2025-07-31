import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should load the demo page', async ({ page }) => {
    await expect(page).toHaveTitle(/WebGL Carousel/);
  });

  test('should have carousel element', async ({ page }) => {
    const carousel = page.locator('#carousel');
    await expect(carousel).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation buttons', async ({ page }) => {
    const prevButton = page.locator('#prevBtn');
    const nextButton = page.locator('#nextBtn');
    
    await expect(prevButton).toBeVisible({ timeout: 10000 });
    await expect(nextButton).toBeVisible({ timeout: 10000 });
  });
});