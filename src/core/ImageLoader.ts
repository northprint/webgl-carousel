export interface LoadedImage {
  url: string;
  element: HTMLImageElement;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ImageLoaderOptions {
  crossOrigin?: string;
  timeout?: number;
}

import { Logger } from '../utils/Logger';
import { ANIMATION_CONSTANTS } from '../constants/magic-numbers';
import type { IImageLoader } from '../interfaces/IImageLoader';

export class ImageLoader implements IImageLoader {
  private cache: Map<string, LoadedImage> = new Map();
  private loadingPromises: Map<string, Promise<LoadedImage>> = new Map();
  private options: ImageLoaderOptions;
  private logger = Logger.getInstance().createChild('ImageLoader');

  constructor(options: ImageLoaderOptions = {}) {
    this.options = {
      crossOrigin: 'anonymous',
      timeout: ANIMATION_CONSTANTS.IMAGE_LOAD_TIMEOUT,
      ...options,
    };
  }

  public async load(url: string): Promise<LoadedImage> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const loading = this.loadingPromises.get(url);
    if (loading) {
      return loading;
    }

    // Start new loading process
    const loadPromise = this.loadImage(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const loadedImage = await loadPromise;
      this.cache.set(url, loadedImage);
      this.loadingPromises.delete(url);
      return loadedImage;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  public async preload(urls: string[]): Promise<LoadedImage[]> {
    // Use Promise.all for preload to maintain compatibility
    return Promise.all(urls.map((url) => this.load(url)));
  }

  public async preloadWithProgress(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<LoadedImage[]> {
    const total = urls.length;
    let loaded = 0;
    const results: LoadedImage[] = [];

    // Load images sequentially to maintain progress order
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const image = await this.load(url!);
        results[i] = image;
        loaded++;
        onProgress?.(loaded, total);
      } catch (error) {
        // Create a placeholder image for failed loads
        this.logger.warn(`Failed to load image: ${url}`, error);

        const placeholderImage = await this.createPlaceholderImage(url!);
        results[i] = placeholderImage;
        loaded++;
        onProgress?.(loaded, total);
      }
    }

    return results;
  }

  private async createPlaceholderImage(url: string): Promise<LoadedImage> {
    // Create a 1x1 transparent image as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, 1, 1);
    }

    // Convert canvas to image element
    const img = new Image();
    img.src = canvas.toDataURL();

    // Wait for data URL to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    return {
      url,
      element: img,
      width: 1,
      height: 1,
      aspectRatio: 1,
    };
  }

  public getFromCache(url: string): LoadedImage | null {
    return this.cache.get(url) || null;
  }

  public clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      this.loadingPromises.delete(url);
    } else {
      this.cache.clear();
      this.loadingPromises.clear();
    }
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  private loadImage(url: string): Promise<LoadedImage> {
    this.logger.debug(`Starting to load image: ${url}`);

    const loadPromise = new Promise<LoadedImage>((resolve, reject) => {
      const img = new Image();

      const handleLoad = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        this.logger.debug(`Image loaded successfully: ${url} (${width}x${height})`);
        resolve({
          url,
          element: img,
          width,
          height,
          aspectRatio: width / height,
        });
      };

      const handleError = (event?: Event | string) => {
        const errorMessage = typeof event === 'string' ? event : 'Network or CORS error';
        this.logger.error(`Failed to load image: ${url}`, new Error(errorMessage));
        reject(new Error(`Failed to load image: ${url}. ${errorMessage}`));
      };

      // Configure image
      // Set crossOrigin before src to ensure CORS headers are requested
      if (this.options.crossOrigin) {
        img.crossOrigin = this.options.crossOrigin;
        this.logger.debug(`Setting crossOrigin to: ${this.options.crossOrigin}`);
      }

      // Add timeout if configured
      let timeoutId: NodeJS.Timeout | null = null;
      if (this.options.timeout && this.options.timeout > 0) {
        timeoutId = setTimeout(() => {
          handleError('Timeout');
        }, this.options.timeout);
      }

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      img.onload = () => {
        cleanup();
        handleLoad();
      };
      img.onerror = () => {
        cleanup();
        handleError('Network or CORS error');
      };
      img.src = url;
    });

    // Return promise directly - timeout is handled inside
    return loadPromise;
  }

  /**
   * Preload images in batches
   */
  public async preloadBatch(
    urls: string[],
    batchSize: number = 5,
    onBatchComplete?: (batchIndex: number, totalBatches: number) => void,
  ): Promise<LoadedImage[]> {
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    const results: LoadedImage[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await this.preload(batches[i]!);
      results.push(...batchResults);
      onBatchComplete?.(i + 1, batches.length);
    }

    return results;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearCache();
  }
}
