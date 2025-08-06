import { EventEmitter } from './EventEmitter';
import { Logger } from '../utils/Logger';
import { StateManager } from './StateManager';
import { EventManager } from '../utils/EventManager';
import { ImageLoader, LoadedImage } from './ImageLoader';
import { WebGLRenderer } from './WebGLRenderer';
import { WebGL2Renderer } from './WebGL2Renderer';
import { Canvas2DFallback } from './Canvas2DFallback';
import { EffectManager, IEffect } from './EffectManager';
import { registerDefaultEffects } from '../effects';

import type { ICarouselCore } from '../interfaces/ICarouselCore';

export interface CarouselCoreOptions {
  canvas: HTMLCanvasElement;
  images: string[];
  effect?: string | IEffect;
  autoplay?: boolean;
  autoplayInterval?: number;
  transitionDuration?: number;
  loop?: boolean;
  fallbackToCanvas?: boolean;
  onTransitionStart?: (from: number, to: number) => void;
  onTransitionEnd?: (current: number) => void;
}

export interface CarouselCoreEvents extends Record<string, unknown[]> {
  ready: [];
  error: [Error];
  imageLoaded: [number, LoadedImage];
  allImagesLoaded: [LoadedImage[]];
  transitionStart: [number, number];
  transitionEnd: [number];
  play: [];
  pause: [];
}

export class CarouselCore extends EventEmitter<CarouselCoreEvents> implements ICarouselCore {
  private stateManager: StateManager;
  private imageLoader: ImageLoader;
  private renderer: WebGLRenderer | WebGL2Renderer | Canvas2DFallback | null = null;
  private effectManager: EffectManager;
  private canvas: HTMLCanvasElement;
  private options: CarouselCoreOptions;
  private loadedImages: Map<string, LoadedImage> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private animationId: number | null = null;
  private transitionStartTime: number | null = null;
  private autoplayTimer: NodeJS.Timeout | null = null;
  private isWebGL = false;
  private validImageIndices: number[] = []; // Track which image indices loaded successfully
  private eventManager: EventManager;

