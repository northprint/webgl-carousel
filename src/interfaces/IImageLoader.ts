/**
 * Internal interface for ImageLoader
 * Defines internal API for image loading operations
 */

import type { LoadedImage } from '../core/ImageLoader';

/**
 * Image loading operations
 */
export interface IImageLoader {
  /**
   * Load a single image
   * @internal
   */
  load(url: string): Promise<LoadedImage>;

  /**
   * Preload multiple images
   * @internal
   */
  preload(urls: string[]): Promise<LoadedImage[]>;

  /**
   * Preload images with progress callback
   * @internal
   */
  preloadWithProgress(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<LoadedImage[]>;

  /**
   * Preload images in batches
   * @internal
   */
  preloadBatch(
    urls: string[],
    batchSize?: number,
    onBatchComplete?: (batchIndex: number, totalBatches: number) => void,
  ): Promise<LoadedImage[]>;

  /**
   * Get image from cache
   * @internal
   */
  getFromCache(url: string): LoadedImage | null;

  /**
   * Clear cache
   * @internal
   */
  clearCache(url?: string): void;

  /**
   * Get cache size
   * @internal
   */
  getCacheSize(): number;

  /**
   * Destroy loader and clean up resources
   * @internal
   */
  destroy(): void;
}
