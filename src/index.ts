/**
 * WebGL Carousel - Main entry point
 * A high-performance image carousel with WebGL transitions
 */

export const VERSION = '0.2.5';

// Main API
export { WebGLCarousel } from './WebGLCarousel';
export type { WebGLCarouselOptions, WebGLCarouselEvents } from './WebGLCarousel';

// Public interfaces
export type {
  IWebGLCarousel,
  ICarouselNavigation,
  ICarouselPlayback,
  ICarouselEffects,
  ICarouselLifecycle,
  ICarouselImages,
} from './interfaces';

// Core exports for advanced usage
export { EventEmitter } from './core/EventEmitter';
export { StateManager } from './core/StateManager';
export { ImageLoader } from './core/ImageLoader';
export { WebGLRenderer } from './core/WebGLRenderer';
export { Canvas2DFallback } from './core/Canvas2DFallback';
export { EffectManager, createEffectManager } from './core/EffectManager';
export { CarouselCore } from './core/CarouselCore';

// Effect exports
export {
  BaseEffect,
  FadeEffect,
  SlideEffect,
  FlipEffect,
  WaveEffect,
  DistortionEffect,
  DissolveEffect,
  CircleEffect,
  // Preset instances
  fadeEffect,
  slideLeftEffect,
  slideRightEffect,
  slideUpEffect,
  slideDownEffect,
  flipHorizontalEffect,
  flipVerticalEffect,
  waveEffect,
  gentleWaveEffect,
  intenseWaveEffect,
  distortionEffect,
  subtleDistortionEffect,
  extremeDistortionEffect,
  dissolveEffect,
  pixelDissolveEffect,
  smoothDissolveEffect,
  circleEffect,
  circleFromCenterEffect,
  circleFromCornerEffect,
  // Utilities
  getDefaultEffects,
  registerDefaultEffects,
  createFragmentShader,
  commonShaderFunctions,
  // Custom effect utilities
  CustomEffect,
  createCustomEffect,
  createCustomEffectFromFiles,
} from './effects';

// Type exports
export type { IEffect } from './core/EffectManager';
export type {
  SlideDirection,
  FlipAxis,
  WaveOptions,
  DistortionOptions,
  CustomEffectOptions,
} from './effects';
export type {
  CarouselState,
  LoadedImage,
  TransitionState,
  CarouselTransitionOptions,
} from './types';

// Export constants for reference
export {
  ANIMATION_CONSTANTS,
  DIMENSION_CONSTANTS,
  WEBGL_CONSTANTS,
  MATH_CONSTANTS,
  UI_CONSTANTS,
  EFFECT_CONSTANTS,
  NETWORK_CONSTANTS,
  TEST_CONSTANTS,
  VALIDATION_CONSTANTS,
} from './constants/magic-numbers';

// Export utility classes for advanced users
export { Logger, LogLevel } from './utils/Logger';
export { ErrorHandler, ErrorCategory, ErrorSeverity, CarouselError } from './utils/ErrorHandler';
export { EventManager } from './utils/EventManager';
export { ResizeObserverManager } from './utils/ResizeObserverManager';
export { PromiseUtils } from './utils/PromiseUtils';
export { AsyncQueue } from './utils/AsyncQueue';

// Export React adapter
export { WebGLCarouselReact } from './adapters/react/WebGLCarouselReact';
export type { WebGLCarouselReactProps } from './adapters/react/WebGLCarouselReact';

// Export Vue adapter
export { WebGLCarouselVue } from './adapters/vue/WebGLCarouselVue';
export type { WebGLCarouselVueProps } from './adapters/vue/WebGLCarouselVue';

// Export Svelte adapter
export { default as WebGLCarouselSvelte } from './adapters/svelte/WebGLCarouselSvelte.svelte';

// Default export for convenience
import { WebGLCarousel as WGLCarousel } from './WebGLCarousel';
export default WGLCarousel;
