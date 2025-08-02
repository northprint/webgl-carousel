// UMD build entry point - exports everything to global WebGLCarousel namespace
import { WebGLCarousel } from './WebGLCarousel';
import type { WebGLCarouselOptions } from './WebGLCarousel';
import { createCustomEffect, createCustomEffectFromFiles } from './effects';

// Extend WebGLCarousel with static methods
interface WebGLCarouselConstructor {
  new (options: WebGLCarouselOptions): WebGLCarousel;
  createCustomEffect: typeof createCustomEffect;
  createCustomEffectFromFiles: typeof createCustomEffectFromFiles;
}

// Attach commonly used functions to the class for convenience
const WebGLCarouselWithMethods = WebGLCarousel as unknown as WebGLCarouselConstructor;
WebGLCarouselWithMethods.createCustomEffect = createCustomEffect;
WebGLCarouselWithMethods.createCustomEffectFromFiles = createCustomEffectFromFiles;

// Export the extended class as both default and named export
export { WebGLCarouselWithMethods as WebGLCarousel };
export default WebGLCarouselWithMethods;
