import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the demo page', async ({ page }) => {
    await expect(page).toHaveTitle(/WebGL Carousel/);
  });

  test('should have carousel element', async ({ page }) => {
    const carousel = page.locator('#carousel');
    await expect(carousel).toBeVisible();
  });

  test('should have navigation buttons', async ({ page }) => {
    const prevButton = page.locator('[aria-label="Previous image"]');
    const nextButton = page.locator('[aria-label="Next image"]');
    
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should change image on next button click', async ({ page }) => {
    // Wait for carousel to initialize
    await page.waitForTimeout(1000);
    
    // Click next button
    await page.click('[aria-label="Next image"]');
    
    // Wait for transition
    await page.waitForTimeout(2500);
    
    // Check that current index has changed
    const currentIndex = await page.textContent('#currentIndex');
    expect(currentIndex).toBe('2');
  });

  test('should have effect selector', async ({ page }) => {
    const effectSelect = page.locator('#effectSelect');
    await expect(effectSelect).toBeVisible();
    
    // Check that it has options
    const options = await effectSelect.locator('option').count();
    expect(options).toBeGreaterThan(5);
  });
});