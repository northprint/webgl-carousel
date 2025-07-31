import { defineComponent, h, onMounted, onUnmounted, ref, watch, PropType } from 'vue';
import { WebGLCarousel } from '../../WebGLCarousel';
import type { WebGLCarouselOptions, CarouselTransitionOptions } from '../../types';
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
        interval: props.interval,
        transitionDuration: props.transitionDuration,
        effect: props.effect,
        effects: props.effects,
        showControls: props.showControls,
        enableTouch: props.enableTouch,
        startIndex: props.startIndex,
        fallbackRenderer: props.fallbackRenderer,
        webglOptions: props.webglOptions,
        easing: props.easing,
      };

      carousel = new WebGLCarousel(options);

      // Setup event listeners
      if (props.onTransitionStart) {
        carousel.on('transitionStart', props.onTransitionStart);
      }
      if (props.onTransitionEnd) {
        carousel.on('transitionEnd', props.onTransitionEnd);
      }
      if (props.onError) {
        carousel.on('error', props.onError);
      }
      if (props.onWebGLContextLost) {
        carousel.on('webglContextLost', props.onWebGLContextLost);
      }
      if (props.onWebGLContextRestored) {
        carousel.on('webglContextRestored', props.onWebGLContextRestored);
      }
      if (props.onImageLoad) {
        carousel.on('imageLoad', props.onImageLoad);
      }
      if (props.onImageError) {
        carousel.on('imageError', props.onImageError);
      }
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
          carousel.setAutoplayInterval(newInterval);
        }
      },
    );

    watch(
      () => props.effect,
      (newEffect) => {
        if (carousel) {
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
    const next = (options?: CarouselTransitionOptions) => {
      carousel?.next(options);
    };

    const previous = (options?: CarouselTransitionOptions) => {
      carousel?.previous(options);
    };

    const goTo = (index: number, options?: CarouselTransitionOptions) => {
      carousel?.goTo(index, options);
    };

    const getCurrentIndex = () => {
      return carousel?.getCurrentIndex() ?? 0;
    };

    const getTotalImages = () => {
      return carousel?.getTotalImages() ?? 0;
    };

    const setEffect = (effect: string | BaseEffect) => {
      carousel?.setEffect(effect);
    };

    const getAvailableEffects = () => {
      return carousel?.getAvailableEffects() ?? [];
    };

    const registerEffect = (effect: BaseEffect) => {
      carousel?.registerEffect(effect);
    };

    const play = () => {
      carousel?.play();
    };

    const pause = () => {
      carousel?.pause();
    };

    const isPlaying = () => {
      return carousel?.isPlaying() ?? false;
    };

    const setAutoplayInterval = (interval: number) => {
      carousel?.setAutoplayInterval(interval);
    };

    const updateImages = (images: string[]) => {
      carousel?.updateImages(images);
    };

    const isTransitioning = () => {
      return carousel?.isTransitioning() ?? false;
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
