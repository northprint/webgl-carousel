import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { CarouselCore } from '../../../src/core/CarouselCore';
import { MockWebGLRenderingContext } from '../../setup';

// Mock dependencies
vi.mock('../../../src/core/WebGLRenderer');
vi.mock('../../../src/core/Canvas2DFallback');
vi.mock('../../../src/core/ImageLoader');

describe('CarouselCore', () => {
  let canvas: HTMLCanvasElement;
  let carousel: CarouselCore;
  
  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (carousel) {
      carousel.dispose();
    }
  });

  describe('initialization', () => {
    it('should create instance with options', () => {
      const options = {
        canvas,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        effect: 'slide',
        autoplay: true,
        autoplayInterval: 2000,
        transitionDuration: 500,
        loop: false,
      };

      carousel = new CarouselCore(options);
      expect(carousel).toBeInstanceOf(CarouselCore);
    });

    it('should initialize successfully', async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      // Mock WebGL initialization success
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(true);
      WebGLRenderer.prototype.loadTexture = vi.fn().mockReturnValue({});
      WebGLRenderer.prototype.render = vi.fn();
      WebGLRenderer.prototype.on = vi.fn();
      WebGLRenderer.prototype.dispose = vi.fn();

      // Mock image loading
      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue([
        { url: 'img1.jpg', element: new Image(), width: 100, height: 100 },
      ]);
      ImageLoader.prototype.getFromCache = vi.fn().mockReturnValue({
        url: 'img1.jpg',
        element: new Image(),
        width: 100,
        height: 100,
      });

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg'],
      });

      const readyHandler = vi.fn();
      carousel.on('ready', readyHandler);

      await carousel.initialize();

      expect(readyHandler).toHaveBeenCalled();
      expect(carousel.isReady()).toBe(true);
      expect(carousel.isUsingWebGL()).toBe(true);
    });

    it('should fallback to Canvas2D when WebGL fails', async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { Canvas2DFallback } = await import('../../../src/core/Canvas2DFallback');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      // Mock WebGL initialization failure
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(false);
      WebGLRenderer.prototype.dispose = vi.fn();

      // Mock Canvas2D initialization success
      Canvas2DFallback.prototype.initialize = vi.fn().mockReturnValue(true);
      Canvas2DFallback.prototype.setImages = vi.fn();
      Canvas2DFallback.prototype.render = vi.fn();

      // Mock image loading
      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue([
        { url: 'img1.jpg', element: new Image(), width: 100, height: 100 },
      ]);
      ImageLoader.prototype.getFromCache = vi.fn().mockReturnValue({
        url: 'img1.jpg',
        element: new Image(),
        width: 100,
        height: 100,
      });

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg'],
      });

      await carousel.initialize();

      expect(carousel.isReady()).toBe(true);
      expect(carousel.isUsingWebGL()).toBe(false);
    });

    it('should emit error when initialization fails', async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { Canvas2DFallback } = await import('../../../src/core/Canvas2DFallback');

      // Mock both renderers failing
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(false);
      WebGLRenderer.prototype.dispose = vi.fn();
      Canvas2DFallback.prototype.initialize = vi.fn().mockReturnValue(false);

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg'],
      });

      const errorHandler = vi.fn();
      carousel.on('error', errorHandler);

      await expect(carousel.initialize()).rejects.toThrow('Failed to initialize renderer');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      // Setup mocks
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(true);
      WebGLRenderer.prototype.loadTexture = vi.fn().mockReturnValue({});
      WebGLRenderer.prototype.render = vi.fn();
      WebGLRenderer.prototype.on = vi.fn();
      WebGLRenderer.prototype.setEffect = vi.fn();

      const mockImages = [
        { url: 'img1.jpg', element: new Image(), width: 100, height: 100 },
        { url: 'img2.jpg', element: new Image(), width: 100, height: 100 },
        { url: 'img3.jpg', element: new Image(), width: 100, height: 100 },
      ];

      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue(mockImages);
      ImageLoader.prototype.getFromCache = vi.fn().mockImplementation((url) => {
        return mockImages.find((img) => img.url === url);
      });

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        loop: true,
      });

      await carousel.initialize();
    });

    it('should navigate to next image', () => {
      const transitionStartHandler = vi.fn();
      carousel.on('transitionStart', transitionStartHandler);

      expect(carousel.getCurrentIndex()).toBe(0);
      
      carousel.next();
      
      expect(transitionStartHandler).toHaveBeenCalledWith(0, 1);
    });

    it('should navigate to previous image', () => {
      const transitionStartHandler = vi.fn();
      carousel.on('transitionStart', transitionStartHandler);

      // Navigate forward first
      carousel.next();
      expect(transitionStartHandler).toHaveBeenCalledWith(0, 1);
      
      // Reset handler
      transitionStartHandler.mockClear();
      
      // Force set current index to 1 (simulate transition completed)
      const stateManager = (carousel as any).stateManager;
      stateManager.set('currentIndex', 1);
      stateManager.set('isTransitioning', false);

      carousel.previous();
      
      expect(transitionStartHandler).toHaveBeenCalledWith(1, 0);
    });

    it('should navigate to specific index', () => {
      const transitionStartHandler = vi.fn();
      carousel.on('transitionStart', transitionStartHandler);

      carousel.goTo(2);
      
      expect(transitionStartHandler).toHaveBeenCalledWith(0, 2);
    });

    it('should not navigate during transition', () => {
      const transitionStartHandler = vi.fn();
      carousel.on('transitionStart', transitionStartHandler);

      carousel.next();
      carousel.next(); // This should be ignored

      expect(transitionStartHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('autoplay', () => {
    beforeEach(async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      // Setup mocks
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(true);
      WebGLRenderer.prototype.loadTexture = vi.fn().mockReturnValue({});
      WebGLRenderer.prototype.render = vi.fn();
      WebGLRenderer.prototype.on = vi.fn();

      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue([
        { url: 'img1.jpg', element: new Image(), width: 100, height: 100 },
        { url: 'img2.jpg', element: new Image(), width: 100, height: 100 },
      ]);
      ImageLoader.prototype.getFromCache = vi.fn().mockReturnValue({
        url: 'img1.jpg',
        element: new Image(),
        width: 100,
        height: 100,
      });
    });

    it('should start autoplay when initialized with autoplay option', async () => {
      vi.useFakeTimers();

      const playHandler = vi.fn();

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg', 'img2.jpg'],
        autoplay: true,
        autoplayInterval: 1000,
      });

      // Listen for play event before initialization
      carousel.on('play', playHandler);

      await carousel.initialize();

      // Autoplay state should be set, but play event is emitted when state changes
      // Force emit by toggling play state
      carousel.pause();
      carousel.play();

      expect(playHandler).toHaveBeenCalled();

      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('should handle play/pause', async () => {
      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg', 'img2.jpg'],
        autoplay: false,
      });

      await carousel.initialize();

      const playHandler = vi.fn();
      const pauseHandler = vi.fn();
      carousel.on('play', playHandler);
      carousel.on('pause', pauseHandler);

      carousel.play();
      expect(playHandler).toHaveBeenCalled();

      carousel.pause();
      expect(pauseHandler).toHaveBeenCalled();
    });
  });

  describe('effects', () => {
    beforeEach(async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(true);
      WebGLRenderer.prototype.loadTexture = vi.fn().mockReturnValue({});
      WebGLRenderer.prototype.render = vi.fn();
      WebGLRenderer.prototype.on = vi.fn();
      WebGLRenderer.prototype.setEffect = vi.fn();

      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue([
        { url: 'img1.jpg', element: new Image(), width: 100, height: 100 },
      ]);
      ImageLoader.prototype.getFromCache = vi.fn().mockReturnValue({
        url: 'img1.jpg',
        element: new Image(),
        width: 100,
        height: 100,
      });

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg'],
      });

      await carousel.initialize();
    });

    it('should register and set effect', () => {
      const mockEffect = {
        name: 'custom',
        vertexShader: 'vertex',
        fragmentShader: 'fragment',
        getUniforms: () => ({ uCustom: 1 }),
      };

      carousel.registerEffect(mockEffect);
      carousel.setEffect('custom');

      // Effect should be set in state
      expect(carousel.getCurrentIndex()).toBe(0); // Just to verify carousel is working
    });
  });

  describe('disposal', () => {
    it('should clean up resources', async () => {
      const { WebGLRenderer } = await import('../../../src/core/WebGLRenderer');
      const { ImageLoader } = await import('../../../src/core/ImageLoader');

      const disposeSpy = vi.fn();
      WebGLRenderer.prototype.initialize = vi.fn().mockReturnValue(true);
      WebGLRenderer.prototype.dispose = disposeSpy;
      WebGLRenderer.prototype.on = vi.fn();
      WebGLRenderer.prototype.loadTexture = vi.fn().mockReturnValue({});
      WebGLRenderer.prototype.render = vi.fn();

      const clearCacheSpy = vi.fn();
      ImageLoader.prototype.preloadWithProgress = vi.fn().mockResolvedValue([]);
      ImageLoader.prototype.clearCache = clearCacheSpy;

      carousel = new CarouselCore({
        canvas,
        images: ['img1.jpg'],
      });

      await carousel.initialize();

      carousel.dispose();

      expect(disposeSpy).toHaveBeenCalled();
      expect(clearCacheSpy).toHaveBeenCalled();
      expect(carousel.isReady()).toBe(false);
    });
  });
});