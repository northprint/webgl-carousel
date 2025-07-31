// UMD build entry point - exports everything to global WebGLCarousel namespace
import { WebGLCarousel } from './WebGLCarousel';
import { createCustomEffect } from './effects';

// Export the main class as both default and named export
export { WebGLCarousel };
export default WebGLCarousel;

// Also attach commonly used functions to the class for convenience
(WebGLCarousel as any).createCustomEffect = createCustomEffect;

// Make the constructor available directly on the namespace
export const WebGLCarouselConstructor = WebGLCarousel;