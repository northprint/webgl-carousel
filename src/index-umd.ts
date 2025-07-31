// UMD build entry point - exports everything to global WebGLCarousel namespace
import { WebGLCarousel } from './WebGLCarousel';
import { createCustomEffect } from './effects';

// Export the main class as both default and named export
export { WebGLCarousel };
export default WebGLCarousel;

// Extend WebGLCarousel with static methods
interface WebGLCarouselConstructor {
  new (options: any): WebGLCarousel;
  createCustomEffect: typeof createCustomEffect;
}

// Attach commonly used functions to the class for convenience
(WebGLCarousel as unknown as WebGLCarouselConstructor).createCustomEffect = createCustomEffect;

// Make the constructor available directly on the namespace
export const WebGLCarouselConstructor = WebGLCarousel;
