<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { WebGLCarousel } from '../../WebGLCarousel';
  import type {
    WebGLCarouselOptions,
    WebGLCarouselEvents,
    CarouselTransitionOptions,
  } from '../../types';
  import type { BaseEffect } from '../../effects/BaseEffect';

  // Props
  export let images: string[];
  export let autoplay: boolean = false;
  export let interval: number = 3000;
  export let transitionDuration: number = 1000;
  export let effect: string | BaseEffect = 'fade';
  export let effects: BaseEffect[] | undefined = undefined;
  export let showControls: boolean = true;
  export let enableTouch: boolean = true;
  export let startIndex: number = 0;
  export let fallbackRenderer: 'canvas2d' | null = 'canvas2d';
  export let webglOptions: WebGLContextAttributes | undefined = undefined;
  export let easing: ((t: number) => number) | undefined = undefined;
  export let className: string = '';
  export let style: string = '';

  // Internal state
  let containerEl: HTMLDivElement;
  let carousel: WebGLCarousel | null = null;
  
  const dispatch = createEventDispatcher<{
    transitionStart: { from: number; to: number };
    transitionEnd: { from: number; to: number };
    error: Error;
    webglContextLost: void;
    webglContextRestored: void;
    imageLoad: { index: number; src: string };
    imageError: { index: number; src: string; error: Error };
    ready: void;
  }>();

  // Lifecycle
  onMount(() => {
    if (!containerEl) return;

    const options: WebGLCarouselOptions = {
      container: containerEl,
      images,
      autoplay,
      interval,
      transitionDuration,
      effect,
      effects,
      showControls,
      enableTouch,
      startIndex,
      fallbackRenderer,
      webglOptions,
      easing,
    };

    carousel = new WebGLCarousel(options);

    // Setup event listeners
    carousel.on('transitionStart', (event) => dispatch('transitionStart', event));
    carousel.on('transitionEnd', (event) => dispatch('transitionEnd', event));
    carousel.on('error', (error) => dispatch('error', error));
    carousel.on('webglContextLost', () => dispatch('webglContextLost'));
    carousel.on('webglContextRestored', () => dispatch('webglContextRestored'));
    carousel.on('imageLoad', (event) => dispatch('imageLoad', event));
    carousel.on('imageError', (event) => dispatch('imageError', event));
    carousel.on('ready', () => dispatch('ready'));
  });

  onDestroy(() => {
    if (carousel) {
      carousel.destroy();
      carousel = null;
    }
  });

  // Reactive statements
  $: if (carousel && images) {
    carousel.updateImages(images);
  }

  $: if (carousel) {
    if (autoplay) {
      carousel.play();
    } else {
      carousel.pause();
    }
  }

  $: if (carousel && interval) {
    carousel.setAutoplayInterval(interval);
  }

  $: if (carousel && effect) {
    carousel.setEffect(effect);
  }

  // Public methods
  export function next(options?: CarouselTransitionOptions) {
    carousel?.next(options);
  }

  export function previous(options?: CarouselTransitionOptions) {
    carousel?.previous(options);
  }

  export function goTo(index: number, options?: CarouselTransitionOptions) {
    carousel?.goTo(index, options);
  }

  export function getCurrentIndex(): number {
    return carousel?.getCurrentIndex() ?? 0;
  }

  export function getTotalImages(): number {
    return carousel?.getTotalImages() ?? 0;
  }

  export function setEffect(newEffect: string | BaseEffect) {
    carousel?.setEffect(newEffect);
  }

  export function getAvailableEffects(): string[] {
    return carousel?.getAvailableEffects() ?? [];
  }

  export function registerEffect(newEffect: BaseEffect) {
    carousel?.registerEffect(newEffect);
  }

  export function play() {
    carousel?.play();
  }

  export function pause() {
    carousel?.pause();
  }

  export function isPlaying(): boolean {
    return carousel?.isPlaying() ?? false;
  }

  export function setAutoplayInterval(newInterval: number) {
    carousel?.setAutoplayInterval(newInterval);
  }

  export function updateImages(newImages: string[]) {
    carousel?.updateImages(newImages);
  }

  export function isTransitioning(): boolean {
    return carousel?.isTransitioning() ?? false;
  }
</script>

<div
  bind:this={containerEl}
  class="webgl-carousel-container {className}"
  {style}
  role="region"
  aria-label="Image carousel"
/>

<style>
  .webgl-carousel-container {
    width: 100%;
    height: 100%;
    position: relative;
  }
</style>