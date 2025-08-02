import type { IEffect } from './core/EffectManager';

export interface CarouselState {
  currentIndex: number;
  images: string[];
  isTransitioning: boolean;
  autoplay: boolean;
  currentEffect: string;
}

export interface LoadedImage {
  url: string;
  element: HTMLImageElement;
  width: number;
  height: number;
}

export interface TransitionState {
  from: number;
  to: number;
  progress: number;
  startTime: number;
  duration: number;
}

export interface CarouselTransitionOptions {
  duration?: number;
  effect?: string;
  easing?: (t: number) => number;
}

export interface WebGLCarouselOptions {
  container: string | HTMLElement;
  images: string[];
  effect?: string | IEffect;
  effects?: IEffect[];
  autoplay?: boolean;
  autoplayInterval?: number;
  navigation?: boolean;
  pagination?: boolean;
  loop?: boolean;
  preload?: boolean;
  fallbackToCanvas2D?: boolean;
  transitionDuration?: number;
  startIndex?: number;
  easing?: (t: number) => number;
  onImageChange?: (index: number) => void;
  onTransitionStart?: (from: number, to: number) => void;
  onTransitionEnd?: (index: number) => void;
  onError?: (error: Error) => void;
}

export interface WebGLCarouselEvents extends Record<string, unknown[]> {
  ready: [];
  imageChange: [index: number];
  transitionStart: [from: number, to: number];
  transitionEnd: [index: number];
  error: [error: Error];
  effectChange: [effectName: string];
}
