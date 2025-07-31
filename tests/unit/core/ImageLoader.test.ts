import { ImageLoader } from '../../../src/core/ImageLoader';

// Mock Image behavior in tests
const mockImageLoad = (shouldSucceed = true, delay = 0) => {
  const originalImage = global.Image;

  global.Image = jest.fn().mockImplementation(function (this: HTMLImageElement) {
    this.naturalWidth = 100;
    this.naturalHeight = 100;
    this.width = 100;
    this.height = 100;

    Object.defineProperty(this, 'src', {
      set: () => {
        setTimeout(() => {
          if (shouldSucceed && this.onload) {
            this.onload(new Event('load'));
          } else if (!shouldSucceed && this.onerror) {
            this.onerror(new Event('error'));
          }
        }, delay);
      }
    });

    return this;
  }) as any;

  return () => {
    global.Image = originalImage;
  };
};

describe('ImageLoader', () => {
  let imageLoader: ImageLoader;

  beforeEach(() => {
    imageLoader = new ImageLoader();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load an image successfully', async () => {
      const restore = mockImageLoad(true);

      const result = await imageLoader.load('test.jpg');

      expect(result).toEqual({
        url: 'test.jpg',
        element: expect.any(Image),
        width: 100,
        height: 100,
        aspectRatio: 1,
      });

      restore();
    });

    it('should return cached image on second load', async () => {
      const restore = mockImageLoad(true);

      const result1 = await imageLoader.load('test.jpg');
      const result2 = await imageLoader.load('test.jpg');

      expect(result1).toBe(result2);
      expect(Image).toHaveBeenCalledTimes(1);

      restore();
    });

    it('should handle concurrent loads of same image', async () => {
      const restore = mockImageLoad(true, 10);

      const promise1 = imageLoader.load('test.jpg');
      const promise2 = imageLoader.load('test.jpg');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(result2);
      expect(Image).toHaveBeenCalledTimes(1);

      restore();
    });

    it('should handle load errors', async () => {
      const restore = mockImageLoad(false);

      await expect(imageLoader.load('error.jpg')).rejects.toThrow(
        'Failed to load image: error.jpg',
      );

      restore();
    });

    it('should handle timeout', async () => {
      const loader = new ImageLoader({ timeout: 50 });
      const restore = mockImageLoad(true, 100);

      await expect(loader.load('slow.jpg')).rejects.toThrow(
        'Failed to load image: slow.jpg. Timeout',
      );

      restore();
    });

    it('should set crossOrigin attribute', async () => {
      const loader = new ImageLoader({ crossOrigin: 'use-credentials' });
      const restore = mockImageLoad(true);

      let createdImage: any;
      global.Image = jest.fn().mockImplementation(function (this: HTMLImageElement) {
        createdImage = this;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        setTimeout(() => {
          if (this.onload) this.onload(new Event('load'));
        }, 0);
        return this;
      }) as any;

      await loader.load('test.jpg');

      expect(createdImage.crossOrigin).toBe('use-credentials');

      restore();
    });
  });

  describe('preload', () => {
    it('should preload multiple images', async () => {
      const restore = mockImageLoad(true);

      const urls = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const results = await imageLoader.preload(urls);

      expect(results).toHaveLength(3);
      expect(results[0]?.url).toBe('img1.jpg');
      expect(results[1]?.url).toBe('img2.jpg');
      expect(results[2]?.url).toBe('img3.jpg');

      restore();
    });

    it('should reject if any image fails in preload', async () => {
      let callCount = 0;
      const originalImage = global.Image;
      global.Image = jest.fn().mockImplementation(function (this: HTMLImageElement) {
        const currentCount = ++callCount;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        
        Object.defineProperty(this, 'src', {
          set: () => {
            setTimeout(() => {
              if (currentCount === 2 && this.onerror) {
                this.onerror(new Event('error'));
              } else if (this.onload) {
                this.onload(new Event('load'));
              }
            }, 0);
          }
        });
        
        return this;
      }) as any;

      const urls = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

      await expect(imageLoader.preload(urls)).rejects.toThrow();
      
      global.Image = originalImage;
    });
  });

  describe('preloadWithProgress', () => {
    it('should preload with progress callback', async () => {
      const restore = mockImageLoad(true);
      const progressCallback = jest.fn();

      const urls = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const results = await imageLoader.preloadWithProgress(urls, progressCallback);

      expect(results).toHaveLength(3);
      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3);

      restore();
    });

    it('should continue loading if some images fail', async () => {
      let callCount = 0;
      const originalImage = global.Image;
      global.Image = jest.fn().mockImplementation(function (this: HTMLImageElement) {
        const currentCount = ++callCount;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        
        Object.defineProperty(this, 'src', {
          set: () => {
            setTimeout(() => {
              if (currentCount === 2 && this.onerror) {
                this.onerror(new Event('error'));
              } else if (this.onload) {
                this.onload(new Event('load'));
              }
            }, 0);
          }
        });
        
        return this;
      }) as any;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const progressCallback = jest.fn();

      const urls = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const results = await imageLoader.preloadWithProgress(urls, progressCallback);

      expect(results).toHaveLength(3); // All images are returned (even if some failed)
      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load image: img2.jpg',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
      global.Image = originalImage;
    });
  });

  describe('cache management', () => {
    it('should get image from cache', async () => {
      const restore = mockImageLoad(true);

      await imageLoader.load('test.jpg');
      const cached = imageLoader.getFromCache('test.jpg');

      expect(cached).not.toBeNull();
      expect(cached?.url).toBe('test.jpg');

      restore();
    });

    it('should return null for non-cached image', () => {
      const cached = imageLoader.getFromCache('not-loaded.jpg');
      expect(cached).toBeNull();
    });

    it('should clear specific cache entry', async () => {
      const restore = mockImageLoad(true);

      await imageLoader.load('test.jpg');
      imageLoader.clearCache('test.jpg');

      expect(imageLoader.getFromCache('test.jpg')).toBeNull();

      restore();
    });

    it('should clear all cache', async () => {
      const restore = mockImageLoad(true);

      await imageLoader.preload(['img1.jpg', 'img2.jpg']);
      expect(imageLoader.getCacheSize()).toBe(2);

      imageLoader.clearCache();
      expect(imageLoader.getCacheSize()).toBe(0);

      restore();
    });

    it('should report cache size', async () => {
      const restore = mockImageLoad(true);

      expect(imageLoader.getCacheSize()).toBe(0);

      await imageLoader.load('test.jpg');
      expect(imageLoader.getCacheSize()).toBe(1);

      await imageLoader.load('test2.jpg');
      expect(imageLoader.getCacheSize()).toBe(2);

      restore();
    });
  });
});