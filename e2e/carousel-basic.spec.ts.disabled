import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for carousel to be loaded
    await page.waitForSelector('#carousel canvas', { timeout: 5000 });
  });

  test('should load the carousel with canvas element', async ({ page }) => {
    const canvas = await page.locator('#carousel canvas');
    await expect(canvas).toBeVisible();
    
    // Check if WebGL context is created
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
      return canvas && (canvas.getContext('webgl') !== null || canvas.getContext('webgl2') !== null);
    });
    expect(hasWebGL).toBeTruthy();
  });

  test('should display navigation controls', async ({ page }) => {
    const prevButton = await page.locator('[aria-label="Previous image"]');
    const nextButton = await page.locator('[aria-label="Next image"]');
    
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
  });

  test('should navigate to next image', async ({ page }) => {
    const nextButton = await page.locator('[aria-label="Next image"]');
    
    // Get initial state
    const initialIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    // Click next
    await nextButton.click();
    
    // Wait for transition
    await page.waitForTimeout(1500);
    
    // Check if index changed
    const newIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    expect(newIndex).toBe((initialIndex + 1) % 3); // Assuming 3 images
  });

  test('should navigate to previous image', async ({ page }) => {
    const prevButton = await page.locator('[aria-label="Previous image"]');
    
    // Get initial state
    const initialIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    // Click previous
    await prevButton.click();
    
    // Wait for transition
    await page.waitForTimeout(1500);
    
    // Check if index changed
    const newIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    expect(newIndex).toBe(initialIndex === 0 ? 2 : initialIndex - 1); // Assuming 3 images
  });

  test('should display progress indicators', async ({ page }) => {
    const indicators = await page.locator('.carousel-indicator');
    const count = await indicators.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check if first indicator is active
    const firstIndicator = indicators.first();
    await expect(firstIndicator).toHaveClass(/active/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on carousel
    await page.locator('#carousel').focus();
    
    const initialIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500);
    
    const afterRightIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    expect(afterRightIndex).toBe((initialIndex + 1) % 3);
    
    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1500);
    
    const afterLeftIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    expect(afterLeftIndex).toBe(initialIndex);
  });

  test('should pause autoplay on hover', async ({ page }) => {
    // Enable autoplay first
    await page.evaluate(() => {
      (window as any).carousel?.setAutoplay(true);
    });
    
    await page.waitForTimeout(500);
    
    // Get initial index
    const initialIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    // Hover over carousel
    await page.hover('#carousel');
    
    // Wait for what would be autoplay interval
    await page.waitForTimeout(3500);
    
    // Index should not have changed
    const currentIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    expect(currentIndex).toBe(initialIndex);
  });
});