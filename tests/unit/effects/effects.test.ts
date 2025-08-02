import { 
  FadeEffect,
  SlideEffect,
  FlipEffect,
  WaveEffect,
  DistortionEffect,
  fadeEffect,
  slideLeftEffect,
  slideRightEffect,
  slideUpEffect,
  slideDownEffect,
  flipHorizontalEffect,
  flipVerticalEffect,
  waveEffect,
  distortionEffect,
  getDefaultEffects,
  registerDefaultEffects
} from '../../../src/effects';
import { EffectManager } from '../../../src/core/EffectManager';

describe('Effects', () => {
  describe('FadeEffect', () => {
    it('should have correct name and shaders', () => {
      const effect = new FadeEffect();
      expect(effect.name).toBe('fade');
      expect(effect.vertexShader).toContain('attribute vec2 aPosition');
      expect(effect.fragmentShader).toContain('uProgress');
    });

    it('should return correct uniforms', () => {
      const effect = new FadeEffect();
      const uniforms = effect.getUniforms(0.5);
      expect(uniforms).toEqual({ uProgress: 0.5 });
    });
  });

  describe('SlideEffect', () => {
    it('should have correct name and accept direction', () => {
      const leftSlide = new SlideEffect('left');
      const rightSlide = new SlideEffect('right');
      
      expect(leftSlide.name).toBe('slideLeft');
      expect(rightSlide.name).toBe('slideRight');
    });

    it('should return correct uniforms for each direction', () => {
      const leftSlide = new SlideEffect('left');
      const rightSlide = new SlideEffect('right');
      const upSlide = new SlideEffect('up');
      const downSlide = new SlideEffect('down');

      expect(leftSlide.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uDirection: [-1, 0] 
      });
      expect(rightSlide.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uDirection: [1, 0] 
      });
      expect(upSlide.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uDirection: [0, 1] 
      });
      expect(downSlide.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uDirection: [0, -1] 
      });
    });
  });

  describe('FlipEffect', () => {
    it('should have custom vertex shader', () => {
      const effect = new FlipEffect();
      expect(effect.name).toBe('flipHorizontal');
      expect(effect.vertexShader).toContain('uAxis');
      expect(effect.vertexShader).toContain('position.x *= scale');
      expect(effect.fragmentShader).toContain('uProgress');
    });

    it('should return correct uniforms for each axis', () => {
      const horizontal = new FlipEffect('horizontal');
      const vertical = new FlipEffect('vertical');

      expect(horizontal.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uAxis: 0 
      });
      expect(vertical.getUniforms(0.5)).toEqual({ 
        uProgress: 0.5, 
        uAxis: 1 
      });
    });
  });

  describe('WaveEffect', () => {
    it('should accept custom options', () => {
      const effect = new WaveEffect({ 
        amplitude: 0.2, 
        frequency: 5.0, 
        speed: 2.0 
      });
      
      const uniforms = effect.getUniforms(0.5);
      expect(uniforms.uAmplitude).toBe(0.2);
      expect(uniforms.uFrequency).toBe(5.0);
      expect(uniforms.uSpeed).toBe(2.0);
      expect(uniforms.uTime).toBeGreaterThanOrEqual(0);
    });

    it('should have default values', () => {
      const effect = new WaveEffect();
      const uniforms = effect.getUniforms(0.5);
      
      expect(uniforms.uAmplitude).toBe(0.1);
      expect(uniforms.uFrequency).toBe(10.0);
      expect(uniforms.uSpeed).toBe(1.0);
    });

    it('should implement onBeforeRender hook', () => {
      const effect = new WaveEffect();
      expect(effect.onBeforeRender).toBeDefined();
    });
  });

  describe('DistortionEffect', () => {
    it('should accept custom options', () => {
      const effect = new DistortionEffect({ 
        intensity: 0.8, 
        radius: 0.5, 
        spiral: 3.0 
      });
      
      const uniforms = effect.getUniforms(0.5);
      expect(uniforms).toEqual({
        uProgress: 0.5,
        uIntensity: 0.8,
        uRadius: 0.5,
        uSpiral: 3.0
      });
    });

    it('should have complex shader with distortion logic', () => {
      const effect = new DistortionEffect();
      expect(effect.fragmentShader).toContain('distort');
      expect(effect.fragmentShader).toContain('vignette');
    });
  });

  describe('Preset instances', () => {
    it('should export singleton instances', () => {
      expect(fadeEffect).toBeInstanceOf(FadeEffect);
      expect(slideLeftEffect).toBeInstanceOf(SlideEffect);
      expect(flipHorizontalEffect).toBeInstanceOf(FlipEffect);
      expect(waveEffect).toBeInstanceOf(WaveEffect);
      expect(distortionEffect).toBeInstanceOf(DistortionEffect);
    });
  });

  describe('getDefaultEffects', () => {
    it('should return all default effect instances', () => {
      const defaultEffects = getDefaultEffects();
      expect(defaultEffects).toHaveLength(26);
      expect(defaultEffects).toContain(fadeEffect);
      expect(defaultEffects).toContain(slideLeftEffect);
      expect(defaultEffects).toContain(slideRightEffect);
      expect(defaultEffects).toContain(slideUpEffect);
      expect(defaultEffects).toContain(slideDownEffect);
      expect(defaultEffects).toContain(flipHorizontalEffect);
      expect(defaultEffects).toContain(flipVerticalEffect);
      expect(defaultEffects).toContain(waveEffect);
      expect(defaultEffects).toContain(distortionEffect);
    });
  });

  describe('registerDefaultEffects', () => {
    it('should register all default effects to manager', () => {
      const manager = new EffectManager();
      expect(manager.size()).toBe(0);

      registerDefaultEffects(manager);

      expect(manager.size()).toBe(26); // 26 unique effect names
      // Basic effects
      expect(manager.has('fade')).toBe(true);
      expect(manager.has('slideLeft')).toBe(true);
      expect(manager.has('slideRight')).toBe(true);
      expect(manager.has('slideUp')).toBe(true);
      expect(manager.has('slideDown')).toBe(true);
      expect(manager.has('flipHorizontal')).toBe(true);
      expect(manager.has('flipVertical')).toBe(true);
      expect(manager.has('wave')).toBe(true);
      expect(manager.has('distortion')).toBe(true);
      expect(manager.has('dissolve')).toBe(true);
      expect(manager.has('circle')).toBe(true);
      expect(manager.has('pixelDissolve')).toBe(true);
      expect(manager.has('morph')).toBe(true);
      expect(manager.has('glitch')).toBe(true);
      // Variants
      expect(manager.has('gentleWave')).toBe(true);
      expect(manager.has('intenseWave')).toBe(true);
      expect(manager.has('subtleDistortion')).toBe(true);
      expect(manager.has('extremeDistortion')).toBe(true);
      expect(manager.has('smoothDissolve')).toBe(true);
      expect(manager.has('largePixelDissolve')).toBe(true);
      expect(manager.has('smallPixelDissolve')).toBe(true);
      expect(manager.has('circleFromCenter')).toBe(true);
      expect(manager.has('circleFromCorner')).toBe(true);
      expect(manager.has('intenseMorph')).toBe(true);
      expect(manager.has('intenseGlitch')).toBe(true);
      expect(manager.has('subtleGlitch')).toBe(true);
      // trianglePeel variants are not in the default effects
    });
  });
});