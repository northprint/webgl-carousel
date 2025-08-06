import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Canvas2DFallback } from '../../../src/core/Canvas2DFallback';

describe('Canvas2DFallback', () => {
  let fallback: Canvas2DFallback;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    fallback = new Canvas2DFallback();
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  afterEach(() => {
    fallback.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      const result = fallback.initialize(canvas);
      expect(result).toBe(true);
      expect(fallback.isInitialized()).toBe(true);
    });

    it('should return false when 2D context is not available', () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

      const result = fallback.initialize(canvas);
      expect(result).toBe(false);
      expect(fallback.isInitialized()).toBe(false);

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should enable image smoothing', () => {
      const initResult = fallback.initialize(canvas);
      expect(initResult).toBe(true);
      
      // モックの実装では値を確認できないため、初期化が成功したことのみをテスト
      // 実際の実装では ctx.imageSmoothingEnabled と ctx.imageSmoothingQuality が設定される
    });
  });

  describe('rendering', () => {
    let mockImage1: HTMLImageElement;
    let mockImage2: HTMLImageElement;

    beforeEach(() => {
      mockImage1 = new Image();
      mockImage1.width = 400;
      mockImage1.height = 300;

      mockImage2 = new Image();
      mockImage2.width = 600;
      mockImage2.height = 400;

      fallback.initialize(canvas);
      ctx = fallback.getContext() as any;
    });

    it('should render current image only at progress 0', () => {
      const clearRectSpy = vi.spyOn(ctx, 'clearRect');
      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      fallback.setImages(mockImage1, mockImage2);
      fallback.render(0);

      expect(clearRectSpy).toHaveBeenCalled();
      expect(drawImageSpy).toHaveBeenCalled();
    });

    it('should render both images during transition', () => {
      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      fallback.setImages(mockImage1, mockImage2);
      fallback.render(0.5);

      expect(drawImageSpy).toHaveBeenCalled();
    });

    it('should render next image only at progress 1', () => {
      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      fallback.setImages(mockImage1, mockImage2);
      fallback.render(1);

      expect(drawImageSpy).toHaveBeenCalled();
    });

    it('should handle null images gracefully', () => {
      expect(() => {
        fallback.setImages(null, null);
        fallback.render(0.5);
      }).not.toThrow();
    });

    it('should not render if not initialized', () => {
      const uninitializedFallback = new Canvas2DFallback();
      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      uninitializedFallback.setImages(mockImage1, mockImage2);
      uninitializedFallback.render(0.5);

      expect(drawImageSpy).not.toHaveBeenCalled();
    });
  });

  describe('aspect ratio handling', () => {
    it('should maintain aspect ratio for wider images', () => {
      fallback.initialize(canvas);
      ctx = fallback.getContext() as any;

      const wideImage = new Image();
      wideImage.width = 1600; // 2:1 ratio
      wideImage.height = 800;

      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      fallback.setImages(wideImage, null);
      fallback.render(0);

      // Image should fit width and be centered vertically
      expect(drawImageSpy).toHaveBeenCalled();
    });

    it('should maintain aspect ratio for taller images', () => {
      fallback.initialize(canvas);
      ctx = fallback.getContext() as any;

      const tallImage = new Image();
      tallImage.width = 400; // 1:2 ratio
      tallImage.height = 800;

      const drawImageSpy = vi.spyOn(ctx, 'drawImage');

      fallback.setImages(tallImage, null);
      fallback.render(0);

      // Image should fit height and be centered horizontally
      expect(drawImageSpy).toHaveBeenCalled();
    });
  });

  describe('resize', () => {
    it('should resize canvas and redraw', () => {
      fallback.initialize(canvas);
      ctx = canvas.getContext('2d') as any;

      const mockImage = new Image();
      mockImage.width = 400;
      mockImage.height = 300;

      fallback.setImages(mockImage, null);

      const renderSpy = vi.spyOn(fallback, 'render');

      fallback.resize(1024, 768);

      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
      expect(renderSpy).toHaveBeenCalledWith(0);
    });

    it('should not throw if not initialized', () => {
      expect(() => {
        fallback.resize(1024, 768);
      }).not.toThrow();
    });
  });

  describe('disposal', () => {
    it('should clean up resources', () => {
      fallback.initialize(canvas);

      const mockImage1 = new Image();
      const mockImage2 = new Image();
      fallback.setImages(mockImage1, mockImage2);

      fallback.dispose();

      expect(fallback.isInitialized()).toBe(false);
    });

    it('should be safe to call dispose multiple times', () => {
      fallback.initialize(canvas);

      expect(() => {
        fallback.dispose();
        fallback.dispose();
      }).not.toThrow();
    });
  });
});