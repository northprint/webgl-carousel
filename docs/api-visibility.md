# API Visibility Guide

## Overview

This document describes the visibility and access patterns for the WebGL Carousel API.

## Public API

The public API is exposed through interfaces to ensure a stable contract with consumers.

### Main Class: `WebGLCarousel`

Implements: `IWebGLCarousel`

#### Navigation Methods
- `public next(): void` - Navigate to next image
- `public previous(): void` - Navigate to previous image
- `public goTo(index: number): void` - Navigate to specific image
- `public getCurrentIndex(): number` - Get current image index
- `public getImageCount(): number` - Get total image count

#### Playback Methods
- `public play(): void` - Start autoplay
- `public pause(): void` - Pause autoplay
- `public setAutoplay(enabled: boolean, interval?: number): void` - Configure autoplay

#### Effect Methods
- `public setEffect(effectName: string): void` - Set transition effect
- `public getAvailableEffects(): string[]` - Get list of available effects
- `public registerEffect(effect: IEffect): void` - Register custom effect
- `public setTransitionDuration(duration: number): void` - Set transition duration

#### Lifecycle Methods
- `public isReady(): boolean` - Check if carousel is ready
- `public isUsingWebGL(): boolean` - Check if using WebGL renderer
- `public destroy(): void` - Clean up and destroy carousel

#### Image Management
- `public async updateImages(images: string[]): Promise<void>` - Update images
- `public getImages(): string[]` - Get current images

## Internal APIs

These APIs are marked as internal and should not be used directly by consumers.

### CarouselCore

Implements: `ICarouselCore`

All methods are marked `public` but are intended for internal use only:
- `initialize()` - Internal initialization
- `resize()` - Internal resize handling
- `dispose()` - Internal cleanup

### ImageLoader

Implements: `IImageLoader`

Public methods for internal use:
- `load()` - Load single image
- `preload()` - Preload multiple images
- `preloadWithProgress()` - Preload with progress callback
- `clearCache()` - Clear image cache

### UIController

Implements: `IUIController`

Public methods for internal use:
- `updatePagination()` - Update pagination state
- `updateImageCount()` - Update image count
- `setNavigationEnabled()` - Toggle navigation
- `setPaginationEnabled()` - Toggle pagination

## Private Methods

Private methods are prefixed with `private` and are not accessible outside their class:

### WebGLCarousel Private Methods
- `private validateOptions()` - Validate configuration
- `private getContainer()` - Get container element
- `private createCanvas()` - Create canvas element
- `private resizeCanvas()` - Resize canvas
- `private createCore()` - Create carousel core
- `private initialize()` - Initialize carousel
- `private setupEventListeners()` - Setup event listeners
- `private setupUIController()` - Setup UI controller
- `private setupResizeObserver()` - Setup resize observer
- `private registerEffects()` - Register effects
- `private handleError()` - Handle errors
- `private handleResize()` - Handle resize events

### CarouselCore Private Methods
- `private initializeRenderer()` - Initialize WebGL/Canvas renderer
- `private setupStateListeners()` - Setup state event listeners
- `private preloadImages()` - Preload all images
- `private prepareInitialRender()` - Prepare first render
- `private startTransition()` - Start image transition
- `private executeTransition()` - Execute transition animation
- `private animateTransition()` - Animate transition
- `private handleContextLost()` - Handle WebGL context loss
- `private handleContextRestored()` - Handle WebGL context restoration
- `private startAutoplay()` - Start autoplay timer
- `private stopAutoplay()` - Stop autoplay timer
- `private scheduleNextTransition()` - Schedule next transition

## Best Practices

1. **Use Interfaces**: Always program against interfaces (`IWebGLCarousel`) rather than concrete implementations
2. **Avoid Internal APIs**: Do not use methods marked as `@internal` in JSDoc comments
3. **Event-Driven**: Use events for reacting to carousel state changes
4. **Type Safety**: Leverage TypeScript interfaces for type safety
5. **Encapsulation**: Respect private methods and properties

## Migration Guide

If upgrading from a previous version:

1. Replace direct class references with interface types
2. Remove any usage of private methods
3. Use public API methods exclusively
4. Update import statements to use interfaces from `'webgl-carousel/interfaces'`

## Example Usage

```typescript
import { WebGLCarousel, IWebGLCarousel } from 'webgl-carousel';

// Use interface type for references
let carousel: IWebGLCarousel;

// Create instance with concrete class
carousel = new WebGLCarousel({
  container: '#carousel',
  images: ['img1.jpg', 'img2.jpg'],
  effect: 'fade'
});

// Use only public API methods
carousel.next();
carousel.setEffect('slide');
carousel.play();

// Clean up when done
carousel.destroy();
```