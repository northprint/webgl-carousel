import { test, expect } from '@playwright/test';

test.describe('Debug UMD Exports', () => {
  test('check UMD exports structure', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      console.log(`[Browser]:`, msg.text());
    });
    
    page.on('pageerror', err => {
      console.log('[Page Error]:', err.toString());
    });
    
    // Navigate to demo page
    await page.goto('/');
    
    // Wait for script to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check WebGLCarousel structure
    const exportInfo = await page.evaluate(() => {
      const result: any = {};
      
      // Check if WebGLCarousel exists
      result.exists = typeof (window as any).WebGLCarousel !== 'undefined';
      
      if ((window as any).WebGLCarousel) {
        const wc = (window as any).WebGLCarousel;
        result.type = typeof wc;
        result.keys = Object.keys(wc);
        
        // Check each key
        result.exports = {};
        for (const key of result.keys) {
          result.exports[key] = {
            type: typeof wc[key],
            isFunction: typeof wc[key] === 'function',
            name: wc[key] && wc[key].name ? wc[key].name : null
          };
        }
        
        // Check default export
        if (wc.default) {
          result.defaultInfo = {
            type: typeof wc.default,
            isFunction: typeof wc.default === 'function',
            name: wc.default.name || 'unnamed',
            hasPrototype: !!wc.default.prototype
          };
        }
      }
      
      return result;
    });
    
    console.log('WebGLCarousel export structure:', JSON.stringify(exportInfo, null, 2));
    
    // Try to create instance
    const instanceTest = await page.evaluate(() => {
      try {
        const wc = (window as any).WebGLCarousel;
        if (!wc) return { error: 'WebGLCarousel not found' };
        
        // Try different ways
        const results: any = {};
        
        // Try default
        if (wc.default) {
          try {
            const instance = new wc.default({ container: '#test' });
            results.default = 'success';
          } catch (e: any) {
            results.default = `error: ${e.message}`;
          }
        }
        
        // Try WebGLCarousel property
        if (wc.WebGLCarousel) {
          try {
            const instance = new wc.WebGLCarousel({ container: '#test' });
            results.WebGLCarousel = 'success';
          } catch (e: any) {
            results.WebGLCarousel = `error: ${e.message}`;
          }
        }
        
        return results;
      } catch (e: any) {
        return { error: e.message };
      }
    });
    
    console.log('Instance creation results:', instanceTest);
    
    // Check if carousel was created
    const carouselCreated = await page.evaluate(() => {
      return !!(window as any).carousel;
    });
    
    console.log('Carousel instance created:', carouselCreated);
  });
});