/**
 * Export all interface definitions
 * This provides a central location for all public and internal interfaces
 */

// Public interfaces
export type { IWebGLCarousel } from './IWebGLCarousel';
export type {
  ICarouselNavigation,
  ICarouselPlayback,
  ICarouselEffects,
  ICarouselLifecycle,
  ICarouselImages,
} from './IWebGLCarousel';

// Internal interfaces
export type { ICarouselCore } from './ICarouselCore';
export type {
  ICarouselCoreOperations,
  ICarouselCorePlayback,
  ICarouselCoreEffects,
  ICarouselCoreState,
} from './ICarouselCore';

export type { IUIController } from './IUIController';
export type { IImageLoader } from './IImageLoader';
