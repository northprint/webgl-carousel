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

export class ImageLoader {
  private cache: Map<string, LoadedImage> = new Map();
  private loadingPromises: Map<string, Promise<LoadedImage>> = new Map();
  private options: ImageLoaderOptions;

  constructor(options: ImageLoaderOptions = {}) {
    this.options = {
      crossOrigin: 'anonymous',
      timeout: 30000,
      ...options,
    };
  }

  async load(url: string): Promise<LoadedImage> {
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

  async preload(urls: string[]): Promise<LoadedImage[]> {
    return Promise.all(urls.map((url) => this.load(url)));
  }

  async preloadWithProgress(
    urls: string[],
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<LoadedImage[]> {
    const total = urls.length;
    let loaded = 0;
    const results: LoadedImage[] = [];

    for (const url of urls) {
      try {
        const image = await this.load(url);
        results.push(image);
        loaded++;
        onProgress?.(loaded, total);
      } catch (error) {
        // Create a placeholder image for failed loads
        console.warn(`Failed to load image: ${url}`, error);
        
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
        
        const placeholderImage: LoadedImage = {
          url: url,
          element: img,
          width: 1,
          height: 1,
          aspectRatio: 1,
        };
        
        results.push(placeholderImage);
        loaded++;
        onProgress?.(loaded, total);
      }
    }

    return results;
  }

  getFromCache(url: string): LoadedImage | null {
    return this.cache.get(url) || null;
  }

  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      this.loadingPromises.delete(url);
    } else {
      this.cache.clear();
      this.loadingPromises.clear();
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private loadImage(url: string): Promise<LoadedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        img.onload = null;
        img.onerror = null;
      };

      const handleLoad = () => {
        cleanup();
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        resolve({
          url,
          element: img,
          width,
          height,
          aspectRatio: width / height,
        });
      };

      const handleError = (error?: Event | string) => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}. ${error || ''}`));
      };

      // Set timeout
      if (this.options.timeout && this.options.timeout > 0) {
        timeoutId = setTimeout(() => {
          handleError('Timeout');
        }, this.options.timeout);
      }

      // Configure image
      // Set crossOrigin before src to ensure CORS headers are requested
      if (this.options.crossOrigin) {
        img.crossOrigin = this.options.crossOrigin;
      }
      
      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = url;
    });
  }
}
