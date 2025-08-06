import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { WebGLCarousel } from '../../src/WebGLCarousel';
import { VALIDATION_RULES } from '../../src/constants/defaults';

// Mock the modules
vi.mock('../../src/core/CarouselCore');
vi.mock('../../src/ui/UIController');

describe('WebGLCarousel validation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('container validation', () => {
    it('should throw error if container is not provided', () => {
      expect(() => {
        new WebGLCarousel({
          container: undefined as any,
          images: ['image1.jpg'],
        });
      }).toThrow('Container is required');
    });

    it('should throw error if container selector does not match any element', () => {
      expect(() => {
        new WebGLCarousel({
          container: '#non-existent',
          images: ['image1.jpg'],
        });
      }).toThrow('Container element not found: #non-existent');
    });

    it('should accept HTMLElement directly', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
        });
      }).not.toThrow();
    });

    it('should accept valid selector string', () => {
      container.id = 'test-carousel';
      expect(() => {
        new WebGLCarousel({
          container: '#test-carousel',
          images: ['image1.jpg'],
        });
      }).not.toThrow();
    });
  });

  describe('images validation', () => {
    it('should throw error if images array is not provided', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: undefined as any,
        });
      }).toThrow(`At least ${VALIDATION_RULES.MIN_IMAGES} image is required`);
    });

    it('should throw error if images array is empty', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: [],
        });
      }).toThrow(`At least ${VALIDATION_RULES.MIN_IMAGES} image is required`);
    });

    it('should accept valid images array', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg'],
        });
      }).not.toThrow();
    });
  });

  describe('autoplayInterval validation', () => {
    it('should throw error if autoplayInterval is too small', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          autoplayInterval: 50,
        });
      }).toThrow(
        `Autoplay interval must be at least ${VALIDATION_RULES.MIN_AUTOPLAY_INTERVAL}ms`,
      );
    });

    it('should accept valid autoplayInterval', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          autoplayInterval: 1000,
        });
      }).not.toThrow();
    });

    it('should accept undefined autoplayInterval', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
        });
      }).not.toThrow();
    });
  });

  describe('transitionDuration validation', () => {
    it('should throw error if transitionDuration is negative', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          transitionDuration: -100,
        });
      }).toThrow(
        `Transition duration must be at least ${VALIDATION_RULES.MIN_TRANSITION_DURATION}ms`,
      );
    });

    it('should throw error if transitionDuration is too large', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          transitionDuration: 15000,
        });
      }).toThrow(
        `Transition duration must be at most ${VALIDATION_RULES.MAX_TRANSITION_DURATION}ms`,
      );
    });

    it('should accept valid transitionDuration', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          transitionDuration: 2000,
        });
      }).not.toThrow();
    });

    it('should accept zero transitionDuration', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          transitionDuration: 0,
        });
      }).not.toThrow();
    });

    it('should accept maximum transitionDuration', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg'],
          transitionDuration: VALIDATION_RULES.MAX_TRANSITION_DURATION,
        });
      }).not.toThrow();
    });
  });

  describe('startIndex validation', () => {
    it('should throw error if startIndex is negative', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg'],
          startIndex: -1,
        });
      }).toThrow('Start index must be between 0 and 1');
    });

    it('should throw error if startIndex is greater than or equal to images length', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg'],
          startIndex: 2,
        });
      }).toThrow('Start index must be between 0 and 1');
    });

    it('should accept valid startIndex', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          startIndex: 1,
        });
      }).not.toThrow();
    });

    it('should accept zero startIndex', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg'],
          startIndex: 0,
        });
      }).not.toThrow();
    });

    it('should accept undefined startIndex', () => {
      expect(() => {
        new WebGLCarousel({
          container,
          images: ['image1.jpg', 'image2.jpg'],
        });
      }).not.toThrow();
    });
  });

  describe('default values assignment', () => {
    it('should use default values when options are not provided', () => {
      const carousel = new WebGLCarousel({
        container,
        images: ['image1.jpg'],
      });

      // Access private options through any cast for testing
      const options = (carousel as any).options;

      expect(options.effect).toBe('fade');
      expect(options.autoplay).toBe(false);
      expect(options.autoplayInterval).toBe(3000);
      expect(options.navigation).toBe(true);
      expect(options.pagination).toBe(true);
      expect(options.loop).toBe(true);
      expect(options.preload).toBe(true);
      expect(options.fallbackToCanvas2D).toBe(true);
      expect(options.transitionDuration).toBe(1000);
      expect(options.startIndex).toBe(0);
      expect(typeof options.easing).toBe('function');
      expect(typeof options.onImageChange).toBe('function');
      expect(typeof options.onTransitionStart).toBe('function');
      expect(typeof options.onTransitionEnd).toBe('function');
      expect(typeof options.onError).toBe('function');
    });

    it('should preserve user-provided values', () => {
      const customEasing = (t: number) => t * t;
      const onImageChange = vi.fn();
      const onError = vi.fn();

      const carousel = new WebGLCarousel({
        container,
        images: ['image1.jpg'],
        effect: 'slide',
        autoplay: true,
        autoplayInterval: 5000,
        navigation: false,
        transitionDuration: 500,
        easing: customEasing,
        onImageChange,
        onError,
      });

      const options = (carousel as any).options;

      expect(options.effect).toBe('slide');
      expect(options.autoplay).toBe(true);
      expect(options.autoplayInterval).toBe(5000);
      expect(options.navigation).toBe(false);
      expect(options.transitionDuration).toBe(500);
      expect(options.easing).toBe(customEasing);
      expect(options.onImageChange).toBe(onImageChange);
      expect(options.onError).toBe(onError);
    });
  });
});