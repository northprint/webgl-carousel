import type { WebGLCarouselOptions, IEffect } from '../types';
import { ANIMATION_CONSTANTS, VALIDATION_CONSTANTS } from './magic-numbers';

/**
 * Default configuration values for WebGL Carousel
 */
export const DEFAULT_CONFIG = {
  effect: 'fade',
  effects: [] as IEffect[],
  autoplay: false,
  autoplayInterval: ANIMATION_CONSTANTS.DEFAULT_AUTOPLAY_INTERVAL,
  navigation: true,
  pagination: true,
  loop: true,
  preload: true,
  fallbackToCanvas2D: true,
  transitionDuration: ANIMATION_CONSTANTS.DEFAULT_TRANSITION_DURATION,
  startIndex: 0,
  easing: (t: number): number => t,
} as const;

/**
 * Default callback functions
 */
export const DEFAULT_CALLBACKS = {
  onImageChange: () => {},
  onTransitionStart: () => {},
  onTransitionEnd: () => {},
  onError: () => {},
} as const;

/**
 * Get default options with type safety
 */
export function getDefaultOptions(options: WebGLCarouselOptions): Required<WebGLCarouselOptions> {
  return {
    container: options.container,
    images: options.images,
    effect: options.effect ?? DEFAULT_CONFIG.effect,
    effects: options.effects ?? DEFAULT_CONFIG.effects,
    autoplay: options.autoplay ?? DEFAULT_CONFIG.autoplay,
    autoplayInterval: options.autoplayInterval ?? DEFAULT_CONFIG.autoplayInterval,
    navigation: options.navigation ?? DEFAULT_CONFIG.navigation,
    pagination: options.pagination ?? DEFAULT_CONFIG.pagination,
    loop: options.loop ?? DEFAULT_CONFIG.loop,
    preload: options.preload ?? DEFAULT_CONFIG.preload,
    fallbackToCanvas2D: options.fallbackToCanvas2D ?? DEFAULT_CONFIG.fallbackToCanvas2D,
    transitionDuration: options.transitionDuration ?? DEFAULT_CONFIG.transitionDuration,
    startIndex: options.startIndex ?? DEFAULT_CONFIG.startIndex,
    easing: options.easing ?? DEFAULT_CONFIG.easing,
    onImageChange: options.onImageChange ?? DEFAULT_CALLBACKS.onImageChange,
    onTransitionStart: options.onTransitionStart ?? DEFAULT_CALLBACKS.onTransitionStart,
    onTransitionEnd: options.onTransitionEnd ?? DEFAULT_CALLBACKS.onTransitionEnd,
    onError: options.onError ?? DEFAULT_CALLBACKS.onError,
  };
}

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  MIN_IMAGES: VALIDATION_CONSTANTS.MIN_IMAGE_COUNT,
  MIN_AUTOPLAY_INTERVAL: ANIMATION_CONSTANTS.MIN_AUTOPLAY_INTERVAL,
  MIN_TRANSITION_DURATION: ANIMATION_CONSTANTS.MIN_TRANSITION_DURATION,
  MAX_TRANSITION_DURATION: ANIMATION_CONSTANTS.MAX_TRANSITION_DURATION,
} as const;

/**
 * CSS animation defaults
 */
export const CSS_DEFAULTS = {
  NAVIGATION: {
    fontSize: '2rem',
    padding: '0.5rem 1rem',
    zIndex: 10,
    transitionDuration: '0.3s',
    offset: '1rem',
  },
  PAGINATION: {
    dotSize: '0.75rem',
    borderWidth: '2px',
    gap: '0.5rem',
    zIndex: 10,
    bottomOffset: '1rem',
    transitionDuration: '0.3s',
  },
} as const;
