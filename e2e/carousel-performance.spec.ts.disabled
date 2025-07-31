import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#carousel canvas', { timeout: 5000 });
  });

  test('should maintain 60fps during transitions', async ({ page }) => {
    // Enable performance monitoring
    const metrics = await page.evaluate(() => {
      const frames: number[] = [];
      let lastTime = performance.now();
      let rafId: number;
      
      const measureFPS = () => {
        const currentTime = performance.now();
        const fps = 1000 / (currentTime - lastTime);
        frames.push(fps);
        lastTime = currentTime;
        
        if (frames.length < 120) { // Measure for ~2 seconds
          rafId = requestAnimationFrame(measureFPS);
        }
      };
      
      // Start measuring
      measureFPS();
      
      // Trigger transition
      (window as any).carousel?.next();
      
      return new Promise<number[]>((resolve) => {
        setTimeout(() => {
          cancelAnimationFrame(rafId);
          resolve(frames);
        }, 2000);
      });
    });
    
    // Calculate average FPS
    const avgFPS = metrics.reduce((sum, fps) => sum + fps, 0) / metrics.length;
    const minFPS = Math.min(...metrics);
    
    // Should maintain good performance
    expect(avgFPS).toBeGreaterThan(50); // Average should be above 50fps
    expect(minFPS).toBeGreaterThan(30); // Minimum should not drop below 30fps
  });

  test('should not leak memory during multiple transitions', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple transitions
    for (let i = 0; i < 10; i++) {
      await page.locator('[aria-label="Next image"]').click();
      await page.waitForTimeout(1200);
    }
    
    // Force garbage collection if possible
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory increase should be reasonable (less than 10MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('should load images efficiently', async ({ page }) => {
    // Clear cache and reload
    await page.reload({ waitUntil: 'networkidle' });
    
    // Measure image loading performance
    const loadingMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          imageLoadTimes: [] as number[],
          totalLoadTime: 0,
        };
        
        const startTime = performance.now();
        
        // Wait for all images to be loaded
        const checkImages = () => {
          const carousel = (window as any).carousel;
          if (carousel && carousel.imageLoader) {
            const loadedCount = carousel.imageLoader.getLoadedCount();
            const totalCount = carousel.imageLoader.getTotalCount();
            
            if (loadedCount === totalCount) {
              metrics.totalLoadTime = performance.now() - startTime;
              resolve(metrics);
            } else {
              setTimeout(checkImages, 100);
            }
          } else {
            setTimeout(checkImages, 100);
          }
        };
        
        checkImages();
      });
    });
    
    // Images should load reasonably quickly (under 5 seconds for demo images)
    expect(loadingMetrics.totalLoadTime).toBeLessThan(5000);
  });

  test('should handle rapid effect changes without performance degradation', async ({ page }) => {
    const effects = ['fade', 'slide', 'flip', 'wave', 'distortion'];
    
    // Measure performance during rapid effect changes
    const startTime = Date.now();
    
    for (const effect of effects) {
      await page.locator('#effectSelect').selectOption(effect);
      await page.waitForTimeout(100);
      await page.locator('[aria-label="Next image"]').click();
      await page.waitForTimeout(500);
    }
    
    const totalTime = Date.now() - startTime;
    
    // Should complete all transitions smoothly
    expect(totalTime).toBeLessThan(effects.length * 1000); // Less than 1s per effect change
    
    // Check for any WebGL errors
    const hasErrors = await page.evaluate(() => {
      const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return gl ? gl.getError() !== gl.NO_ERROR : true;
    });
    
    expect(hasErrors).toBeFalsy();
  });

  test('should handle large images without significant performance impact', async ({ page }) => {
    // This test assumes your demo includes some larger images
    // Measure FPS during transition with large images
    
    const transitionMetrics = await page.evaluate(async () => {
      const frames: number[] = [];
      let animationId: number;
      
      return new Promise<{ avgFPS: number; duration: number }>((resolve) => {
        const startTime = performance.now();
        let lastFrameTime = startTime;
        
        const measureFrame = () => {
          const currentTime = performance.now();
          const deltaTime = currentTime - lastFrameTime;
          
          if (deltaTime > 0) {
            frames.push(1000 / deltaTime);
          }
          
          lastFrameTime = currentTime;
          
          if (currentTime - startTime < 2000) {
            animationId = requestAnimationFrame(measureFrame);
          } else {
            cancelAnimationFrame(animationId);
            
            const avgFPS = frames.reduce((sum, fps) => sum + fps, 0) / frames.length;
            const duration = currentTime - startTime;
            
            resolve({ avgFPS, duration });
          }
        };
        
        // Trigger transition and start measuring
        (window as any).carousel?.next();
        measureFrame();
      });
    });
    
    // Performance should still be acceptable with large images
    expect(transitionMetrics.avgFPS).toBeGreaterThan(45);
  });
});