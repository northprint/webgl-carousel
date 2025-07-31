import { WebGLCarousel } from '../../src/WebGLCarousel';
import { WebGLCarouselOptions } from '../../src/WebGLCarousel';

// Mock for testing without actual WebGL/Canvas2D
jest.mock('../../src/core/CarouselCore', () => {
  return {
    CarouselCore: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      next: jest.fn(),
      previous: jest.fn(),
      goTo: jest.fn(),
      setEffect: jest.fn().mockReturnValue(true),
      setAutoplay: jest.fn(),
      setTransitionDuration: jest.fn(),
      getCurrentIndex: jest.fn().mockReturnValue(0),
      registerEffect: jest.fn(),
      resize: jest.fn(),
      dispose: jest.fn(),
      on: jest.fn(),
      effectManager: {
        list: jest.fn().mockReturnValue(['fade', 'slide', 'flip', 'wave', 'distortion']),
        register: jest.fn(),
      },
    })),
  };
});

describe('WebGLCarousel Unit Tests', () => {
  let container: HTMLElement;
  let originalGetBoundingClientRect: () => DOMRect;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Mock getBoundingClientRect to return proper dimensions
    originalGetBoundingClientRect = container.getBoundingClientRect;
    container.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }));
  });

  afterEach(() => {
    // Restore original function
    if (originalGetBoundingClientRect) {
      container.getBoundingClientRect = originalGetBoundingClientRect;
    }
    container.remove();
  });

  describe('constructor', () => {
    it('should throw error if container is not provided', () => {
      expect(() => {
        new WebGLCarousel({ container: '', images: ['image.jpg'] });
      }).toThrow('Container is required');
    });

    it('should throw error if images are not provided', () => {
      expect(() => {
        new WebGLCarousel({ container, images: [] });
      }).toThrow('At least one image is required');
    });

    it('should throw error if container selector not found', () => {
      expect(() => {
        new WebGLCarousel({ container: '#non-existent', images: ['image.jpg'] });
      }).toThrow('Container element not found');
    });

    it('should accept container as HTML element', () => {
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
      });
      
      expect(carousel).toBeDefined();
      carousel.destroy();
    });

    it('should accept container as selector string', () => {
      container.id = 'test-container';
      
      const carousel = new WebGLCarousel({
        container: '#test-container',
        images: ['image.jpg'],
      });
      
      expect(carousel).toBeDefined();
      carousel.destroy();
    });

    it('should create canvas element', () => {
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
      });
      
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      // After initialization, canvas dimensions are set in pixels based on container size
      expect(canvas?.style.width).toBe('800px');
      expect(canvas?.style.height).toBe('600px');
      expect(canvas?.style.display).toBe('block');
      
      carousel.destroy();
    });

    it('should set container position to relative if static', () => {
      container.style.position = 'static';
      
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
      });
      
      expect(container.style.position).toBe('relative');
      carousel.destroy();
    });
  });

  describe('options', () => {
    it('should use default options', () => {
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
      });
      
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
      
      carousel.destroy();
    });

    it('should override default options', () => {
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
        effect: 'slide',
        autoplay: true,
        autoplayInterval: 5000,
        navigation: false,
        pagination: false,
        loop: false,
        preload: false,
        fallbackToCanvas2D: false,
        transitionDuration: 2000,
      });
      
      const options = (carousel as any).options;
      expect(options.effect).toBe('slide');
      expect(options.autoplay).toBe(true);
      expect(options.autoplayInterval).toBe(5000);
      expect(options.navigation).toBe(false);
      expect(options.pagination).toBe(false);
      expect(options.loop).toBe(false);
      expect(options.preload).toBe(false);
      expect(options.fallbackToCanvas2D).toBe(false);
      expect(options.transitionDuration).toBe(2000);
      
      carousel.destroy();
    });
  });

  describe('public methods', () => {
    let carousel: WebGLCarousel;
    let mockCore: any;

    beforeEach(() => {
      carousel = new WebGLCarousel({
        container,
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
      });
      mockCore = (carousel as any).core;
      (carousel as any).isInitialized = true; // Bypass initialization check
    });

    afterEach(() => {
      carousel.destroy();
    });

    it('should call core.next()', () => {
      carousel.next();
      expect(mockCore.next).toHaveBeenCalled();
    });

    it('should call core.previous()', () => {
      carousel.previous();
      expect(mockCore.previous).toHaveBeenCalled();
    });

    it('should call core.goTo()', () => {
      carousel.goTo(2);
      expect(mockCore.goTo).toHaveBeenCalledWith(2);
    });

    it('should call core.setEffect()', () => {
      carousel.setEffect('wave');
      expect(mockCore.setEffect).toHaveBeenCalledWith('wave');
    });

    it('should return available effects', () => {
      const effects = carousel.getAvailableEffects();
      expect(effects).toEqual(['fade', 'slide', 'flip', 'wave', 'distortion']);
    });

    it('should register effect', () => {
      const mockEffect = { name: 'custom', vertexShader: '', fragmentShader: '', getUniforms: () => ({}) };
      carousel.registerEffect(mockEffect);
      expect(mockCore.effectManager.register).toHaveBeenCalledWith(mockEffect);
    });

    it('should call core.setAutoplay() for play', () => {
      carousel.play();
      expect(mockCore.setAutoplay).toHaveBeenCalledWith(true, 3000);
    });

    it('should call core.setAutoplay() for pause', () => {
      carousel.pause();
      expect(mockCore.setAutoplay).toHaveBeenCalledWith(false);
    });

    it('should call core.setTransitionDuration()', () => {
      carousel.setTransitionDuration(2000);
      expect(mockCore.setTransitionDuration).toHaveBeenCalledWith(2000);
    });

    it('should return current index', () => {
      const index = carousel.getCurrentIndex();
      expect(index).toBe(0);
    });

    it('should return image count', () => {
      const count = carousel.getImageCount();
      expect(count).toBe(3);
    });

    it('should return ready state', () => {
      expect(carousel.isReady()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should clean up properly', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const carousel = new WebGLCarousel({
        container,
        images: ['image.jpg'],
      });
      
      (carousel as any).isInitialized = true;
      const mockCore = (carousel as any).core;
      
      carousel.destroy();
      
      expect(mockCore.dispose).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(container.querySelector('canvas')).toBeNull();
      expect(carousel.isReady()).toBe(false);
      
      removeEventListenerSpy.mockRestore();
    });
  });
});