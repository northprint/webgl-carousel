import { CarouselCore } from './core/CarouselCore';
import { EventEmitter } from './core/EventEmitter';
import type { IEffect } from './core/EffectManager';

import type { WebGLCarouselOptions, WebGLCarouselEvents } from './types';

export type { WebGLCarouselOptions, WebGLCarouselEvents };

export class WebGLCarousel extends EventEmitter<WebGLCarouselEvents> {
  private core: CarouselCore;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private options: Required<WebGLCarouselOptions>;
  private isInitialized = false;
  private images: string[];

  constructor(options: WebGLCarouselOptions) {
    super();

    // Validate and set options
    this.options = this.validateOptions(options);
    this.images = this.options.images;

    // Get container element
    this.container = this.getContainer(this.options.container);

    // Create canvas
    this.canvas = this.createCanvas();

    // Initialize core
    this.core = this.createCore();

    // Initialize
    void this.initialize();
  }

  private validateOptions(options: WebGLCarouselOptions): Required<WebGLCarouselOptions> {
    if (!options.container) {
      throw new Error('Container is required');
    }

    if (!options.images || options.images.length === 0) {
      throw new Error('At least one image is required');
    }

    return {
      container: options.container,
      images: options.images,
      effect: options.effect || 'fade',
      autoplay: options.autoplay ?? false,
      autoplayInterval: options.autoplayInterval ?? 3000,
      navigation: options.navigation ?? true,
      pagination: options.pagination ?? true,
      loop: options.loop ?? true,
      preload: options.preload ?? true,
      fallbackToCanvas2D: options.fallbackToCanvas2D ?? true,
      transitionDuration: options.transitionDuration ?? 1000,
      startIndex: options.startIndex ?? 0,
      onImageChange: options.onImageChange || (() => {}),
      onTransitionStart: options.onTransitionStart || (() => {}),
      onTransitionEnd: options.onTransitionEnd || (() => {}),
      onError: options.onError || (() => {}),
    };
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
    // Ensure container has position for absolute children
    const containerPosition = window.getComputedStyle(this.container).position;
    if (containerPosition === 'static') {
      this.container.style.position = 'relative';
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
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
      effect: this.options.effect,
      autoplay: this.options.autoplay,
      autoplayInterval: this.options.autoplayInterval,
      transitionDuration: this.options.transitionDuration,
      loop: this.options.loop,
      fallbackToCanvas: this.options.fallbackToCanvas2D,
      // Remove callbacks here to avoid duplicate events
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Resize canvas before initialization
      this.resizeCanvas();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize core
      await this.core.initialize();

      // Set initial effect
      this.setEffect(this.options.effect);

      // Set up autoplay
      if (this.options.autoplay) {
        this.core.setAutoplay(true, this.options.autoplayInterval);
      }

      // Set transition duration
      this.core.setTransitionDuration(this.options.transitionDuration);

      // Create UI controls
      if (this.options.navigation) {
        this.createNavigationControls();
      }

      if (this.options.pagination) {
        this.createPaginationControls();
        // Set initial active state
        this.updatePagination(this.options.startIndex || 0);
      }

      // Set initial canvas size
      this.resizeCanvas();

      // Handle window resize
      window.addEventListener('resize', this.handleResize);

      this.isInitialized = true;
      this.emit('ready');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupEventListeners(): void {
    // Forward core events
    this.core.on('imageChange', (...args: unknown[]) => {
      const index = args[0] as number;
      this.emit('imageChange', index);
      this.options.onImageChange?.(index);
      this.updatePagination(index);
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

  private handleError(error: Error): void {
    this.emit('error', error);
    this.options.onError?.(error);
    console.error('WebGLCarousel error:', error);
  }

  private handleResize = (): void => {
    this.resizeCanvas();
    this.core.resize(this.canvas.width, this.canvas.height);
  };

  private createNavigationControls(): void {
    const prevButton = document.createElement('button');
    prevButton.className = 'webgl-carousel-prev';
    prevButton.innerHTML = '&lsaquo;';
    prevButton.setAttribute('aria-label', 'Previous image');
    prevButton.addEventListener('click', () => this.previous());

    const nextButton = document.createElement('button');
    nextButton.className = 'webgl-carousel-next';
    nextButton.innerHTML = '&rsaquo;';
    nextButton.setAttribute('aria-label', 'Next image');
    nextButton.addEventListener('click', () => this.next());

    this.container.appendChild(prevButton);
    this.container.appendChild(nextButton);

    // Add default styles
    this.addNavigationStyles();
  }

  private createPaginationControls(): void {
    const pagination = document.createElement('div');
    pagination.className = 'webgl-carousel-pagination';

    const imageCount = this.options.images.length;
    for (let i = 0; i < imageCount; i++) {
      const dot = document.createElement('button');
      dot.className = 'webgl-carousel-dot';
      dot.setAttribute('aria-label', `Go to image ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));

      if (i === 0) {
        dot.classList.add('active');
      }

      pagination.appendChild(dot);
    }

    this.container.appendChild(pagination);

    // Add default styles
    this.addPaginationStyles();
  }

  private updatePagination(index: number): void {
    const dots = this.container.querySelectorAll('.webgl-carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  private addNavigationStyles(): void {
    if (document.getElementById('webgl-carousel-nav-styles')) return;

    const style = document.createElement('style');
    style.id = 'webgl-carousel-nav-styles';
    style.textContent = `
      .webgl-carousel-prev,
      .webgl-carousel-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 2rem;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background-color 0.3s;
        z-index: 10;
      }
      
      .webgl-carousel-prev:hover,
      .webgl-carousel-next:hover {
        background: rgba(0, 0, 0, 0.7);
      }
      
      .webgl-carousel-prev {
        left: 1rem;
      }
      
      .webgl-carousel-next {
        right: 1rem;
      }
    `;

    document.head.appendChild(style);
  }

  private addPaginationStyles(): void {
    if (document.getElementById('webgl-carousel-pagination-styles')) return;

    const style = document.createElement('style');
    style.id = 'webgl-carousel-pagination-styles';
    style.textContent = `
      .webgl-carousel-pagination {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
        z-index: 10;
      }
      
      .webgl-carousel-dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        border: 2px solid white;
        background: transparent;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .webgl-carousel-dot:hover {
        background: rgba(255, 255, 255, 0.5);
      }
      
      .webgl-carousel-dot.active {
        background: white;
      }
    `;

    document.head.appendChild(style);
  }

  // Public API methods

  next(): void {
    if (!this.isInitialized) return;
    this.core.next();
  }

  previous(): void {
    if (!this.isInitialized) return;
    this.core.previous();
  }

  goTo(index: number): void {
    if (!this.isInitialized) return;
    this.core.goTo(index);
  }

  setEffect(effectName: string): void {
    if (!this.isInitialized) return;

    const success = this.core.setEffect(effectName);
    if (success) {
      this.emit('effectChange', effectName);
    }
  }

  getAvailableEffects(): string[] {
    // Return list of available effects
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

  registerEffect(effect: IEffect): void {
    if (!this.isInitialized) return;
    this.core.registerEffect(effect);
  }

  play(): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(true, this.options.autoplayInterval);
  }

  pause(): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(false);
  }

  setAutoplay(enabled: boolean, interval?: number): void {
    if (!this.isInitialized) return;
    this.core.setAutoplay(enabled, interval);
  }

  setTransitionDuration(duration: number): void {
    if (!this.isInitialized) return;
    this.core.setTransitionDuration(duration);
  }

  getCurrentIndex(): number {
    return this.core.getCurrentIndex();
  }

  getImageCount(): number {
    // Return the actual number of successfully loaded images
    return this.images.length;
  }

  destroy(): void {
    if (!this.isInitialized) return;

    // Remove event listener
    window.removeEventListener('resize', this.handleResize);

    // Destroy core
    this.core.dispose();

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Remove controls
    const controls = this.container.querySelectorAll(
      '.webgl-carousel-prev, .webgl-carousel-next, .webgl-carousel-pagination',
    );
    controls.forEach((control) => control.remove());

    // Clear container styles if needed
    this.container.style.position = '';

    this.isInitialized = false;
    this.removeAllListeners();
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isUsingWebGL(): boolean {
    return this.core.isUsingWebGL();
  }

  updateImages(images: string[]): void {
    if (!this.isInitialized) return;
    this.options.images = images;
    // Note: This would need to be implemented in CarouselCore
    // For now, this is a placeholder
  }

  getImages(): string[] {
    return this.options.images;
  }
}
