import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Load Debug', () => {
  test('debug script loading', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    });
    
    // Listen for page errors  
    page.on('pageerror', err => {
      console.log('[Browser Error]:', err.toString());
    });
    
    // Navigate to demo page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if script tag exists
    const scriptExists = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('webgl-carousel.umd.js'));
    });
    console.log('Script tag exists:', scriptExists);
    
    // Check what's in window object
    const windowKeys = await page.evaluate(() => {
      return Object.keys(window).filter(key => 
        key.toLowerCase().includes('webgl') || 
        key.toLowerCase().includes('carousel')
      );
    });
    console.log('Window keys containing webgl/carousel:', windowKeys);
    
    // Check global WebGLCarousel
    const globalCheck = await page.evaluate(() => {
      const result: any = {};
      
      // Check various possible locations
      result.windowWebGLCarousel = typeof (window as any).WebGLCarousel;
      result.globalWebGLCarousel = typeof (globalThis as any).WebGLCarousel;
      
      if ((window as any).WebGLCarousel) {
        result.webglCarouselKeys = Object.keys((window as any).WebGLCarousel);
        result.hasDefault = 'default' in (window as any).WebGLCarousel;
        result.hasWebGLCarousel = 'WebGLCarousel' in (window as any).WebGLCarousel;
      }
      
      return result;
    });
    
    console.log('Global check:', JSON.stringify(globalCheck, null, 2));
    
    // Try to check if the script actually loaded
    const scriptLoaded = await page.evaluate(async () => {
      // Wait a bit for async loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        WebGLCarouselType: typeof (window as any).WebGLCarousel,
        WebGLCarouselKeys: (window as any).WebGLCarousel ? Object.keys((window as any).WebGLCarousel) : null
      };
    });
    
    console.log('Script loaded check:', scriptLoaded);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/load-debug.png', fullPage: true });
  });
});