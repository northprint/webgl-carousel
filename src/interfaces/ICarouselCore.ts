/**
 * Internal interface for CarouselCore
 * Defines internal API between components
 */

import type { IEffect } from '../core/EffectManager';
import type { LoadedImage } from '../core/ImageLoader';

/**
 * Core carousel operations
 */
export interface ICarouselCoreOperations {
  /**
   * Initialize the carousel core
   * @internal
   */
  initialize(): Promise<void>;

  /**
   * Navigate to next image
   * @internal
   */
  next(): void;

  /**
   * Navigate to previous image
   * @internal
   */
  previous(): void;

  /**
   * Navigate to specific image
   * @internal
   */
  goTo(index: number): void;

  /**
   * Get current image index
   * @internal
   */
  getCurrentIndex(): number;
}

/**
 * Core playback controls
 */
export interface ICarouselCorePlayback {
  /**
   * Start playback
   * @internal
   */
  play(): void;

  /**
   * Pause playback
   * @internal
   */
  pause(): void;

  /**
   * Set autoplay state
   * @internal
   */
  setAutoplay(enabled: boolean, interval?: number): void;

  /**
   * Set transition duration
   * @internal
   */
  setTransitionDuration(duration: number): void;
}

/**
 * Core effect management
 */
export interface ICarouselCoreEffects {
  /**
   * Set active effect
   * @internal
   */
  setEffect(effectName: string): boolean;

  /**
   * Register custom effect
   * @internal
   */
  registerEffect(effect: IEffect): void;
}

/**
 * Core state management
 */
export interface ICarouselCoreState {
  /**
   * Check if ready
   * @internal
   */
  isReady(): boolean;

  /**
   * Check if using WebGL
   * @internal
   */
  isUsingWebGL(): boolean;

  /**
   * Get loaded images
   * @internal
   */
  getImages(): LoadedImage[];

  /**
   * Handle resize
   * @internal
   */
  resize(width?: number, height?: number): void;

  /**
   * Dispose resources
   * @internal
   */
  dispose(): void;
}

/**
 * Complete internal interface for CarouselCore
 */
export interface ICarouselCore
  extends ICarouselCoreOperations,
    ICarouselCorePlayback,
    ICarouselCoreEffects,
    ICarouselCoreState {}
