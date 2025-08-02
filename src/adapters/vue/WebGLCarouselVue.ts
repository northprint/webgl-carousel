import { defineComponent, h, onMounted, onUnmounted, ref, watch, PropType } from 'vue';
import { WebGLCarousel } from '../../WebGLCarousel';
import type { WebGLCarouselOptions } from '../../types';
import type { BaseEffect } from '../../effects/BaseEffect';

export interface WebGLCarouselVueProps {
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
  onTransitionStart?: (event: { from: number; to: number }) => void;
  onTransitionEnd?: (event: { from: number; to: number }) => void;
  onError?: (error: Error) => void;
  onWebGLContextLost?: () => void;
  onWebGLContextRestored?: () => void;
  onImageLoad?: (event: { index: number; src: string }) => void;
  onImageError?: (event: { index: number; src: string; error: Error }) => void;
  onReady?: () => void;
}

export const WebGLCarouselVue = defineComponent({
  name: 'WebGLCarouselVue',
  props: {
    images: {
      type: Array as PropType<string[]>,
      required: true,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
    interval: {
      type: Number,
      default: 3000,
    },
    transitionDuration: {
      type: Number,
      default: 1000,
    },
    effect: {
      type: [String, Object] as PropType<string | BaseEffect>,
      default: 'fade',
    },
    effects: {
      type: Array as PropType<BaseEffect[]>,
      default: undefined,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
    enableTouch: {
      type: Boolean,
      default: true,
    },
    startIndex: {
      type: Number,
      default: 0,
    },
    fallbackRenderer: {
      type: String as PropType<'canvas2d' | null>,
      default: 'canvas2d',
    },
    webglOptions: {
      type: Object as PropType<WebGLContextAttributes>,
      default: undefined,
    },
    easing: {
      type: Function as PropType<(t: number) => number>,
      default: undefined,
    },
    onTransitionStart: {
      type: Function as PropType<(event: { from: number; to: number }) => void>,
      default: undefined,
    },
    onTransitionEnd: {
      type: Function as PropType<(event: { from: number; to: number }) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: Error) => void>,
      default: undefined,
    },
    onWebGLContextLost: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onWebGLContextRestored: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onImageLoad: {
      type: Function as PropType<(event: { index: number; src: string }) => void>,
      default: undefined,
    },
    onImageError: {
      type: Function as PropType<(event: { index: number; src: string; error: Error }) => void>,
      default: undefined,
    },
    onReady: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const containerRef = ref<HTMLDivElement | null>(null);
    let carousel: WebGLCarousel | null = null;

    const initCarousel = () => {
      if (!containerRef.value || carousel) return;

      const options: WebGLCarouselOptions = {
        container: containerRef.value,
        images: props.images,
        autoplay: props.autoplay,
        autoplayInterval: props.interval,
        transitionDuration: props.transitionDuration,
        effect: typeof props.effect === 'string' ? props.effect : undefined,
        startIndex: props.startIndex,
      };

      // Add custom effects if provided
      if (props.effects) {
        options.effects = props.effects;
      }

      // Add custom effect object if provided
      if (typeof props.effect === 'object') {
        options.effects = [props.effect];
      }

      // Add easing function if provided
      if (props.easing) {
        options.easing = props.easing;
      }

      carousel = new WebGLCarousel(options);

      // Setup event listeners
      if (props.onTransitionStart) {
        carousel.on('transitionStart', (from: number, to: number) => {
          props.onTransitionStart?.({ from, to });
        });
      }
      if (props.onTransitionEnd) {
        carousel.on('transitionEnd', (_index: number) => {
          // Vue component expects different signature
          props.onTransitionEnd?.({ from: 0, to: 0 });
        });
      }
      if (props.onError) {
        carousel.on('error', props.onError);
      }
      // These events are not part of WebGLCarousel's public API
      if (props.onReady) {
        carousel.on('ready', props.onReady);
      }
    };

    const destroyCarousel = () => {
      if (carousel) {
        carousel.destroy();
        carousel = null;
      }
    };

    // Watch for prop changes
    watch(
      () => props.images,
      (newImages) => {
        if (carousel) {
          carousel.updateImages(newImages);
        }
      },
    );

    watch(
      () => props.autoplay,
      (newAutoplay) => {
        if (carousel) {
          if (newAutoplay) {
            carousel.play();
          } else {
            carousel.pause();
          }
        }
      },
    );

    watch(
      () => props.interval,
      (newInterval) => {
        if (carousel) {
          carousel.setAutoplay(props.autoplay, newInterval);
        }
      },
    );

    watch(
      () => props.effect,
      (newEffect) => {
        if (carousel && typeof newEffect === 'string') {
          carousel.setEffect(newEffect);
        }
      },
    );

    onMounted(() => {
      initCarousel();
    });

    onUnmounted(() => {
      destroyCarousel();
    });

    // Expose methods
    const next = () => {
      carousel?.next();
    };

    const previous = () => {
      carousel?.previous();
    };

    const goTo = (index: number) => {
      carousel?.goTo(index);
    };

    const getCurrentIndex = () => {
      return carousel?.getCurrentIndex() ?? 0;
    };

    const getTotalImages = () => {
      return carousel?.getImageCount() ?? 0;
    };

    const setEffect = (effect: string | BaseEffect) => {
      if (carousel && typeof effect === 'string') {
        carousel.setEffect(effect);
      }
    };

    const getAvailableEffects = () => {
      return carousel?.getAvailableEffects() ?? [];
    };

    const registerEffect = (effect: BaseEffect) => {
      // BaseEffect already implements IEffect
      carousel?.registerEffect(effect);
    };

    const play = () => {
      carousel?.play();
    };

    const pause = () => {
      carousel?.pause();
    };

    const isPlaying = () => {
      // WebGLCarousel doesn't have isPlaying method
      return false;
    };

    const setAutoplayInterval = (interval: number) => {
      carousel?.setAutoplay(true, interval);
    };

    const updateImages = (_images: string[]) => {
      // WebGLCarousel doesn't support updating images dynamically
    };

    const isTransitioning = () => {
      // WebGLCarousel doesn't have isTransitioning method
      return false;
    };

    expose({
      next,
      previous,
      goTo,
      getCurrentIndex,
      getTotalImages,
      setEffect,
      getAvailableEffects,
      registerEffect,
      play,
      pause,
      isPlaying,
      setAutoplayInterval,
      updateImages,
      isTransitioning,
    });

    return () =>
      h('div', {
        ref: containerRef,
        class: 'webgl-carousel-container',
        style: {
          width: '100%',
          height: '100%',
          position: 'relative',
        },
      });
  },
});