  constructor(options: CarouselCoreOptions) {
    super();
    this.options = options;
    this.canvas = options.canvas;

    // Initialize components
    const effectName =
      typeof options.effect === 'string' ? options.effect : options.effect?.name || 'fade';
    this.stateManager = new StateManager({
      images: options.images,
      currentIndex: 0,
      effect: effectName,
      autoplayInterval: options.autoplayInterval || 3000,
      transitionDuration: options.transitionDuration || 1000,
      loop: options.loop !== false,
      isPlaying: options.autoplay || false,
    });

    this.imageLoader = new ImageLoader({
      crossOrigin: 'anonymous', // Enable CORS for images
    });
    this.effectManager = new EffectManager();
    this.eventManager = new EventManager();

    // Register default effects
    registerDefaultEffects(this.effectManager);

    // Register custom effect if provided
    if (typeof options.effect === 'object' && options.effect) {
      this.effectManager.register(options.effect);
    }

    // Setup state event listeners
    this.setupStateListeners();

    // Setup callbacks
    if (options.onTransitionStart) {
      this.on('transitionStart', options.onTransitionStart);
    }
    if (options.onTransitionEnd) {
      this.on('transitionEnd', options.onTransitionEnd);
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize renderer
      const rendererInitialized = this.initializeRenderer();

      if (!rendererInitialized) {
        throw new Error('Failed to initialize renderer');
      }

      // Preload images
      await this.preloadImages();

      // Start autoplay if enabled
      if (this.stateManager.get('isPlaying')) {
        this.startAutoplay();
      }

      this.emit('ready');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  private initializeRenderer(): boolean {
    // Try WebGL 2.0 first (it's backwards compatible and supports more features)
    if (this.options.fallbackToCanvas !== false) {
      const webgl2Renderer = new WebGL2Renderer();
      if (webgl2Renderer.initialize(this.canvas)) {
        this.renderer = webgl2Renderer;
        this.isWebGL = true;

        // Setup WebGL 2.0 event listeners
        webgl2Renderer.on('error', (error) => this.emit('error', error));
        webgl2Renderer.on('contextLost', () => this.handleContextLost());
        webgl2Renderer.on('contextRestored', () => this.handleContextRestored());

        return true;
      }
      webgl2Renderer.dispose();
    }

    // Try WebGL 1.0 if WebGL 2.0 is not available
    if (this.options.fallbackToCanvas !== false) {
      const webglRenderer = new WebGLRenderer();
      if (webglRenderer.initialize(this.canvas)) {
        this.renderer = webglRenderer;
        this.isWebGL = true;

        // Setup WebGL event listeners
        webglRenderer.on('error', (error) => this.emit('error', error));
        webglRenderer.on('contextLost', () => this.handleContextLost());
        webglRenderer.on('contextRestored', () => this.handleContextRestored());

        return true;
      }
      webglRenderer.dispose();
    }

    // Fallback to Canvas2D
    const canvas2DFallback = new Canvas2DFallback();
    if (canvas2DFallback.initialize(this.canvas)) {
      this.renderer = canvas2DFallback;
      this.isWebGL = false;
      return true;
    }

    return false;
  }

  private setupStateListeners(): void {
    this.stateManager.on('transitionStart', (from, to) => {
      this.emit('transitionStart', from, to);
      this.startTransition(from, to);
    });

    this.stateManager.on('transitionEnd', (index) => {
      this.emit('transitionEnd', index);
    });

    this.stateManager.on('playStateChange', (isPlaying) => {
      if (isPlaying) {
        this.emit('play');
        this.startAutoplay();
      } else {
        this.emit('pause');
        this.stopAutoplay();
      }
    });

    this.stateManager.on('indexChange', (oldIndex, newIndex) => {
      this.emit('imageChange', newIndex);
    });
  }

  private async preloadImages(): Promise<void> {
    const images = this.stateManager.get('images');

    const loadedImages = await this.imageLoader.preloadWithProgress(images, (_loaded, _total) => {
      // Progress callback - no initial render here anymore
    });

    // Store all loaded images
    loadedImages.forEach((image, index) => {
      this.loadedImages.set(images[index]!, image);
      this.emit('imageLoaded', index, image);

      // Create WebGL texture if using WebGL
      if (
        this.isWebGL &&
        (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)
      ) {
        const texture = this.renderer.loadTexture(image.element);
        if (texture) {
          this.textures.set(images[index]!, texture);
        }
      }
    });

    this.emit('allImagesLoaded', loadedImages);

    // Ensure initial render happens after all images are loaded
    const currentIndex = this.stateManager.get('currentIndex');
    const currentImageUrl = images[currentIndex];
    if (currentImageUrl) {
      const currentImage = this.loadedImages.get(currentImageUrl);
      if (currentImage && !this.stateManager.get('isTransitioning')) {
        this.prepareInitialRender(currentImage, currentIndex);
      }
    }
  }

  private prepareInitialRender(image: LoadedImage, imageIndex?: number): void {
    if (
      this.isWebGL &&
      (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)
    ) {
      const images = this.stateManager.get('images');
      const index = imageIndex ?? this.stateManager.get('currentIndex');
      const imageSrc = images[index]!;

      // Load texture (this will also cache the image size)
      const texture = this.renderer.loadTexture(image.element);
      if (texture) {
        this.textures.set(imageSrc, texture);
      }

      if (texture) {
        // Get current effect and its uniforms
        const effectName = this.stateManager.get('effect');
        const effect = this.effectManager.get(effectName);
        // For initial render, use progress=0 to show the first image fully
        const uniforms = effect ? effect.getUniforms(0) : {};

        // Set the effect to renderer before initial render
        if (effect) {
          this.renderer.setEffect({
            vertexShader: effect.vertexShader,
            fragmentShader: effect.fragmentShader,
          });
        }

        // For initial render, pass the same image as both textures with progress=1 to show the image fully
        this.renderer.render(texture, texture, 1, uniforms, imageSrc, imageSrc);
      }
    } else if (this.renderer instanceof Canvas2DFallback) {
      this.renderer.setImages(image.element, null);
      this.renderer.render(0);
    }
  }

  private startTransition(from: number, to: number): void {
    // Execute transition directly
    this.executeTransition(from, to).catch((error) => {
      Logger.getInstance().createChild('CarouselCore').error('Transition failed', error);
      this.stateManager.endTransition(to);
      this.emit('error', error as Error);
    });
  }

  private async executeTransition(from: number, to: number): Promise<void> {
    const images = this.stateManager.get('images');
    const fromImage = this.loadedImages.get(images[from]!);
    const toImage = this.loadedImages.get(images[to]!);

    if (!fromImage || !toImage) {
      // Images not loaded yet, skip transition
      this.stateManager.endTransition(to);
      return;
    }

    this.transitionStartTime = performance.now();

    if (
      this.isWebGL &&
      (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)
    ) {
      const fromTexture = this.textures.get(images[from]!);
      const toTexture = this.textures.get(images[to]!);

      if (fromTexture && toTexture) {
        // Set effect if needed
        const effectName = this.stateManager.get('effect');
        let effect = this.effectManager.get(effectName);

        // If TrianglePeelV2, check if it's going to work
        if (effectName === 'trianglePeelV2' && effect) {
          try {
            // Check if effect requires custom mesh (WebGL 2.0)
            if (this.renderer instanceof WebGL2Renderer && effect.requiresCustomMesh) {
              const mesh = effect.getMesh?.();
              if (!mesh || !mesh.positions || !mesh.indices) {
                Logger.getInstance()
                  .createChild('CarouselCore')
                  .error('TrianglePeelV2 mesh is invalid, falling back to fade');
                effect = this.effectManager.get('fade');
                this.stateManager.set('effect', 'fade');
              } else {
                this.renderer.setMesh({
                  vertices: mesh.positions,
                  indices: mesh.indices,
                  texCoords: mesh.texCoords,
                  normals: mesh.normals,
                  instanceData: effect.getInstanceData?.()?.positions || undefined,
                });
              }
            }
          } catch (error) {
            Logger.getInstance()
              .createChild('CarouselCore')
              .error('Error setting up TrianglePeelV2', error as Error);
            effect = this.effectManager.get('fade');
            this.stateManager.set('effect', 'fade');
          }
        }

        if (effect) {
          this.renderer.setEffect({
            vertexShader: effect.vertexShader,
            fragmentShader: effect.fragmentShader,
          });
        }

        await this.animateTransition(fromTexture, toTexture, to);
      } else {
        Logger.getInstance().createChild('CarouselCore').error('Missing texture', {
          fromTexture: !!fromTexture,
          toTexture: !!toTexture,
        });
      }
    } else if (this.renderer instanceof Canvas2DFallback) {
      this.renderer.setImages(fromImage.element, toImage.element);
      await this.animateTransition(null, null, to);
    }
  }

  private animateTransition(
    fromTexture: WebGLTexture | null,
    toTexture: WebGLTexture | null,
    toIndex: number,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const animate = () => {
        if (!this.transitionStartTime) {
          return;
        }

        const elapsed = performance.now() - this.transitionStartTime;
        const duration = this.stateManager.get('transitionDuration');
        const progress = Math.min(elapsed / duration, 1);

        try {
          if (
            this.isWebGL &&
            (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer) &&
            fromTexture &&
            toTexture
          ) {
            const effect = this.effectManager.get(this.stateManager.get('effect'));
            const uniforms = effect ? effect.getUniforms(progress) : {};
            const images = this.stateManager.get('images');
            const currentIndex = this.stateManager.get('currentIndex');
            const fromSrc = images[currentIndex];
            const toSrc = images[toIndex];

            if (this.renderer instanceof WebGL2Renderer && effect?.getInstanceData) {
              const instanceData = effect.getInstanceData();
              const instanceCount = instanceData?.positions
                ? instanceData.positions.length / 12
                : undefined;
              // Only use instanced rendering if we actually have instance data
              if (instanceCount && instanceCount > 0) {
                this.renderer.render(
                  fromTexture,
                  toTexture,
                  progress,
                  uniforms,
                  fromSrc,
                  toSrc,
                  instanceCount,
                );
              } else {
                this.renderer.render(fromTexture, toTexture, progress, uniforms, fromSrc, toSrc);
              }
            } else {
              this.renderer.render(fromTexture, toTexture, progress, uniforms, fromSrc, toSrc);
            }
          } else if (this.renderer instanceof Canvas2DFallback) {
            this.renderer.render(progress);
          }
        } catch (error) {
          Logger.getInstance()
            .createChild('CarouselCore')
            .error('Error during render', error as Error);
          // End transition on error
          this.animationId = null;
          this.transitionStartTime = null;
          this.stateManager.endTransition(toIndex);
          resolve();
          return;
        }

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.animationId = null;
          this.transitionStartTime = null;
          this.stateManager.endTransition(toIndex);

          // Schedule next transition if autoplay
          if (this.stateManager.get('isPlaying')) {
            this.scheduleNextTransition();
          }

          resolve();
        }
      };

      animate();
    });
  }

  private handleContextLost(): void {
    // Cancel any ongoing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear textures
    this.textures.clear();
  }

  private handleContextRestored(): void {
    // Recreate textures
    if (
      this.isWebGL &&
      (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)
    ) {
      for (const [url, image] of this.loadedImages) {
        const texture = this.renderer.loadTexture(image.element);
        if (texture) {
          this.textures.set(url, texture);
        }
      }
    }

    // Redraw current image
    const currentIndex = this.stateManager.get('currentIndex');
    const images = this.stateManager.get('images');
    const currentImage = this.loadedImages.get(images[currentIndex]!);

    if (currentImage) {
      this.prepareInitialRender(currentImage);
    }
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.scheduleNextTransition();
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      this.eventManager.clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  private scheduleNextTransition(): void {
    if (!this.stateManager.get('isPlaying')) return;

    // Clear any existing timer to prevent duplicates
    this.stopAutoplay();

    const interval = this.stateManager.get('autoplayInterval');
    this.autoplayTimer = this.eventManager.setTimeout(() => {
      if (this.stateManager.get('isPlaying') && !this.stateManager.get('isTransitioning')) {
        this.next();
      }
    }, interval);
  }

  // Public API
  public next(): void {
    if (!this.stateManager.get('isTransitioning') && this.stateManager.canGoNext()) {
      const nextIndex = this.stateManager.getNextIndex();
      this.stateManager.startTransition(nextIndex);
    }
  }

  public previous(): void {
    if (!this.stateManager.get('isTransitioning') && this.stateManager.canGoPrevious()) {
      const prevIndex = this.stateManager.getPreviousIndex();
      this.stateManager.startTransition(prevIndex);
    }
  }

  public goTo(index: number): void {
    const images = this.stateManager.get('images');
    if (
      index >= 0 &&
      index < images.length &&
      index !== this.stateManager.get('currentIndex') &&
      !this.stateManager.get('isTransitioning')
    ) {
      this.stateManager.startTransition(index);
    }
  }

  public play(): void {
    this.stateManager.set('isPlaying', true);
  }

  public pause(): void {
    this.stateManager.set('isPlaying', false);
  }

  public setAutoplay(enabled: boolean, interval?: number): void {
    if (interval !== undefined) {
      this.stateManager.set('autoplayInterval', interval);
    }
    this.stateManager.set('isPlaying', enabled);
  }

  public setTransitionDuration(duration: number): void {
    this.stateManager.set('transitionDuration', duration);
  }

  public setEffect(effectName: string): boolean {
    if (this.effectManager.has(effectName)) {
      const effect = this.effectManager.get(effectName);

      // Check if effect requires WebGL 2.0
      if (effect && effect.requiresWebGL2) {
        if (!(this.renderer instanceof WebGL2Renderer)) {
          Logger.getInstance()
            .createChild('CarouselCore')
            .warn(
              `Effect "${effectName}" requires WebGL 2.0, but current renderer is ${this.renderer?.constructor.name}. Falling back to fade effect.`,
            );
          // Fallback to fade effect
          return this.setEffect('fade');
        }
      }

      this.stateManager.set('effect', effectName);

      // Update renderer with new effect
      if (
        this.isWebGL &&
        (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer) &&
        effect
      ) {
        this.renderer.setEffect({
          vertexShader: effect.vertexShader,
          fragmentShader: effect.fragmentShader,
        });

        // Re-render current image with new effect
        const currentIndex = this.stateManager.get('currentIndex');
        const images = this.stateManager.get('images');
        const currentImageSrc = images[currentIndex];

        if (currentImageSrc) {
          const texture = this.textures.get(currentImageSrc);
          if (texture) {
            this.renderer.render(texture, null, 0, effect.getUniforms(0), currentImageSrc);
          }
        }
      }

      return true;
    }
    return false;
  }

  public registerEffect(effect: IEffect): void {
    this.effectManager.register(effect);
  }

  public getCurrentIndex(): number {
    return this.stateManager.get('currentIndex');
  }

  public getImages(): LoadedImage[] {
    const urls = this.stateManager.get('images');
    return urls
      .map((url) => this.loadedImages.get(url))
      .filter((img): img is LoadedImage => img !== undefined);
  }

  public resize(width?: number, height?: number): void {
    if (!this.renderer) return;

    // Use provided dimensions or get from canvas
    const actualWidth = width ?? this.canvas.width;
    const actualHeight = height ?? this.canvas.height;

    this.renderer.resize(actualWidth, actualHeight);

    // Redraw current state
    const currentIndex = this.stateManager.get('currentIndex');
    const images = this.stateManager.get('images');
    const currentImageSrc = images[currentIndex];

    if (!currentImageSrc) return;

    const currentImage = this.loadedImages.get(currentImageSrc);
    if (!currentImage) return;

    // If transitioning, let the animation loop handle it
    if (this.stateManager.get('isTransitioning')) {
      return;
    }

    // Redraw the current image
    if (
      this.isWebGL &&
      (this.renderer instanceof WebGLRenderer || this.renderer instanceof WebGL2Renderer)
    ) {
      const texture = this.textures.get(currentImageSrc);
      if (texture) {
        // Get current effect and its uniforms
        const effectName = this.stateManager.get('effect');
        const effect = this.effectManager.get(effectName);
        // For single image render, use progress=1 to show the image fully
        const uniforms = effect ? effect.getUniforms(1) : {};

        // Render with the same texture for both slots and progress=1
        this.renderer.render(texture, texture, 1, uniforms, currentImageSrc, currentImageSrc);
      }
    } else if (this.renderer instanceof Canvas2DFallback) {
      this.renderer.setImages(currentImage.element, null);
      this.renderer.render(0);
    }
  }

  public dispose(): void {
    // Stop animations
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Stop autoplay
    this.stopAutoplay();

    // Clear transition queue

    // Clean up all event listeners and timers
    this.eventManager.destroy();

    // Clean up image loader
    if ('destroy' in this.imageLoader) {
      (this.imageLoader as unknown as { destroy: () => void }).destroy();
    }

    // Clean up renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Clear caches
    this.imageLoader.clearCache();
    this.loadedImages.clear();
    this.textures.clear();

    // Remove all listeners
    this.removeAllListeners();
    this.stateManager.removeAllListeners();
  }

  public isReady(): boolean {
    return this.renderer !== null && this.loadedImages.size > 0;
  }

  public isUsingWebGL(): boolean {
    return this.isWebGL;
  }
}
