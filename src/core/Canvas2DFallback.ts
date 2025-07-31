export interface Canvas2DFallbackOptions {
  transitionDuration?: number;
}

export class Canvas2DFallback {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentImage: HTMLImageElement | null = null;
  private nextImage: HTMLImageElement | null = null;
  private options: Canvas2DFallbackOptions;

  constructor(options: Canvas2DFallbackOptions = {}) {
    this.options = {
      transitionDuration: 1000,
      ...options,
    };
  }

  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      return false;
    }

    // Set image smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    return true;
  }

  setImages(current: HTMLImageElement | null, next: HTMLImageElement | null): void {
    this.currentImage = current;
    this.nextImage = next;
  }

  render(progress: number): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate dimensions to maintain aspect ratio
    const canvasRatio = this.canvas.width / this.canvas.height;

    if (this.currentImage && progress < 1) {
      const imageRatio = this.currentImage.width / this.currentImage.height;
      const { width, height, x, y } = this.calculateDimensions(
        this.canvas.width,
        this.canvas.height,
        imageRatio,
        canvasRatio,
      );

      // Draw current image with fade out effect
      this.ctx.save();
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.drawImage(this.currentImage, x, y, width, height);
      this.ctx.restore();
    }

    if (this.nextImage && progress > 0) {
      const imageRatio = this.nextImage.width / this.nextImage.height;
      const { width, height, x, y } = this.calculateDimensions(
        this.canvas.width,
        this.canvas.height,
        imageRatio,
        canvasRatio,
      );

      // Draw next image with fade in effect
      this.ctx.save();
      this.ctx.globalAlpha = progress;
      this.ctx.drawImage(this.nextImage, x, y, width, height);
      this.ctx.restore();
    }
  }

  private calculateDimensions(
    canvasWidth: number,
    canvasHeight: number,
    imageRatio: number,
    canvasRatio: number,
  ): { width: number; height: number; x: number; y: number } {
    let width: number;
    let height: number;
    let x = 0;
    let y = 0;

    if (imageRatio > canvasRatio) {
      // Image is wider than canvas
      width = canvasWidth;
      height = canvasWidth / imageRatio;
      y = (canvasHeight - height) / 2;
    } else {
      // Image is taller than canvas
      height = canvasHeight;
      width = canvasHeight * imageRatio;
      x = (canvasWidth - width) / 2;
    }

    return { width, height, x, y };
  }

  resize(width: number, height: number): void {
    if (!this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;

    // Redraw after resize
    this.render(0);
  }

  dispose(): void {
    this.canvas = null;
    this.ctx = null;
    this.currentImage = null;
    this.nextImage = null;
  }

  isInitialized(): boolean {
    return this.ctx !== null;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }
}
