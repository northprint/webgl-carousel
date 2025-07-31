import { SvelteComponentTyped } from 'svelte';
import type { BaseEffect } from '../../effects/BaseEffect';
import type { CarouselTransitionOptions } from '../../types';

export interface WebGLCarouselSvelteProps {
  images: string[];
  autoplay?: boolean;
  interval?: number;
  transitionDuration?: number;
  effect?: string | BaseEffect;
  effects?: BaseEffect[];
  showControls?: boolean;
  enableTouch?: boolean;
  startIndex?: number;
  fallbackRenderer?: 'canvas2d' | null;
  webglOptions?: WebGLContextAttributes;
  easing?: (t: number) => number;
  className?: string;
  style?: string;
}

export interface WebGLCarouselSvelteEvents {
  transitionStart: CustomEvent<{ from: number; to: number }>;
  transitionEnd: CustomEvent<{ from: number; to: number }>;
  error: CustomEvent<Error>;
  webglContextLost: CustomEvent<void>;
  webglContextRestored: CustomEvent<void>;
  imageLoad: CustomEvent<{ index: number; src: string }>;
  imageError: CustomEvent<{ index: number; src: string; error: Error }>;
  ready: CustomEvent<void>;
}

export interface WebGLCarouselSvelteSlots {}

export default class WebGLCarouselSvelte extends SvelteComponentTyped<
  WebGLCarouselSvelteProps,
  WebGLCarouselSvelteEvents,
  WebGLCarouselSvelteSlots
> {
  next(options?: CarouselTransitionOptions): void;
  previous(options?: CarouselTransitionOptions): void;
  goTo(index: number, options?: CarouselTransitionOptions): void;
  getCurrentIndex(): number;
  getTotalImages(): number;
  setEffect(effect: string | BaseEffect): void;
  getAvailableEffects(): string[];
  registerEffect(effect: BaseEffect): void;
  play(): void;
  pause(): void;
  isPlaying(): boolean;
  setAutoplayInterval(interval: number): void;
  updateImages(images: string[]): void;
  isTransitioning(): boolean;
}
