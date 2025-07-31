import { test, expect } from '@playwright/test';

test.describe('WebGL Carousel - Effects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#carousel canvas', { timeout: 5000 });
  });

  const effects = [
    'fade',
    'slideLeft',
    'slideRight',
    'slideUp',
    'slideDown',
    'flipHorizontal',
    'flipVertical',
    'wave',
    'distortion',
    'dissolve',
    'pixelDissolve',
    'circle',
    'morph',
    'glitch',
    'pageFlip'
  ];

  effects.forEach(effectName => {
    test(`should apply ${effectName} effect`, async ({ page }) => {
      // Select effect from dropdown
      const effectSelect = await page.locator('#effectSelect');
      await effectSelect.selectOption(effectName);
      
      // Verify effect is applied
      const currentEffect = await page.evaluate(() => {
        return (window as any).carousel?.getCurrentEffect();
      });
      
      expect(currentEffect).toBe(effectName);
      
      // Trigger transition
      const nextButton = await page.locator('[aria-label="Next image"]');
      await nextButton.click();
      
      // Wait for transition to complete
      await page.waitForTimeout(1500);
      
      // Take screenshot for visual verification
      await expect(page.locator('#carousel')).toHaveScreenshot(`effect-${effectName}.png`);
    });
  });

  test('should change transition duration', async ({ page }) => {
    // Change duration via slider
    const durationSlider = await page.locator('#durationSlider');
    await durationSlider.fill('2000');
    
    // Verify duration changed
    const duration = await page.evaluate(() => {
      return (window as any).carousel?.options?.transitionDuration || 1000;
    });
    
    expect(duration).toBe(2000);
  });

  test('should apply custom effect parameters', async ({ page }) => {
    // Select wave effect
    await page.locator('#effectSelect').selectOption('wave');
    
    // Adjust wave parameters
    const amplitudeSlider = await page.locator('#waveAmplitude');
    const frequencySlider = await page.locator('#waveFrequency');
    
    if (await amplitudeSlider.isVisible()) {
      await amplitudeSlider.fill('0.2');
      await frequencySlider.fill('15');
      
      // Trigger transition to see effect
      await page.locator('[aria-label="Next image"]').click();
      await page.waitForTimeout(1500);
      
      // Verify parameters were applied
      const params = await page.evaluate(() => {
        const effect = (window as any).carousel?.effectManager?.currentEffect;
        return {
          amplitude: effect?.amplitude,
          frequency: effect?.frequency
        };
      });
      
      expect(params.amplitude).toBeCloseTo(0.2, 1);
      expect(params.frequency).toBeCloseTo(15, 1);
    }
  });

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    // Simulate context loss
    await page.evaluate(() => {
      const canvas = document.querySelector('#carousel canvas') as HTMLCanvasElement;
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
    });
    
    // Wait a moment
    await page.waitForTimeout(500);
    
    // Verify error handler was called or fallback is active
    const hasFallback = await page.evaluate(() => {
      return document.querySelector('#carousel canvas.canvas2d-fallback') !== null;
    });
    
    const hasError = await page.evaluate(() => {
      return (window as any).lastCarouselError !== undefined;
    });
    
    expect(hasFallback || hasError).toBeTruthy();
  });

  test('should load custom shader effect', async ({ page }) => {
    // Check if custom shader section exists
    const customShaderSection = await page.locator('#customShaderSection');
    
    if (await customShaderSection.isVisible()) {
      // Select custom effect
      await page.locator('#effectSelect').selectOption('custom');
      
      // Load a preset
      const presetSelect = await page.locator('#shaderPreset');
      await presetSelect.selectOption('spiral');
      
      // Apply custom shader
      const applyButton = await page.locator('#applyCustomShader');
      await applyButton.click();
      
      // Verify custom effect is active
      await page.waitForTimeout(500);
      
      const currentEffect = await page.evaluate(() => {
        return (window as any).carousel?.effectManager?.currentEffect?.name;
      });
      
      expect(currentEffect).toContain('custom');
      
      // Trigger transition
      await page.locator('[aria-label="Next image"]').click();
      await page.waitForTimeout(1500);
      
      // Verify no errors occurred
      const hasErrors = await page.evaluate(() => {
        return (window as any).lastShaderError !== undefined;
      });
      
      expect(hasErrors).toBeFalsy();
    }
  });
});