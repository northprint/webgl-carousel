// Main entry point for webgl-carousel
export const VERSION = '0.1.0';

// Main API
export { WebGLCarousel } from './WebGLCarousel';
export type { WebGLCarouselOptions, WebGLCarouselEvents } from './WebGLCarousel';

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
export type { SlideDirection, FlipAxis, WaveOptions, DistortionOptions, CustomEffectOptions } from './effects';
export type {
  CarouselState,
  LoadedImage,
  TransitionState,
  CarouselTransitionOptions,
} from './types';

// Export React adapter
export { WebGLCarouselReact } from './adapters/react/WebGLCarouselReact';
export type { WebGLCarouselReactProps } from './adapters/react/WebGLCarouselReact';

// Export Vue adapter
export { WebGLCarouselVue } from './adapters/vue/WebGLCarouselVue';
export type { WebGLCarouselVueProps } from './adapters/vue/WebGLCarouselVue';

// Export Svelte adapter reference
// Note: Svelte components cannot be directly exported in bundled JS
// Users should import the .svelte file directly from their Svelte projects

// Default export for convenience
import { WebGLCarousel as WGLCarousel } from './WebGLCarousel';
export default WGLCarousel;
