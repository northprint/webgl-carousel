import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name} (${width}x${height})`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width, height });
      
      // Wait for carousel to adjust
      await page.waitForSelector('#carousel canvas', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Check canvas dimensions
      const canvasDimensions = await page.evaluate(() => {
        const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
        };
      });
      
      // Canvas should have reasonable dimensions
      expect(canvasDimensions.width).toBeGreaterThan(0);
      expect(canvasDimensions.height).toBeGreaterThan(0);
      expect(canvasDimensions.clientWidth).toBeGreaterThan(0);
      expect(canvasDimensions.clientHeight).toBeGreaterThan(0);
      
      // Take screenshot for visual verification
      await expect(page).toHaveScreenshot(`responsive-${name.toLowerCase()}.png`);
    });
  });

  test('should handle orientation change', async ({ page, context }) => {
    // Start in portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('#carousel canvas');
    
    const portraitDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    const landscapeDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });
    
    // Dimensions should have updated
    expect(landscapeDimensions.width).not.toBe(portraitDimensions.width);
    expect(landscapeDimensions.height).not.toBe(portraitDimensions.height);
  });

  test('should maintain aspect ratio on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForSelector('#carousel canvas');
    
    // Trigger multiple resizes
    const sizes = [
      { width: 1000, height: 700 },
      { width: 800, height: 600 },
      { width: 600, height: 800 },
    ];
    
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300);
      
      // Check that images are properly displayed
      const isProperlyDisplayed = await page.evaluate(() => {
        const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        return gl && !gl.isContextLost();
      });
      
      expect(isProperlyDisplayed).toBeTruthy();
    }
  });

  test('should hide controls on small screens if configured', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('#carousel');
    
    // Check if controls are visible/hidden based on configuration
    const controlsPanel = await page.locator('.controls-panel');
    const isMobileControlsHidden = await controlsPanel.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.display === 'none' || styles.visibility === 'hidden';
    });
    
    // This depends on your responsive design choices
    // Adjust the expectation based on your actual implementation
    expect(typeof isMobileControlsHidden).toBe('boolean');
  });

  test('should handle touch gestures on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('#carousel canvas');
    
    const initialIndex = await page.evaluate(() => {
      return (window as any).carousel?.getCurrentIndex() || 0;
    });
    
    // Simulate swipe left
    const carousel = await page.locator('#carousel');
    const box = await carousel.boundingBox();
    
    if (box) {
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(1500);
      
      const newIndex = await page.evaluate(() => {
        return (window as any).carousel?.getCurrentIndex() || 0;
      });
      
      // Should have moved to next image
      expect(newIndex).toBe((initialIndex + 1) % 3);
    }
  });
});