import { test, expect } from '@playwright/test';

test.describe('Network Debug', () => {
  test('check network requests', async ({ page }) => {
    const failedRequests: string[] = [];
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Listen for responses
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`[${response.status()}] ${response.url()}`);
      }
    });
    
    // Navigate to demo page
    await page.goto('/');
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    console.log('Failed requests:', failedRequests);
    
    // Check specific script request
    const scriptResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('../dist/webgl-carousel.umd.js');
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    
    console.log('Script fetch result:', scriptResponse);
  });
});