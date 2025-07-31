import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Debug', () => {
  test('debug console errors', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', err => {
      pageErrors.push(err.toString());
    });
    
    // Navigate to demo page
    await page.goto('/');
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000);
    
    // Print all console messages
    console.log('Console messages:', consoleMessages);
    console.log('Page errors:', pageErrors);
    
    // Check for specific errors
    const hasErrors = consoleMessages.some(msg => msg.includes('error')) || pageErrors.length > 0;
    
    // Check if WebGLCarousel exists
    const webglCarouselExists = await page.evaluate(() => {
      return typeof (window as any).WebGLCarousel !== 'undefined';
    });
    
    // Check if carousel instance exists
    const carouselExists = await page.evaluate(() => {
      return typeof (window as any).carousel !== 'undefined';
    });
    
    console.log('WebGLCarousel exists:', webglCarouselExists);
    console.log('Carousel instance exists:', carouselExists);
    
    // Try to get carousel state
    const carouselState = await page.evaluate(() => {
      const c = (window as any).carousel;
      if (!c) return null;
      
      return {
        isReady: c.isReady ? c.isReady() : false,
        currentIndex: c.getCurrentIndex ? c.getCurrentIndex() : -1,
        hasCanvas: !!document.querySelector('#carousel canvas')
      };
    });
    
    console.log('Carousel state:', carouselState);
    
    // Assert no critical errors
    expect(hasErrors).toBeFalsy();
  });
});