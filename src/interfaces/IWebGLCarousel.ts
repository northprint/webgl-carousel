/**
 * Public interface for WebGLCarousel
 * Defines the public API surface
 */

import type { IEffect } from '../core/EffectManager';

/**
 * Core navigation methods
 */
export interface ICarouselNavigation {
  /**
   * Navigate to the next image
   */
  next(): void;

  /**
   * Navigate to the previous image
   */
  previous(): void;

  /**
   * Navigate to a specific image by index
   */
  goTo(index: number): void;

  /**
   * Get the current image index
   */
  getCurrentIndex(): number;

  /**
   * Get the total number of images
   */
  getImageCount(): number;
}

/**
 * Playback control methods
 */
export interface ICarouselPlayback {
  /**
   * Start autoplay
   */
  play(): void;

  /**
   * Pause autoplay
   */
  pause(): void;

  /**
   * Set autoplay state and interval
   */
  setAutoplay(enabled: boolean, interval?: number): void;
}

/**
 * Effect management methods
 */
export interface ICarouselEffects {
  /**
   * Set the transition effect
   */
  setEffect(effectName: string): void;

  /**
   * Get list of available effects
   */
  getAvailableEffects(): string[];

  /**
   * Register a custom effect
   */
  registerEffect(effect: IEffect): void;

  /**
   * Set transition duration in milliseconds
   */
  setTransitionDuration(duration: number): void;
}

/**
 * State and lifecycle methods
 */
export interface ICarouselLifecycle {
  /**
   * Check if carousel is ready
   */
  isReady(): boolean;

  /**
   * Check if using WebGL renderer
   */
  isUsingWebGL(): boolean;

  /**
   * Destroy the carousel and clean up resources
   */
  destroy(): void;
}

/**
 * Image management methods
 */
export interface ICarouselImages {
  /**
   * Update carousel images
   */
  updateImages(images: string[]): Promise<void>;

  /**
   * Get current images
   */
  getImages(): string[];
}

/**
 * Complete public interface for WebGLCarousel
 */
export interface IWebGLCarousel
  extends ICarouselNavigation,
    ICarouselPlayback,
    ICarouselEffects,
    ICarouselLifecycle,
    ICarouselImages {}
