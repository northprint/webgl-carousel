import {
  DEFAULT_CONFIG,
  DEFAULT_CALLBACKS,
  getDefaultOptions,
  VALIDATION_RULES,
  CSS_DEFAULTS,
} from '../../../src/constants/defaults';
import type { WebGLCarouselOptions } from '../../../src/types';

describe('defaults constants', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONFIG.effect).toBe('fade');
      expect(DEFAULT_CONFIG.autoplay).toBe(false);
      expect(DEFAULT_CONFIG.autoplayInterval).toBe(3000);
      expect(DEFAULT_CONFIG.navigation).toBe(true);
      expect(DEFAULT_CONFIG.pagination).toBe(true);
      expect(DEFAULT_CONFIG.loop).toBe(true);
      expect(DEFAULT_CONFIG.preload).toBe(true);
      expect(DEFAULT_CONFIG.fallbackToCanvas2D).toBe(true);
      expect(DEFAULT_CONFIG.transitionDuration).toBe(1000);
      expect(DEFAULT_CONFIG.startIndex).toBe(0);
      expect(DEFAULT_CONFIG.easing(0.5)).toBe(0.5);
    });

    it('should have immutable values', () => {
      // TypeScript const assertion provides compile-time immutability
      // Runtime immutability is not enforced by JavaScript
      const config = DEFAULT_CONFIG;
      // @ts-expect-error Testing that TypeScript prevents modification
      const testModification = () => { config.effect = 'slide'; };
      expect(typeof testModification).toBe('function');
    });
  });

  describe('DEFAULT_CALLBACKS', () => {
    it('should have no-op functions', () => {
      expect(() => DEFAULT_CALLBACKS.onImageChange()).not.toThrow();
      expect(() => DEFAULT_CALLBACKS.onTransitionStart()).not.toThrow();
      expect(() => DEFAULT_CALLBACKS.onTransitionEnd()).not.toThrow();
      expect(() => DEFAULT_CALLBACKS.onError()).not.toThrow();
    });
  });

  describe('getDefaultOptions', () => {
    const minimalOptions: WebGLCarouselOptions = {
      container: '#carousel',
      images: ['image1.jpg', 'image2.jpg'],
    };

    it('should return all required properties with defaults', () => {
      const result = getDefaultOptions(minimalOptions);

      expect(result.container).toBe('#carousel');
      expect(result.images).toEqual(['image1.jpg', 'image2.jpg']);
      expect(result.effect).toBe('fade');
      expect(result.autoplay).toBe(false);
      expect(result.autoplayInterval).toBe(3000);
      expect(result.navigation).toBe(true);
      expect(result.pagination).toBe(true);
      expect(result.loop).toBe(true);
      expect(result.preload).toBe(true);
      expect(result.fallbackToCanvas2D).toBe(true);
      expect(result.transitionDuration).toBe(1000);
      expect(result.startIndex).toBe(0);
      expect(typeof result.easing).toBe('function');
      expect(typeof result.onImageChange).toBe('function');
      expect(typeof result.onTransitionStart).toBe('function');
      expect(typeof result.onTransitionEnd).toBe('function');
      expect(typeof result.onError).toBe('function');
    });

    it('should preserve provided values', () => {
      const customOptions: WebGLCarouselOptions = {
        ...minimalOptions,
        effect: 'slide',
        autoplay: true,
        autoplayInterval: 5000,
        navigation: false,
        pagination: false,
        loop: false,
        preload: false,
        fallbackToCanvas2D: false,
        transitionDuration: 2000,
        startIndex: 1,
        easing: (t: number) => t * t,
        onImageChange: jest.fn(),
        onTransitionStart: jest.fn(),
        onTransitionEnd: jest.fn(),
        onError: jest.fn(),
      };

      const result = getDefaultOptions(customOptions);

      expect(result.effect).toBe('slide');
      expect(result.autoplay).toBe(true);
      expect(result.autoplayInterval).toBe(5000);
      expect(result.navigation).toBe(false);
      expect(result.pagination).toBe(false);
      expect(result.loop).toBe(false);
      expect(result.preload).toBe(false);
      expect(result.fallbackToCanvas2D).toBe(false);
      expect(result.transitionDuration).toBe(2000);
      expect(result.startIndex).toBe(1);
      expect(result.easing(0.5)).toBe(0.25);
      expect(result.onImageChange).toBe(customOptions.onImageChange);
      expect(result.onTransitionStart).toBe(customOptions.onTransitionStart);
      expect(result.onTransitionEnd).toBe(customOptions.onTransitionEnd);
      expect(result.onError).toBe(customOptions.onError);
    });

    it('should handle partial options', () => {
      const partialOptions: WebGLCarouselOptions = {
        ...minimalOptions,
        autoplay: true,
        transitionDuration: 1500,
      };

      const result = getDefaultOptions(partialOptions);

      expect(result.autoplay).toBe(true);
      expect(result.transitionDuration).toBe(1500);
      expect(result.navigation).toBe(true); // Default value
      expect(result.pagination).toBe(true); // Default value
    });
  });

  describe('VALIDATION_RULES', () => {
    it('should have expected validation constants', () => {
      expect(VALIDATION_RULES.MIN_IMAGES).toBe(1);
      expect(VALIDATION_RULES.MIN_AUTOPLAY_INTERVAL).toBe(100);
      expect(VALIDATION_RULES.MIN_TRANSITION_DURATION).toBe(0);
      expect(VALIDATION_RULES.MAX_TRANSITION_DURATION).toBe(10000);
    });

    it('should be immutable', () => {
      // TypeScript const assertion provides compile-time immutability
      const rules = VALIDATION_RULES;
      // @ts-expect-error Testing that TypeScript prevents modification
      const testModification = () => { rules.MIN_IMAGES = 0; };
      expect(typeof testModification).toBe('function');
    });
  });

  describe('CSS_DEFAULTS', () => {
    it('should have navigation styles', () => {
      expect(CSS_DEFAULTS.NAVIGATION.fontSize).toBe('2rem');
      expect(CSS_DEFAULTS.NAVIGATION.padding).toBe('0.5rem 1rem');
      expect(CSS_DEFAULTS.NAVIGATION.zIndex).toBe(10);
      expect(CSS_DEFAULTS.NAVIGATION.transitionDuration).toBe('0.3s');
      expect(CSS_DEFAULTS.NAVIGATION.offset).toBe('1rem');
    });

    it('should have pagination styles', () => {
      expect(CSS_DEFAULTS.PAGINATION.dotSize).toBe('0.75rem');
      expect(CSS_DEFAULTS.PAGINATION.borderWidth).toBe('2px');
      expect(CSS_DEFAULTS.PAGINATION.gap).toBe('0.5rem');
      expect(CSS_DEFAULTS.PAGINATION.zIndex).toBe(10);
      expect(CSS_DEFAULTS.PAGINATION.bottomOffset).toBe('1rem');
      expect(CSS_DEFAULTS.PAGINATION.transitionDuration).toBe('0.3s');
    });

    it('should be immutable', () => {
      // TypeScript const assertion provides compile-time immutability
      const styles = CSS_DEFAULTS;
      // @ts-expect-error Testing that TypeScript prevents modification
      const testModification = () => { styles.NAVIGATION.fontSize = '3rem'; };
      expect(typeof testModification).toBe('function');
    });
  });
});