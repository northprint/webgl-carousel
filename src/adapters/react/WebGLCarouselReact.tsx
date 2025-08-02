import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { WebGLCarousel } from '../../WebGLCarousel';
import type { WebGLCarouselOptions } from '../../WebGLCarousel';
import type { IEffect } from '../../core/EffectManager';

export interface WebGLCarouselReactProps extends Omit<WebGLCarouselOptions, 'container'> {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  // Event handlers
  onReady?: () => void;
  onImageChange?: (index: number) => void;
  onTransitionStart?: (from: number, to: number) => void;
  onTransitionEnd?: (index: number) => void;
  onError?: (error: Error) => void;
  onEffectChange?: (effectName: string) => void;
}

export interface WebGLCarouselReactRef {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  setEffect: (effectName: string) => void;
  getAvailableEffects: () => string[];
  registerEffect: (effect: IEffect) => void;
  play: () => void;
  pause: () => void;
  setTransitionDuration: (duration: number) => void;
  getCurrentIndex: () => number;
  getImageCount: () => number;
  isReady: () => boolean;
}

export const WebGLCarouselReact = forwardRef<WebGLCarouselReactRef, WebGLCarouselReactProps>(
  (props, ref) => {
    const {
      className,
      style,
      width = '100%',
      height = '400px',
      onReady,
      onImageChange,
      onTransitionStart,
      onTransitionEnd,
      onError,
      onEffectChange,
      ...carouselOptions
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<WebGLCarousel | null>(null);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        next: () => carouselRef.current?.next(),
        previous: () => carouselRef.current?.previous(),
        goTo: (index: number) => carouselRef.current?.goTo(index),
        setEffect: (effectName: string) => carouselRef.current?.setEffect(effectName),
        getAvailableEffects: () => carouselRef.current?.getAvailableEffects() || [],
        registerEffect: (effect: IEffect) => carouselRef.current?.registerEffect(effect),
        play: () => carouselRef.current?.play(),
        pause: () => carouselRef.current?.pause(),
        setTransitionDuration: (duration: number) =>
          carouselRef.current?.setTransitionDuration(duration),
        getCurrentIndex: () => carouselRef.current?.getCurrentIndex() || 0,
        getImageCount: () => carouselRef.current?.getImageCount() || 0,
        isReady: () => carouselRef.current?.isReady() || false,
      }),
      [],
    );

    useEffect(() => {
      if (!containerRef.current) return;

      // Create carousel instance
      const carousel = new WebGLCarousel({
        ...carouselOptions,
        container: containerRef.current,
        onImageChange: onImageChange,
        onTransitionStart: onTransitionStart,
        onTransitionEnd: onTransitionEnd,
        onError: onError,
      });

      carouselRef.current = carousel;

      // Set up event listeners
      if (onReady) {
        carousel.on('ready', onReady);
      }

      if (onImageChange) {
        carousel.on('imageChange', onImageChange);
      }

      if (onTransitionStart) {
        carousel.on('transitionStart', onTransitionStart);
      }

      if (onTransitionEnd) {
        carousel.on('transitionEnd', onTransitionEnd);
      }

      if (onError) {
        carousel.on('error', onError);
      }

      if (onEffectChange) {
        carousel.on('effectChange', onEffectChange);
      }

      // Cleanup
      return () => {
        carousel.destroy();
        carouselRef.current = null;
      };
    }, []); // Only run once on mount

    // Handle prop changes that require carousel updates
    useEffect(() => {
      if (!carouselRef.current || !carouselRef.current.isReady()) return;

      if (carouselOptions.effect) {
        if (typeof carouselOptions.effect === 'object') {
          // Register and use custom effect
          carouselRef.current.registerEffect(carouselOptions.effect);
          carouselRef.current.setEffect(carouselOptions.effect.name);
        } else {
          carouselRef.current.setEffect(carouselOptions.effect);
        }
      }
    }, [carouselOptions.effect]);

    useEffect(() => {
      if (!carouselRef.current || !carouselRef.current.isReady()) return;

      if (carouselOptions.autoplay !== undefined) {
        if (carouselOptions.autoplay) {
          carouselRef.current.play();
        } else {
          carouselRef.current.pause();
        }
      }
    }, [carouselOptions.autoplay]);

    useEffect(() => {
      if (!carouselRef.current || !carouselRef.current.isReady()) return;

      if (carouselOptions.transitionDuration !== undefined) {
        carouselRef.current.setTransitionDuration(carouselOptions.transitionDuration);
      }
    }, [carouselOptions.transitionDuration]);

    const containerStyle: React.CSSProperties = {
      width,
      height,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    };

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
        role="region"
        aria-label="Image carousel"
      />
    );
  },
);

WebGLCarouselReact.displayName = 'WebGLCarouselReact';

// Export convenience hooks
export function useWebGLCarousel() {
  const ref = useRef<WebGLCarouselReactRef>(null);

  return {
    ref,
    next: () => ref.current?.next(),
    previous: () => ref.current?.previous(),
    goTo: (index: number) => ref.current?.goTo(index),
    setEffect: (effectName: string) => ref.current?.setEffect(effectName),
    getAvailableEffects: () => ref.current?.getAvailableEffects() || [],
    registerEffect: (effect: IEffect) => ref.current?.registerEffect(effect),
    play: () => ref.current?.play(),
    pause: () => ref.current?.pause(),
    setTransitionDuration: (duration: number) => ref.current?.setTransitionDuration(duration),
    getCurrentIndex: () => ref.current?.getCurrentIndex() || 0,
    getImageCount: () => ref.current?.getImageCount() || 0,
    isReady: () => ref.current?.isReady() || false,
  };
}
