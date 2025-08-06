import { CarouselCore } from './core/CarouselCore';
import { UIController } from './ui/UIController';
import { getDefaultOptions, VALIDATION_RULES } from './constants/defaults';
import { DIMENSION_CONSTANTS } from './constants/magic-numbers';
import { Logger, ContextLogger } from './utils/Logger';
import {
  ErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  ContextErrorHandler,
} from './utils/ErrorHandler';
import { EventEmitter } from './core/EventEmitter';
import type { IEffect } from './core/EffectManager';
import { EventManager } from './utils/EventManager';
import { ResizeObserverManager } from './utils/ResizeObserverManager';
import { PromiseUtils } from './utils/PromiseUtils';
import type { IWebGLCarousel } from './interfaces/IWebGLCarousel';

import type { WebGLCarouselOptions, WebGLCarouselEvents } from './types';

export type { WebGLCarouselOptions, WebGLCarouselEvents };

export class WebGLCarousel extends EventEmitter<WebGLCarouselEvents> implements IWebGLCarousel {
  private core: CarouselCore;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private options: Required<WebGLCarouselOptions>;
  private isInitialized = false;
  private images: string[];
  private uiController?: UIController;
  private logger: ContextLogger;
  private errorHandler: ContextErrorHandler;
  private eventManager: EventManager;
  private resizeObserver: ResizeObserverManager;

  constructor(options: WebGLCarouselOptions) {
    super();

    this.logger = Logger.getInstance().createChild('WebGLCarousel');
    this.errorHandler = ErrorHandler.getInstance().createContextHandler('WebGLCarousel');
    this.eventManager = new EventManager();
    this.resizeObserver = new ResizeObserverManager();

    this.options = this.validateOptions(options);
    this.images = this.options.images;

    this.container = this.getContainer(this.options.container);

    this.canvas = this.createCanvas();

    this.core = this.createCore();

    void this.initialize();
  }

  private validateOptions(options: WebGLCarouselOptions): Required<WebGLCarouselOptions> {
    if (!options.container) {
      throw new Error('Container is required');
    }

    if (!options.images || options.images.length < VALIDATION_RULES.MIN_IMAGES) {
      throw new Error(`At least ${VALIDATION_RULES.MIN_IMAGES} image is required`);
    }

    // Validate numeric values if provided
    if (
      options.autoplayInterval !== undefined &&
      options.autoplayInterval < VALIDATION_RULES.MIN_AUTOPLAY_INTERVAL
    ) {
      throw new Error(
        `Autoplay interval must be at least ${VALIDATION_RULES.MIN_AUTOPLAY_INTERVAL}ms`,
      );
    }

    if (options.transitionDuration !== undefined) {
      if (options.transitionDuration < VALIDATION_RULES.MIN_TRANSITION_DURATION) {
        throw new Error(
          `Transition duration must be at least ${VALIDATION_RULES.MIN_TRANSITION_DURATION}ms`,
        );
      }
      if (options.transitionDuration > VALIDATION_RULES.MAX_TRANSITION_DURATION) {
        throw new Error(
          `Transition duration must be at most ${VALIDATION_RULES.MAX_TRANSITION_DURATION}ms`,
        );
      }
    }

    if (options.startIndex !== undefined) {
      if (options.startIndex < 0 || options.startIndex >= options.images.length) {
        throw new Error(`Start index must be between 0 and ${options.images.length - 1}`);
      }
    }

    return getDefaultOptions(options);
  }

