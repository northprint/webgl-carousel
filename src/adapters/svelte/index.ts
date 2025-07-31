// Svelte adapter export wrapper
// The actual Svelte component will be imported by the consumer
export const WebGLCarouselSvelte = 'WebGLCarouselSvelte.svelte';

// For TypeScript support
export interface WebGLCarouselSvelteProps {
  images: string[];
  width?: number;
  height?: number;
  effect?: string;
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
  style?: string;
}