  private getContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container element not found: ${container}`);
      }
      return element as HTMLElement;
    }
    return container;
  }

  private createCanvas(): HTMLCanvasElement {
    const containerPosition = window.getComputedStyle(this.container).position;
    if (containerPosition === 'static') {
      this.container.style.position = 'relative';
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = DIMENSION_CONSTANTS.FULL_WIDTH;
    canvas.style.height = DIMENSION_CONSTANTS.FULL_HEIGHT;
    canvas.style.display = 'block';
    this.container.appendChild(canvas);

    return canvas;
  }

  private resizeCanvas(): void {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  private createCore(): CarouselCore {
    return new CarouselCore({
      canvas: this.canvas,
      images: this.options.images,
      effect: this.options.effect || 'fade',
      autoplay: this.options.autoplay,
      autoplayInterval: this.options.autoplayInterval,
      transitionDuration: this.options.transitionDuration,
      loop: this.options.loop,
      fallbackToCanvas: this.options.fallbackToCanvas2D,
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Setup initial canvas size
      this.resizeCanvas();

      // Setup event listeners before core initialization
      this.setupEventListeners();

      // Initialize core with timeout
      await PromiseUtils.withTimeout(
        this.core.initialize(),
        30000, // 30 second timeout
        { message: 'Core initialization timed out' },
      );

      // Register effects
      await this.registerEffects();

      // Configure autoplay if enabled
      if (this.options.autoplay) {
        this.core.setAutoplay(true, this.options.autoplayInterval);
      }

      // Set transition duration
      this.core.setTransitionDuration(this.options.transitionDuration);

      // Setup UI controller
      this.setupUIController();

      // Final resize to ensure proper dimensions
      this.resizeCanvas();

      // Setup resize observer with debouncing
      this.setupResizeObserver();

      this.isInitialized = true;
      this.emit('ready');
    } catch (error) {
      await this.handleError(error as Error);
      throw error; // Re-throw for consumer to handle
    }
  }

  private async registerEffects(): Promise<void> {
    // Register custom effect if provided
    if (typeof this.options.effect === 'object') {
      this.registerEffect(this.options.effect);
      this.setEffect(this.options.effect.name);
    } else {
      this.setEffect(this.options.effect);
    }

    // Register additional effects if provided
    if (this.options.effects) {
      // Register effects in parallel for better performance
      await Promise.all(
        this.options.effects.map((effect) => {
          return Promise.resolve(this.registerEffect(effect));
        }),
      );
    }
  }

  private setupResizeObserver(): void {
    const debouncedResize = this.eventManager.debounce(() => {
      this.handleResize();
    }, 100);

    // Try to use ResizeObserver, fallback to window resize if not available
    const cleanup = this.resizeObserver.observe(this.container, debouncedResize);

    // If ResizeObserver is not available, use window resize as fallback
    if (!cleanup || typeof cleanup !== 'function') {
      this.eventManager.addEventListener(window, 'resize', debouncedResize);
    }
  }

  private setupUIController(): void {
    this.uiController = new UIController({
      container: this.container,
      imageCount: this.images.length,
      navigation: this.options.navigation,
      pagination: this.options.pagination,
      startIndex: this.options.startIndex,
    });

    this.uiController.on('navigationClick', (direction) => {
      if (direction === 'prev') {
        this.previous();
      } else {
        this.next();
      }
    });

    this.uiController.on('paginationClick', (index) => {
      this.goTo(index);
    });
  }

  private setupEventListeners(): void {
    // Setup core event listeners
    this.core.on('imageChange', (...args: unknown[]) => {
      const index = args[0] as number;
      this.emit('imageChange', index);
      this.options.onImageChange?.(index);
      this.uiController?.updatePagination(index);
    });

    this.core.on('transitionStart', (from: number, to: number) => {
      this.emit('transitionStart', from, to);
      this.options.onTransitionStart?.(from, to);
    });

    this.core.on('transitionEnd', (index: number) => {
      this.emit('transitionEnd', index);
      this.options.onTransitionEnd?.(index);
    });

    this.core.on('error', (error) => {
      this.handleError(error);
    });

    this.core.on('ready', () => {});
  }

  private async handleError(error: Error): Promise<void> {
    this.emit('error', error);
    this.options.onError?.(error);

    // Use error handler for proper logging and potential recovery
    await this.errorHandler.handleError(error, ErrorCategory.UNKNOWN, ErrorSeverity.HIGH, {
      component: 'WebGLCarousel',
      isInitialized: this.isInitialized,
    });
  }

  private handleResize = (): void => {
    this.resizeCanvas();
    this.core.resize(this.canvas.width, this.canvas.height);
  };

  public next(): void {
    if (!this.isInitialized) return;
    this.core.next();
  }

  public previous(): void {
    if (!this.isInitialized) return;
    this.core.previous();
  }

  public goTo(index: number): void {
    if (!this.isInitialized) return;
    this.core.goTo(index);
  }

  public setEffect(effectName: string): void {
    if (!this.isInitialized) return;

    const success = this.core.setEffect(effectName);
    if (success) {
      this.emit('effectChange', effectName);
    }
  }

  public getAvailableEffects(): string[] {
    return [
      'fade',
      'slideLeft',
      'slideRight',
      'slideUp',
      'slideDown',
      'flipHorizontal',
      'flipVertical',
      'wave',
      'distortion',
      'dissolve',
      'pixelDissolve',
      'circle',
      'morph',
      'glitch',
      'pageFlip',
    ];
  }

  public registerEffect(effect: IEffect): void {
    if (!this.isInitialized) return;
    this.core.registerEffect(effect);
  }

  public play(): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(true, this.options.autoplayInterval);
  }

  public pause(): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(false);
  }

  public setAutoplay(enabled: boolean, interval?: number): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(enabled, interval);
  }

  public setTransitionDuration(duration: number): void {
    if (!this.isInitialized) return;
    this.core.setTransitionDuration(duration);
  }

  public getCurrentIndex(): number {
    return this.core.getCurrentIndex();
  }

  public getImageCount(): number {
    return this.images.length;
  }

  public destroy(): void {
    if (!this.isInitialized) return;

    // Clean up all event listeners and resources
    this.eventManager.destroy();
    this.resizeObserver.destroy();

    this.uiController?.destroy();

    this.core.dispose();

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.container.style.position = '';

    this.isInitialized = false;
    this.removeAllListeners();
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public isUsingWebGL(): boolean {
    return this.core.isUsingWebGL();
  }

  public async updateImages(images: string[]): Promise<void> {
    if (!this.isInitialized) return;

    this.options.images = images;
    this.images = images;

    // Update UI controller
    this.uiController?.updateImageCount(images.length);

    // Reload images in core if needed
    // This would require implementing updateImages in CarouselCore
  }

  public getImages(): string[] {
    return this.options.images;
  }
}
